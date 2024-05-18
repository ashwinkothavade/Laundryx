const Order = require("../models/orderModel");

// @desc    Get all orders
// @route   GET /allorders
// @access  Private
// when accepted and delivery status are marked as true, the orders will be deleted automatically from the database.
const getAllOrders = async (req, res) => {
  try {
    if (req.user.role === "launderer") {
      const result = await Order.find();
      res.send(result);
    } else {
        throw new Error("User does not have access rights")
    }
  } catch (err) {
    res.send(err);
  }
};

// @desc    Get orders of a particular user
// @route   GET /orders
// @access  Private
const getOrdersByStudent = async (req, res) => {
  try {
    const result = await Order.find({ user: req.user.id });
    res.send(result);
  } catch (err) {
    res.send(err);
  }
};

// @desc    Delete orders as soon as they are completed/delivered
// @route   DELETE / orders
// @access  Private
const deleteOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({
      acceptedStatus: true,
      deliveredStatus: true,
    });
    res.status(200).send({
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.send(err);
  }
};

module.exports = {
  getAllOrders,
  getOrdersByStudent,
  deleteOrders,
};
