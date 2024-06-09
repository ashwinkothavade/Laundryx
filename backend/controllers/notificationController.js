const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const Order = require('../models/orderModel');

// @desc    Get all notifications
// @route   GET /notifications
// @access  Private
const getNotifications = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
    resp.status(500).json('NotificationModel error');
  }
};

// @desc    create a notification
// @route   POST /notifications
// @access  Private
const createNotification = async (req, resp) => {
  try {
    const { student, launderer, message } = req.body;
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const notification = new Notification({
      user: decodedToken.user_id, // can be launderer or student who is sending the notification to the opposite role.
      student: decodedToken.role === 'student' ? '' : student,
      launderer: decodedToken.role === 'launderer' ? '' : launderer,
      message: message,
      read: false, // unread by default.
    });
    await notification.save();
    resp.status(201).json({
      notification: notification,
    });
  } catch (err) {
    resp.status(500).json({
      error: err.message,
      message: 'Error sending the notification',
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
};
