const User = require('../models/userModel');
const Order = require('../models/orderModel');
const CatalogItem = require('../models/catalogModel');
const logger = require('../utils/logger');

const ROLES = ['customer', 'launderer', 'admin'];

// Admin lists used to return whole collections. That is fine at seed-data
// size and is the first thing to fall over with real traffic: every open of
// the console shipped every user, order and catalog item ever created.
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const pageParams = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requested = Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
  // Capped, so a client cannot ask for the unbounded response we just removed.
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested));
  return { page, limit, skip: (page - 1) * limit };
};

const meta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// User input goes into a RegExp, so the characters that mean something to the
// engine have to stop meaning it — otherwise a search for "a+" is a different
// query, and a crafted one is a denial of service.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const searchRx = (q) => new RegExp(escapeRegex(q.trim()), 'i');

// @desc    List all users
// @route   GET /admin/users
// @access  Private (admin)
const getAllUsers = async (req, resp) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const filter = {};
    if (req.query.role && ROLES.includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.q) {
      const rx = searchRx(req.query.q);
      filter.$or = [{ username: rx }, { email: rx }];
    }

    // Searching and filtering happen here rather than in the browser: with a
    // page of results, client-side search would only ever search that page.
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .sort({ role: 1, username: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    return resp.status(200).json({ users, ...meta(page, limit, total) });
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

// @desc    Approve or revoke a launderer
// @route   PATCH /admin/users/:id/approval
// @access  Private (admin)
const setApproval = async (req, resp) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== 'boolean') {
      return resp.status(400).json({ message: 'approved must be a boolean' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return resp.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'launderer') {
      return resp
        .status(400)
        .json({ message: 'Only launderers require approval' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    ).select('-password -__v');
    return resp.status(200).json({ user: updated });
  } catch (err) {
    logger.error(`admin setApproval error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error updating approval' });
  }
};

// @desc    List every order in the system
// @route   GET /admin/orders
// @access  Private (admin)
const getAllOrders = async (req, resp) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const filter = {};

    // Status is stored as three booleans, so the named stages are ranges over
    // them, in the same precedence the UI reads them in.
    const byStatus = {
      pending: { acceptedStatus: false },
      accepted: { acceptedStatus: true, pickUpStatus: false },
      pickedup: { pickUpStatus: true, deliveredStatus: false },
      delivered: { deliveredStatus: true },
    };
    if (byStatus[req.query.status])
      Object.assign(filter, byStatus[req.query.status]);
    if (req.query.paid === 'paid') filter.paid = true;
    if (req.query.paid === 'unpaid') filter.paid = false;

    if (req.query.q) {
      const rx = searchRx(req.query.q);
      // Both parties are references, so resolve the name to ids once and match
      // the order against either side.
      const userIds = await User.find({ username: rx }).distinct('_id');
      filter.$or = [
        { launderer: { $in: userIds } },
        { user: { $in: userIds } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'username email hostel -_id')
        .populate('launderer', 'username -_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    return resp.status(200).json({ orders, ...meta(page, limit, total) });
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
    const { page, limit, skip } = pageParams(req);
    const filter = {};
    if (req.query.q) {
      const rx = searchRx(req.query.q);
      const laundererIds = await User.find({ username: rx }).distinct('_id');
      filter.$or = [
        { clothingType: rx },
        { washType: rx },
        { launderer: { $in: laundererIds } },
      ];
    }

    const [items, total] = await Promise.all([
      CatalogItem.find(filter)
        .populate('launderer', 'username -_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CatalogItem.countDocuments(filter),
    ]);
    return resp.status(200).json({ items, ...meta(page, limit, total) });
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
    // These four used to be derived in the browser from the full user and
    // order lists. Now that those lists arrive a page at a time, deriving them
    // client-side would quietly describe page one rather than the system, so
    // they are counted here instead.
    const [
      usersByRoleAgg,
      totalOrders,
      revenueAgg,
      ordersPerLaundererAgg,
      pendingApprovals,
      outstandingAgg,
      paidCount,
      statusCounts,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, revenue: { $sum: '$orderTotal' } } },
      ]),
      // Grouped by reference, then resolved to a name — the chart labels
      // launderers, and an ObjectId is not a label.
      Order.aggregate([
        { $group: { _id: '$launderer', orders: { $sum: 1 } } },
        {
          $lookup: {
            from: 'User',
            localField: '_id',
            foreignField: '_id',
            as: 'launderer',
          },
        },
        { $sort: { orders: -1 } },
      ]),
      User.countDocuments({ role: 'launderer', approved: false }),
      Order.aggregate([
        { $match: { paid: false } },
        { $group: { _id: null, total: { $sum: '$orderTotal' } } },
      ]),
      Order.countDocuments({ paid: true }),
      // Mutually exclusive, in the precedence the UI reads them in: an order
      // that was delivered is not also counted as accepted.
      Promise.all([
        Order.countDocuments({ acceptedStatus: false }),
        Order.countDocuments({ acceptedStatus: true, pickUpStatus: false }),
        Order.countDocuments({ pickUpStatus: true, deliveredStatus: false }),
        Order.countDocuments({ deliveredStatus: true }),
      ]).then(([pending, accepted, pickedup, delivered]) => ({
        pending,
        accepted,
        pickedup,
        delivered,
      })),
    ]);

    const paidRevenue = revenueAgg[0] ? revenueAgg[0].revenue : 0;

    const usersByRole = usersByRoleAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    return resp.status(200).json({
      analytics: {
        usersByRole,
        totalUsers: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        totalOrders,
        paidRevenue,
        pendingApprovals,
        outstanding: outstandingAgg[0] ? outstandingAgg[0].total : 0,
        avgOrderValue: paidCount ? Math.round(paidRevenue / paidCount) : 0,
        statusCounts,
        totalCatalogItems: await CatalogItem.countDocuments(),
        ordersPerLaunderer: ordersPerLaundererAgg.map((o) => ({
          launderer: o.launderer?.[0]?.username || 'unknown',
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
  setApproval,
  getAllOrders,
  getAllCatalog,
  getAnalytics,
};
