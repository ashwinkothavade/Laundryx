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

const createOrder = async (req, resp) => {
  try {
    const options = req.body;
    const order = await getRazorpay().orders.create(options);
    if (!order) {
      return resp.status(400).json({
        message: 'Failed to create payment order',
      });
    }
    return resp.json(order);
  } catch (err) {
    logger.error(`Razorpay createOrder failed: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Payment initialization failed' });
  }
};

const validatePayment = async (req, resp) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body;
    const sha = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest('hex');

    if (digest !== razorpay_signature) {
      return resp.status(401).json({
        message: 'Invalid signature',
      });
    }
    const updatedOrder = await Order.findByIdAndUpdate(order_id, {
      paid: true,
    });
    if (!updatedOrder) {
      return resp.status(404).json({ message: 'Order not found' });
    }
    return resp.json({
      message: 'Payment successful',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    logger.error(`Payment validation failed: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Payment validation failed' });
  }
};

module.exports = { createOrder, validatePayment };
