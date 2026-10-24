const Razorpay = require('razorpay');
const crypto = require('crypto');
const {
  validateWebhookSignature,
} = require('razorpay/dist/utils/razorpay-utils');
const Order = require('../models/orderModel');
const WebhookEvent = require('../models/webhookEventModel');
const logger = require('../utils/logger');

// Lazily create the Razorpay client on first use. Building it at module load
// throws when the keys are unset, which would crash the entire server at boot
// (taking down auth/orders too) — so we defer it to the payment endpoints.
let razorpayClient = null;
const getRazorpay = () => {
  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      throw new Error('Razorpay credentials are not configured');
    }
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
  }
  return razorpayClient;
};

// Constant-time compare so the signature check leaks no timing information.
const signatureMatches = (expected, received) => {
  if (typeof received !== 'string') return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// @desc    Start a payment for one of the caller's own orders
// @route   POST /payment
// @access  Private (customer, order owner)
//
// The client names an order; it never states an amount. The amount is read
// from the order the server already priced from the launderer's catalog.
const createOrder = async (req, resp) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return resp.status(400).json({ message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return resp.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to pay for this order' });
    }
    if (order.paid) {
      return resp.status(409).json({ message: 'Order is already paid' });
    }

    // Paise, derived server-side. Never from the request body.
    const amount = Math.round(Number(order.orderTotal) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      logger.error(`Order ${order._id} has an unpayable total`, {
        orderTotal: order.orderTotal,
      });
      return resp.status(422).json({ message: 'Order total is not payable' });
    }

    const rzpOrder = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: String(order._id),
    });
    if (!rzpOrder) {
      return resp
        .status(502)
        .json({ message: 'Failed to create payment order' });
    }

    // Bind the gateway's order to ours so confirmation can be verified.
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    return resp.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (err) {
    logger.error(`Razorpay createOrder failed: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Payment initialization failed' });
  }
};

// @desc    Confirm a payment and mark the order paid
// @route   PUT /payment/validate
// @access  Private (customer, order owner)
//
// The order is resolved from razorpay_order_id — which the signature covers —
// rather than from a client-supplied id. Previously the caller passed the
// order to mark paid, so a genuine signature from any cheap payment could be
// replayed to settle any order in the system.
const validatePayment = async (req, resp) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return resp
        .status(400)
        .json({ message: 'Incomplete payment confirmation' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!signatureMatches(expected, razorpay_signature)) {
      logger.warn(
        `Payment signature mismatch for razorpay order ${razorpay_order_id}`
      );
      return resp.status(401).json({ message: 'Invalid signature' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      logger.warn(
        `Valid signature for an unknown razorpay order ${razorpay_order_id}`
      );
      return resp
        .status(404)
        .json({ message: 'No order matches this payment' });
    }
    if (order.user.toString() !== req.user.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to pay for this order' });
    }

    // Idempotent: a retry, a double-click, or a later webhook must not
    // re-apply the transition or report failure.
    if (!order.paid) {
      order.paid = true;
      order.paymentId = razorpay_payment_id;
      await order.save();
    }

    return resp.json({
      message: 'Payment successful',
      orderId: order._id,
      paymentId: order.paymentId,
    });
  } catch (err) {
    logger.error(`Payment validation failed: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Payment validation failed' });
  }
};

// Pull the Razorpay order id, payment id and amount out of either event
// shape. payment.captured carries only the payment entity; order.paid carries
// the order entity as well, and both fire when a payment is captured.
const extract = (body) => {
  const payment = body?.payload?.payment?.entity;
  const order = body?.payload?.order?.entity;
  return {
    razorpayOrderId: payment?.order_id || order?.id || '',
    razorpayPaymentId: payment?.id || '',
    // Paise, the same unit createOrder sends to the Orders API.
    amount: typeof payment?.amount === 'number' ? payment.amount : null,
  };
};

// @desc    Receive a payment confirmation from Razorpay
// @route   POST /payment/webhook
// @access  Public (authenticated by signature, not by session)
//
// This is the authoritative confirmation path. The browser handler that calls
// /payment/validate is a UI hint: if the customer closes the tab after paying,
// it never runs, and the order would otherwise stay unpaid forever. Razorpay
// calls this regardless, and retries for 24 hours until we answer 2xx.
const handleWebhook = async (req, resp) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET is not set; rejecting webhook');
    return resp.status(500).json({ message: 'Webhook not configured' });
  }

  // The signature covers the raw bytes, so the route is mounted with a raw
  // body parser. Re-serialising a parsed object is not byte-identical and
  // would fail verification for some payloads.
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const signature = req.get('x-razorpay-signature');

  let valid = false;
  try {
    valid = validateWebhookSignature(raw, signature, secret);
  } catch (err) {
    valid = false;
  }
  if (!valid) {
    logger.warn('Rejected a Razorpay webhook with an invalid signature');
    return resp.status(400).json({ message: 'Invalid signature' });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    return resp.status(400).json({ message: 'Malformed payload' });
  }

  // Unique per event; the documented way to spot a re-delivery.
  const eventId = req.get('x-razorpay-event-id') || '';
  const event = body.event || '';
  const { razorpayOrderId, razorpayPaymentId, amount } = extract(body);

  const record = async (outcome, order = null) => {
    try {
      await WebhookEvent.create({
        eventId: eventId || `${event}:${razorpayPaymentId}:${Date.now()}`,
        event,
        razorpayOrderId,
        razorpayPaymentId,
        order: order ? order._id : null,
        outcome,
        amount: amount || 0,
        payload: body,
      });
    } catch (err) {
      // A duplicate key here means a concurrent delivery of the same event
      // won the race. That is the idempotency working, not a failure.
      if (err.code !== 11000) throw err;
    }
  };

  try {
    if (eventId && (await WebhookEvent.exists({ eventId }))) {
      logger.info(`Ignoring duplicate Razorpay event ${eventId}`);
      return resp.status(200).json({ status: 'duplicate' });
    }

    // Only capture events settle an order. payment.failed in particular must
    // not mark anything failed: Razorpay documents a failed event being
    // followed by a captured one for the same transaction.
    if (event !== 'payment.captured' && event !== 'order.paid') {
      await record('ignored');
      return resp.status(200).json({ status: 'ignored' });
    }

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      logger.warn(
        `Razorpay event ${event} for unknown order ${razorpayOrderId}`
      );
      await record('unmatched');
      // 200: retrying for 24 hours will not make an order we never created
      // appear, and a failing endpoint eventually gets disabled.
      return resp.status(200).json({ status: 'unmatched' });
    }

    // Reconcile what was actually paid against what we asked for. A mismatch
    // is not a rounding problem, it is either a bug or tampering, so the
    // order is left unpaid and the event is recorded for investigation.
    const expected = Math.round(Number(order.orderTotal) * 100);
    if (amount !== null && amount !== expected) {
      logger.error(
        `Payment amount mismatch on order ${order._id}: ` +
          `expected ${expected} paise, received ${amount} paise`
      );
      await record('amount_mismatch', order);
      return resp.status(200).json({ status: 'amount_mismatch' });
    }

    if (!order.paid) {
      order.paid = true;
      order.paymentId = razorpayPaymentId;
      await order.save();
      logger.info(`Order ${order._id} marked paid by webhook ${event}`);
    }
    await record('applied', order);
    return resp.status(200).json({ status: 'applied' });
  } catch (err) {
    logger.error(`Razorpay webhook failed: ${err.message}`, {
      stack: err.stack,
    });
    // 5xx so Razorpay retries — this one really might succeed next time.
    return resp.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = { createOrder, validatePayment, handleWebhook };
