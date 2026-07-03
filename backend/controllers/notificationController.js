const Notification = require('../models/notificationModel');
const Order = require('../models/orderModel');
const logger = require('../utils/logger');
// @desc    Get all notifications
// @route   GET /notifications
// @access  Private
const getNotifications = async (req, resp) => {
  try {
    const decodedToken = req.user;
    if (decodedToken.role === 'student') {
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

// @desc    create a notification
// @route   POST /notifications
// @access  Private
const createNotification = async (req, resp) => {
  try {
    const { student, launderer, message, orderId } = req.body;
    const decodedToken = req.user;
    let studentName = '';
    // if the notification is sent by launderer.
    if (student === '') {
      const order = await Order.findById(orderId).populate('user', 'username');
      studentName += order.user.username;
    }
    const notification = new Notification({
      user: decodedToken.user_id, // can be launderer or student who is sending the notification to the opposite role.
      student: decodedToken.role === 'student' ? '' : studentName,
      launderer: decodedToken.role === 'launderer' ? '' : launderer,
      message: message,
      read: false, // unread by default.
    });
    await notification.save();
    resp.status(201).json({
      notification: notification,
    });
  } catch (err) {
    logger.error(`createNotification error: ${err.message}`, {
      stack: err.stack,
    });
    resp.status(500).json({
      error: err.message,
      message: 'Error sending the notification',
    });
  }
};

// @desc  delete a notification
// @route DELETE /notifications/:id
// @access Private
const deleteNotification = async (req, resp) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      resp.status(404).json({ message: 'Notification not found' });
    }
    resp.status(200).json({ message: 'Notification removed' });
  } catch (err) {
    resp.status(500).json({ message: 'Error removing the notification' });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  deleteNotification,
};
