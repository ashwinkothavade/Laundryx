const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/orderModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const createOrder = async (req, resp) => {
  try {
    const options = req.body;
    const order = await razorpay.orders.create(options);
    if (!order) {
      return resp.status(401).json({
        message: 'Some error occurred',
      });
    }
    resp.json(order);
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
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
    updatedOrder.save();
    resp.json({
      message: 'Payment successful',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
  }
};

module.exports = { createOrder, validatePayment };
