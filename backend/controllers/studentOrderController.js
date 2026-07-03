const Order = require('../models/orderModel');
const User = require('../models/userModel');
const CatalogItem = require('../models/catalogModel');
const Setting = require('../models/settingModel');
const logger = require('../utils/logger');
// @desc    Get all orders of a student
// @route   GET /student/orders
// @access  Private
const getStudentOrders = async (req, resp) => {
  try {
    const decodedToken = req.user;
    const studentId = decodedToken.user_id; // avoiding database call by storing the user_id in the token
    const result = await Order.find({
      user: studentId,
    });
    resp.status(200).json({
      orders: result,
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
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
    const decodedToken = req.user;
    const studentId = decodedToken.user_id; // avoiding database call by storing the user_id in the token
    if (decodedToken.role !== 'student') {
      return resp.status(401).json({
        message: 'User does not have access rights',
      });
    }
    const {
      items,
      deliveryDate,
      deliveryTime,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      pickupTime,
      launderer,
    } = req.body;
    // Backend validation — never trust the client. The frontend also validates,
    // but that is bypassable, so the required fields are re-checked here.
    if (!Array.isArray(items) || items.length === 0) {
      return resp.status(400).json({
        message: 'Order must contain at least one item',
      });
    }
    const requiredFields = {
      deliveryDate,
      deliveryTime,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      pickupTime,
      launderer,
    };
    const missingField = Object.keys(requiredFields).find(
      (key) => !requiredFields[key]
    );
    if (missingField) {
      return resp.status(400).json({
        message: `Missing required field: ${missingField}`,
      });
    }
    const laundererUser = await User.findOne({
      username: launderer,
      role: 'launderer',
      approved: true,
    });
    if (!laundererUser) {
      return resp.status(404).json({
        message: 'Launderer not found or not accepting orders',
      });
    }

    // Validate addresses and time slots against the dynamic, admin-managed
    // settings (nothing is hardcoded, and the client can't invent values).
    const [locationSetting, timeSetting] = await Promise.all([
      Setting.findOne({ key: 'locations' }),
      Setting.findOne({ key: 'timeSlots' }),
    ]);
    const locations = locationSetting ? locationSetting.values : [];
    // Prefer the launderer's own available slots; fall back to the global ones.
    const timeSlots =
      laundererUser.availableTimeSlots &&
      laundererUser.availableTimeSlots.length
        ? laundererUser.availableTimeSlots
        : (timeSetting && timeSetting.values) || [];
    if (![pickupAddress, deliveryAddress].every((a) => locations.includes(a))) {
      return resp
        .status(400)
        .json({ message: 'Invalid pickup/delivery location' });
    }
    if (![pickupTime, deliveryTime].every((t) => timeSlots.includes(t))) {
      return resp.status(400).json({ message: 'Invalid pickup/delivery time' });
    }

    // Price every item from the chosen launderer's catalog server-side, so the
    // client cannot tamper with prices or the order total.
    const catalog = await CatalogItem.find({ launderer: laundererUser._id });
    const priceOf = new Map(
      catalog.map((c) => [`${c.clothingType}||${c.washType}`, c.price])
    );
    let orderTotal = 0;
    const pricedItems = [];
    for (let i = 0; i < items.length; i += 1) {
      const { name, washType, quantity } = items[i];
      const qty = Number(quantity);
      if (!name || !washType || !Number.isInteger(qty) || qty <= 0) {
        return resp
          .status(400)
          .json({ message: 'Each item needs a name, wash type and quantity' });
      }
      const price = priceOf.get(`${name}||${washType}`);
      if (price === undefined) {
        return resp.status(400).json({
          message: `"${name} (${washType})" is not offered by this launderer`,
        });
      }
      orderTotal += price * qty;
      pricedItems.push({ name, washType, quantity: qty, pricePerItem: price });
    }

    const order = new Order({
      user: studentId,
      items: pricedItems,
      deliveryDate,
      deliveryTime,
      pickupAddress,
      deliveryAddress,
      orderTotal,
      pickupDate,
      pickupTime,
      launderer,
    });
    await order.save();
    resp.status(201).json({
      order: order,
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
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
    const decodedToken = req.user;
    const orderId = req.params.order_id;
    const order = await Order.findById(orderId);
    if (order === null) {
      return resp.status(404).json({
        message: 'Order not found',
      });
    }
    if (order.user.toString() !== decodedToken.user_id) {
      return resp.status(403).json({
        message: 'You are not authorized to modify this order',
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
      updatedOrder: order,
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
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
    const decodedToken = req.user;
    const orderId = req.params.order_id;

    const order = await Order.findById(orderId);
    if (!order) {
      return resp.status(404).json({
        message: 'Order not found',
      });
    }
    if (order.user.toString() !== decodedToken.user_id) {
      return resp.status(403).json({
        message: 'You are not authorized to delete this order',
      });
    }

    await Order.findByIdAndDelete(orderId);

    resp.status(200).json({
      message: 'Order deleted successfully',
      order,
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
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
    const decodedToken = req.user;
    const orderId = req.params.order_id;
    const order = await Order.findById(orderId);
    if (order === null) {
      return resp.status(404).json({
        message: 'Order not found',
      });
    }
    if (order.user.toString() !== decodedToken.user_id) {
      return resp.status(403).json({
        message: 'You are not authorized to modify this order',
      });
    }
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
      updatedOrder: order,
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
    resp.status(500).json({
      message: 'Error updating the delivery status',
      error: err,
    });
  }
};

// @desc    Reschedule an order (before pickup)
// @route   PUT /student/reschedule/:order_id
// @access  Private (student, owner)
const rescheduleOrder = async (req, resp) => {
  try {
    const decodedToken = req.user;
    const order = await Order.findById(req.params.order_id);
    if (!order) {
      return resp.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== decodedToken.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to modify this order' });
    }
    if (order.pickUpStatus) {
      return resp
        .status(400)
        .json({ message: 'Order already picked up; cannot reschedule' });
    }
    const { pickupDate, pickupTime, deliveryDate, deliveryTime } = req.body;
    if (pickupDate) order.pickupDate = pickupDate;
    if (pickupTime) order.pickupTime = pickupTime;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (deliveryTime) order.deliveryTime = deliveryTime;
    await order.save();
    return resp
      .status(200)
      .json({ message: 'Order rescheduled', updatedOrder: order });
  } catch (err) {
    logger.error(`rescheduleOrder error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error rescheduling the order' });
  }
};

// @desc    Cancel an order (before pickup)
// @route   PUT /student/cancelorder/:order_id
// @access  Private (student, owner)
const cancelOrder = async (req, resp) => {
  try {
    const decodedToken = req.user;
    const order = await Order.findById(req.params.order_id);
    if (!order) {
      return resp.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== decodedToken.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to cancel this order' });
    }
    if (order.pickUpStatus) {
      return resp
        .status(400)
        .json({ message: 'Order already picked up; cannot cancel' });
    }
    await Order.findByIdAndDelete(order._id);
    return resp.status(200).json({ message: 'Order cancelled', order });
  } catch (err) {
    logger.error(`cancelOrder error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error cancelling the order' });
  }
};

// @desc    Get the launderers
// @route   GET /student/launderers
// @access  Private
const getAllLaunderers = async (req, resp) => {
  try {
    const launderers = await User.find({ role: 'launderer' });
    const laundererDetails = launderers.map((launderer) => {
      return {
        username: launderer.username,
        phone_number: launderer.phone_number,
      };
    });
    resp.status(200).json({
      launderers: laundererDetails,
    });
  } catch (err) {
    resp.status(500).json({
      message: 'Error fetching the launderers',
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
  rescheduleOrder,
  cancelOrder,
  getAllLaunderers,
};
