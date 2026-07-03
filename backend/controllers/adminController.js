const User = require('../models/userModel');
const Order = require('../models/orderModel');
const CatalogItem = require('../models/catalogModel');
const logger = require('../utils/logger');

const ROLES = ['student', 'launderer', 'admin'];

// @desc    List all users
// @route   GET /admin/users
// @access  Private (admin)
const getAllUsers = async (req, resp) => {
  try {
    const users = await User.find().select('-password -__v').sort({ role: 1 });
    return resp.status(200).json({ users });
  } catch (err) {
    logger.error(`admin getAllUsers error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching users' });
  }
};

// @desc    Delete a user
// @route   DELETE /admin/users/:id
// @access  Private (admin)
const deleteUser = async (req, resp) => {
  try {
    if (req.params.id === req.user.user_id) {
      return resp
        .status(400)
        .json({ message: 'You cannot delete your own admin account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return resp.status(404).json({ message: 'User not found' });
    }
    return resp
      .status(200)
      .json({ message: 'User deleted', id: req.params.id });
  } catch (err) {
    logger.error(`admin deleteUser error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error deleting user' });
  }
};

// @desc    Change a user's role
// @route   PATCH /admin/users/:id/role
// @access  Private (admin)
const updateUserRole = async (req, resp) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return resp.status(400).json({ message: 'Invalid role' });
    }
    if (req.params.id === req.user.user_id) {
      return resp
        .status(400)
        .json({ message: 'You cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -__v');
    if (!user) {
      return resp.status(404).json({ message: 'User not found' });
    }
    return resp.status(200).json({ user });
  } catch (err) {
    logger.error(`admin updateUserRole error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error updating role' });
  }
};

// @desc    List every order in the system
// @route   GET /admin/orders
// @access  Private (admin)
const getAllOrders = async (req, resp) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email hostel -_id')
      .sort({ createdAt: -1 });
    return resp.status(200).json({ orders });
  } catch (err) {
    logger.error(`admin getAllOrders error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching orders' });
  }
};

// @desc    List every catalog item across launderers
// @route   GET /admin/catalog
// @access  Private (admin)
const getAllCatalog = async (req, resp) => {
  try {
    const items = await CatalogItem.find()
      .populate('launderer', 'username -_id')
      .sort({ createdAt: -1 });
    return resp.status(200).json({ items });
  } catch (err) {
    logger.error(`admin getAllCatalog error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching catalog' });
  }
};

// @desc    High-level analytics
// @route   GET /admin/analytics
// @access  Private (admin)
const getAnalytics = async (req, resp) => {
  try {
    const [usersByRoleAgg, totalOrders, revenueAgg, ordersPerLaundererAgg] =
      await Promise.all([
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { paid: true } },
          { $group: { _id: null, revenue: { $sum: '$orderTotal' } } },
        ]),
        Order.aggregate([
          { $group: { _id: '$launderer', orders: { $sum: 1 } } },
          { $sort: { orders: -1 } },
        ]),
      ]);

    const usersByRole = usersByRoleAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    return resp.status(200).json({
      analytics: {
        usersByRole,
        totalUsers: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        totalOrders,
        paidRevenue: revenueAgg[0] ? revenueAgg[0].revenue : 0,
        totalCatalogItems: await CatalogItem.countDocuments(),
        ordersPerLaunderer: ordersPerLaundererAgg.map((o) => ({
          launderer: o._id,
          orders: o.orders,
        })),
      },
    });
  } catch (err) {
    logger.error(`admin getAnalytics error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching analytics' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllOrders,
  getAllCatalog,
  getAnalytics,
};
