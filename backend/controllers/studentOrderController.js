const jwt = require('jsonwebtoken');
const Order = require('../models/orderModel');

// @desc    Get all orders of a student
// @route   GET /student/myorders
// @access  Private
const getStudentOrders = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const studentId = decodedToken.user_id; // avoiding database call by storing the user_id in the token
    const result = await Order.find({
      user: studentId,
    });
    resp.status(200).json({
      orders: result,
    });
  } catch (err) {
    console.error(err);
    resp.status(401).json({
      message: 'Unauthorized',
    });
  }
};

// @desc    Create a new order
// @route   POST /student/createorder
// @access  Private
const createStudentOrder = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const studentId = decodedToken.user_id; // avoiding database call by storing the user_id in the token
    const {
      items,
      deliveryDate,
      pickupAddress,
      deliveryAddress,
      totalAmount,
      pickupDate,
    } = req.body;
    // all the items validation is done in the frontend without any anomaly.
    const order = new Order({
      user: studentId,
      items,
      deliveryDate,
      pickupAddress,
      deliveryAddress,
      totalAmount,
      pickupDate,
    });
    await order.save();
    resp.status(201).json({
      order,
    });
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error creating the order',
      error: err,
    });
  }
};

// @desc    Update the pickup status of an order
// @route   PUT /student/updatepickupstatus/:order_id
// @access  Private
const updatePickupStatus = async (req, resp) => {
  try {
    const orderId = req.params.order_id;
    const order = await Order.findById(orderId);
    if (order === null) {
      return resp.status(404).json({
        message: 'Order not found',
      });
    }
    if (order.acceptedStatus === false) {
      return resp.status(400).json({
        message: 'Order not accepted yet',
      });
    }
    if (order.pickUpStatus === true) {
      return resp.status(400).json({
        message: 'Order already picked up',
      });
    }
    order.pickUpStatus = true;
    order.save();
    resp.status(200).json({
      message: 'Pickup status updated successfully',
      order,
    });
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error updating the pickup status',
      error: err,
    });
  }
};

// @desc    Delete an order
// @route   DELETE /student/deleteorder/:order_id
// @access  Private
const deleteOrder = async (req, resp) => {
  try {
    const orderId = req.params.order_id;

    const result = await Order.findByIdAndDelete(orderId);
    if (!result) {
      return resp.status(404).json({
        message: 'Order not found',
      });
    }

    resp.status(200).json({
      message: 'Order deleted successfully',
      order: result,
    });
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error deleting the order',
      error: err,
    });
  }
};

// @desc    Update the delivery status of an order
// @route   PUT /student/updatedeliverystatus/:order_id
// @access  Private
const updateDeliveryStatus = async (req, resp) => {
  try {
    const orderId = req.params.order_id;
    const order = await Order.findById(orderId);
    if (order.pickUpStatus === false) {
      return resp.status(400).json({
        message: 'Order not picked up yet',
      });
    }
    if (order.acceptedStatus === false) {
      return resp.status(400).json({
        message: 'Order not accepted yet',
      });
    }
    if (order.deliveredStatus === true) {
      return resp.status(400).json({
        message: 'Order already delivered',
      });
    }
    order.deliveredStatus = true;
    order.save();
    resp.status(200).json({
      message: 'Delivery status updated successfully',
      order,
    });
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error updating the delivery status',
      error: err,
    });
  }
};

module.exports = {
  getStudentOrders,
  createStudentOrder,
  updatePickupStatus,
  deleteOrder,
  updateDeliveryStatus,
};
