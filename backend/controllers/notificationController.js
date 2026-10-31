const Notification = require('../models/notificationModel');
const Order = require('../models/orderModel');
const logger = require('../utils/logger');
// @desc    Get all notifications
// @route   GET /notifications
// @access  Private
const getNotifications = async (req, resp) => {
  try {
    const decodedToken = req.user;
    if (decodedToken.role === 'customer') {
      const notifications = await Notification.find({
        student: decodedToken.username,
      });
      resp.status(200).json({
        notifications: notifications,
        unreadCount: notifications.filter((notification) => !notification.read)
          .length,
      });
    } else {
      const notifications = await Notification.find({
        launderer: decodedToken.username,
      });
      resp.status(200).json({
        notifications: notifications,
        unreadCount: notifications.filter((notification) => !notification.read)
          .length,
      });
    }
  } catch (err) {
    logger.error(`getNotifications error: ${err.message}`, {
      stack: err.stack,
    });
    resp.status(500).json('NotificationModel error');
  }
};

// @desc    Send a notification to the other party on an order
// @route   POST /notifications
// @access  Private
//
// The recipient is derived from a record the caller is demonstrably party to,
// never taken on trust. Previously the message text and the recipient came
// straight from the request body, so any signed-in user could send any
// launderer arbitrary text that the UI renders as a system notification.
const createNotification = async (req, resp) => {
  try {
    const { launderer, message, orderId } = req.body;
    const { role, username, user_id: userId } = req.user;

    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) {
      return resp.status(400).json({ message: 'A message is required' });
    }
    if (text.length > 500) {
      return resp.status(400).json({ message: 'Message is too long' });
    }

    let studentName = '';
    let laundererName = '';

    if (role === 'launderer') {
      // Notifying a student: the order must be one placed with this
      // launderer, which is also how we learn who the student is.
      const order = await Order.findById(orderId).populate('user', 'username');
      if (!order) {
        return resp.status(404).json({ message: 'Order not found' });
      }
      if (order.launderer !== username) {
        return resp
          .status(403)
          .json({ message: 'That order was not placed with you' });
      }
      studentName = order.user.username;
    } else if (role === 'customer') {
      // Notifying a launderer: only one this customer has actually ordered
      // from, so this cannot be used to message arbitrary accounts.
      const hasOrder = await Order.exists({ user: userId, launderer });
      if (!hasOrder) {
        return resp
          .status(403)
          .json({ message: 'You have no order with that launderer' });
      }
      laundererName = launderer;
    } else {
      return resp
        .status(403)
        .json({ message: 'Only customers and launderers send notifications' });
    }

    const notification = await Notification.create({
      user: userId,
      student: studentName,
      launderer: laundererName,
      message: text,
      read: false,
    });
    return resp.status(201).json({ notification });
  } catch (err) {
    logger.error(`createNotification error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error sending the notification' });
  }
};

// @desc    Delete one of your own notifications
// @route   DELETE /notifications/:id
// @access  Private (recipient only)
const deleteNotification = async (req, resp) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      // The missing `return` here used to let the 200 below run as well,
      // producing ERR_HTTP_HEADERS_SENT on every delete of a missing id.
      return resp.status(404).json({ message: 'Notification not found' });
    }

    // A notification belongs to whoever it was addressed to. Without this,
    // any signed-in user could delete anyone's notifications by id.
    const { role, username } = req.user;
    const mine =
      role === 'customer'
        ? notification.student === username
        : notification.launderer === username;

    if (!mine) {
      return resp
        .status(403)
        .json({ message: 'That notification is not yours' });
    }

    await Notification.findByIdAndDelete(notification._id);
    return resp.status(200).json({ message: 'Notification removed' });
  } catch (err) {
    logger.error(`deleteNotification error: ${err.message}`, {
      stack: err.stack,
    });
    return resp
      .status(500)
      .json({ message: 'Error removing the notification' });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  deleteNotification,
};
