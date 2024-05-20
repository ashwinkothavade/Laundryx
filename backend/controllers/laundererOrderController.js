const Order = require("../models/orderModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// @desc    Get all orders
// @route   GET /allorders
// @access  Private
// when accepted and delivery status are marked as true, the orders will be deleted automatically from the database.
const getAllOrders = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== "launderer") {
      resp.status(401).json({
        message: "User does not have access rights",
      });
    } else {
      //the role is launderer, and the route can now be accessed.
      const result = await Order.find();
      resp.status(200).json({
        orders: result
      });
    }
  } catch (err) {
    console.error(err);
    resp.status(401).json({ message: err });
  }
};

// @desc    Get orders of a particular user
// @route   GET /orders/:username
// @access  Private
const getOrdersByStudent = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role !== "launderer") {
      resp.status(401).json({
        message: "User does not have access rights",
      });
    } else {
      //the role is launderer, and the route can now be accessed.
      // Get the username of the student, search in the database for the orders with the username
      const username = req.params.username;
      const user = await User.findOne({ username: username });
      const userId = user._id;
      const result = await Order.find({ user: userId });
      resp.status(200).json({
        orders: result
      });
    }
  } catch (err) {
    console.error(err);
    resp.status(401).json({ message: err });
  }
};

// @desc    Delete orders as soon as they are completed/delivered
// @route   DELETE /orders
// @access  Private
const deleteOrders = async (req, resp) => {
  try {
    const result = await Order.deleteMany({
      acceptedStatus: true,
      deliveredStatus: true,
      paid: true
    });
    resp.status(200).json({
      deletedCount: result.deletedCount,
      message: "Orders deleted successfully"
    });
  } catch (err) {
    resp.status(401).json({
      message: err,
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
    if (decodedToken.role !== "launderer") {
      resp.status(401).json({
        message: "User does not have access rights"
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now accept the order
      const orderId = req.params.order_id;
      const result = await Order.findByIdAndUpdate(orderId, {
        acceptedStatus: true,
      });
      result.save();
      resp.status(200).json({
        updatedOrder: result,
      });
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
    if (decodedToken.role !== "launderer") {
      resp.status(401).json({
        message: "User does not have access rights",
      });
    } else {
      // the role is launderer, and the route can now be accessed.
      // launderer can now reject the order
      const orderId = req.params.order_id;
      const result = await Order.findByIdAndUpdate(orderId, {
        acceptedStatus: false,
      });
      result.save();
      resp.status(201).json({
        updatedOrder: result,
      });
    }
  } catch(err) {
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
    if (decodedToken.role !== "launderer") {
      resp.status(401).json({
        message: "User does not have access rights"
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
        updatedOrder: result
      });
    }
  } catch(err) {
    resp.status(401).json({
      message: err,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByStudent,
  deleteOrders,
  updateOrderAccept,
  updateOrderReject,
  updateOrderDeliveryDate,
};
