const Order = require('../models/orderModel');
const User = require('../models/userModel');
const CatalogItem = require('../models/catalogModel');
const Review = require('../models/reviewModel');
const logger = require('../utils/logger');

// @desc    A launderer's own analytics
// @route   GET /launderer/analytics
// @access  Private (launderer)
const getLaundererAnalytics = async (req, resp) => {
  try {
    const orders = await Order.find({ launderer: req.user.username });
    const [catalogItems, reviews] = await Promise.all([
      CatalogItem.countDocuments({ launderer: req.user.user_id }),
      Review.find({ launderer: req.user.user_id }),
    ]);
    const revenue = orders
      .filter((o) => o.paid)
      .reduce((sum, o) => sum + (o.orderTotal || 0), 0);
    const avgRating = reviews.length
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;
    return resp.status(200).json({
      analytics: {
        totalOrders: orders.length,
        pending: orders.filter((o) => !o.acceptedStatus).length,
        inProgress: orders.filter((o) => o.acceptedStatus && !o.deliveredStatus)
          .length,
        delivered: orders.filter((o) => o.deliveredStatus).length,
        revenue,
        catalogItems,
        avgRating,
        reviewCount: reviews.length,
      },
    });
  } catch (err) {
    logger.error(`getLaundererAnalytics error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching analytics' });
  }
};

// @desc    Set the launderer's own available time slots
// @route   PUT /launderer/availability
// @access  Private (launderer)
const setAvailability = async (req, resp) => {
  try {
    const { timeSlots } = req.body;
    if (!Array.isArray(timeSlots)) {
      return resp.status(400).json({ message: 'timeSlots must be an array' });
    }
    const cleaned = [
      ...new Set(timeSlots.map((t) => String(t).trim()).filter(Boolean)),
    ];
    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      { availableTimeSlots: cleaned },
      { new: true }
    ).select('-password -__v');
    return resp
      .status(200)
      .json({ availableTimeSlots: user.availableTimeSlots });
  } catch (err) {
    logger.error(`setAvailability error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error updating availability' });
  }
};

// @desc    Set the launderer's express-service surcharge (0 = not offered)
// @route   PUT /launderer/express
// @access  Private (launderer)
const setExpress = async (req, resp) => {
  try {
    const surcharge = Number(req.body.expressSurcharge);
    if (Number.isNaN(surcharge) || surcharge < 0) {
      return resp.status(400).json({ message: 'Invalid express surcharge' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      { expressSurcharge: surcharge },
      { new: true }
    ).select('-password -__v');
    return resp.status(200).json({ expressSurcharge: user.expressSurcharge });
  } catch (err) {
    logger.error(`setExpress error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error updating express service' });
  }
};

// @desc    Get all orders placed with this launderer
// @route   GET /allorders
// @access  Private (launderer)
const getAllOrders = async (req, resp) => {
  try {
    const orders = await Order.find({
      launderer: req.user.username,
    }).populate('user', '-password -__v');
    return resp.status(200).json({ orders });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching the orders' });
  }
};

// @desc    Get this launderer's orders for a particular student
// @route   GET /orders/:username
// @access  Private (launderer)
const getOrdersByStudent = async (req, resp) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return resp.status(404).json({ message: 'Student not found' });
    }
    // Scoped to the relationship, not just the role. Previously this returned
    // every order that student had ever placed, including ones with competing
    // launderers, to any launderer who asked.
    const orders = await Order.find({
      user: user._id,
      launderer: req.user.username,
    });
    return resp.status(200).json({ orders });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching the orders' });
  }
};

// @desc    Accept an order
// @route   PUT /acceptorder/:order_id
// @access  Private (launderer, own order)
const updateOrderAccept = async (req, resp) => {
  try {
    const { order } = req;
    if (order.acceptedStatus) {
      return resp.status(400).json({ message: 'Order is already accepted.' });
    }
    order.acceptedStatus = true;
    await order.save();
    return resp.status(200).json({ updatedOrder: order });
  } catch (err) {
    logger.error(`updateOrderAccept error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error accepting the order' });
  }
};

// @desc    Reject a previously accepted order
// @route   PUT /rejectorder/:order_id
// @access  Private (launderer, own order)
const updateOrderReject = async (req, resp) => {
  try {
    const { order } = req;
    if (order.pickUpStatus) {
      return resp
        .status(400)
        .json({ message: 'Order is picked up, cannot be rejected.' });
    }
    order.acceptedStatus = false;
    await order.save();
    return resp
      .status(201)
      .json({ message: 'Order rejected successfully', updatedOrder: order });
  } catch (err) {
    logger.error(`updateOrderReject error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error rejecting the order' });
  }
};

// @desc    Mark an order delivered
// @route   PUT /updatedeliveredstatus/:order_id
// @access  Private (launderer, own order)
const updateDeliveredStatus = async (req, resp) => {
  try {
    const { order } = req;
    if (!order.acceptedStatus) {
      return resp.status(400).json({ message: 'Order is not accepted yet.' });
    }
    if (!order.pickUpStatus) {
      return resp.status(400).json({ message: 'Order is not picked up yet.' });
    }
    if (order.deliveredStatus) {
      return resp.status(400).json({ message: 'Order is already delivered.' });
    }
    order.deliveredStatus = true;
    await order.save();
    return resp.status(200).json({ updatedOrder: order });
  } catch (err) {
    logger.error(`updateDeliveredStatus error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error updating the order' });
  }
};

// @desc    Change an order's delivery date
// @route   PUT /updatedeliverydate/:order_id
// @access  Private (launderer, own order)
const updateOrderDeliveryDate = async (req, resp) => {
  try {
    const { order } = req;
    const { deliveryDate } = req.body;
    if (!deliveryDate) {
      return resp.status(400).json({ message: 'deliveryDate is required' });
    }
    order.deliveryDate = deliveryDate;
    await order.save();
    return resp.status(201).json({ updatedOrder: order });
  } catch (err) {
    logger.error(`updateOrderDeliveryDate error: ${err.message}`, {
      stack: err.stack,
    });
    return resp
      .status(500)
      .json({ message: 'Error updating the delivery date' });
  }
};

module.exports = {
  getLaundererAnalytics,
  setAvailability,
  setExpress,
  getAllOrders,
  getOrdersByStudent,
  updateOrderAccept,
  updateOrderReject,
  updateOrderDeliveryDate,
  updateDeliveredStatus,
};
