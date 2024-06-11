const jwt = require('jsonwebtoken');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

// @desc    Get all orders
// @route   GET /allorders
// @access  Private
// when accepted and delivery status are marked as true, the orders will be deleted automatically from the database.
const getAllOrders = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      const orders = await Order.find({
        launderer: decodedToken.username,
      }).populate('user', '-password -__v');
      resp.status(200).json({
        orders,
      });
    }
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error fetching the orders',
      error: err,
    });
  }
};

// @desc    Get orders of a particular user
// @route   GET /orders/:username
// @access  Private
const getOrdersByStudent = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed
      // Get the username of the student, search in the database for the orders with the username
      const { username } = req.params;
      const user = await User.findOne({ username });
      const userId = user._id;
      const result = await Order.find({ user: userId });
      resp.status(200).json({
        orders: result,
      });
    }
  } catch (err) {
    console.error(err);
    resp.status(500).json({
      message: 'Error fetching the orders',
      error: err,
    });
  }
};

// @desc    Update Order status as accepted by the launderer
// @route   PUT /acceptorder/:order_id
// @access  Private
const updateOrderAccept = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now accept the order
      const orderId = req.params.order_id;
      const order = await Order.findById(orderId);
      if (order.acceptedStatus === true) {
        resp.status(400).json({
          message: 'Order is already accepted.',
        });
      } else {
        order.acceptedStatus = true;
        order.save();
        resp.status(200).json({
          updatedOrder: order,
        });
      }
    }
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
  }
};

// @desc    Update Order accepted status as again rejected by the launderer
// @route   PUT /rejectorder/:order_id
// @access  Private
const updateOrderReject = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now reject the order
      const orderId = req.params.order_id;
      const order = await Order.findById(orderId);
      if (order.pickUpStatus === true) {
        resp.status(400).json({
          message: 'Order is picked up, cannot be rejected.',
        });
      } else {
        order.acceptedStatus = false;
        order.save();
        resp.status(201).json({
          message: 'Order rejected successfully',
          updatedOrder: order,
        });
      }
    }
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
  }
};

// @desc    Update Order Delivery Status by the launderer
// @route   PUT /updatedeliveredstatus/:order_id
// @access  Private
const updateDeliveredStatus = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now set the delivered status of the order to be true
      const orderId = req.params.order_id;
      const order = await Order.findById(orderId);
      if (order.acceptedStatus === false) {
        resp.status(400).json({
          message: 'Order is not accepted yet.',
        });
      } else if (order.pickUpStatus === false) {
        resp.status(400).json({
          message: 'Order is not picked up yet.',
        });
      } else if (order.deliveredStatus === true) {
        resp.status(400).json({
          message: 'Order is already delivered.',
        });
      } else {
        order.deliveredStatus = true;
        order.save();
        resp.status(200).json({
          updatedOrder: order,
        });
      }
    }
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
  }
};

// @desc    Update Order Delivery Date by the launderer
// @route   PUT /updatedeliverydate/:order_id
// @access  Private
const updateOrderDeliveryDate = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== 'launderer') {
      resp.status(401).json({
        message: 'User does not have access rights',
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now update the delivery date
      const orderId = req.params.order_id;
      const result = await Order.findByIdAndUpdate(orderId, {
        deliveryDate: req.body.deliveryDate,
      });
      result.save();
      resp.status(201).json({
        updatedOrder: result,
      });
    }
  } catch (err) {
    resp.status(401).json({
      message: err,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByStudent,
  updateOrderAccept,
  updateOrderReject,
  updateOrderDeliveryDate,
  updateDeliveredStatus,
};
