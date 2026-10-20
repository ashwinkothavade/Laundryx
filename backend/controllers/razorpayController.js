const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/orderModel');
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

module.exports = { createOrder, validatePayment };
