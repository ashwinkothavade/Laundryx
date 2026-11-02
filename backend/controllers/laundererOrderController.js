const Order = require('../models/orderModel');
const User = require('../models/userModel');
const CatalogItem = require('../models/catalogModel');
const Review = require('../models/reviewModel');
const logger = require('../utils/logger');

// How many days of history the trend series carries.
const TREND_DAYS = 14;

// Bucket key for a day. createdAt is a real Date (schema timestamps), unlike
// pickupDate/deliveryDate which are display strings and cannot be compared or
// sorted — so every time-based figure here is derived from createdAt.
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// An ascending run of the last n day-keys ending today, so days with no orders
// still appear in the series. A trend drawn only from days that have data
// silently closes the gaps and overstates how steady the business is.
const lastDays = (n, now = new Date()) => {
  const days = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
};

const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Totals for an arbitrary subset of orders.
const summarise = (orders) => ({
  orders: orders.length,
  revenue: money(
    orders.filter((o) => o.paid).reduce((s, o) => s + (o.orderTotal || 0), 0)
  ),
});

// @desc    A launderer's own analytics
// @route   GET /launderer/analytics
// @access  Private (launderer)
//
// Everything is computed from one indexed read of the launderer's own orders
// ({ launderer, createdAt: -1 } covers it) plus two small counts. At a single
// launderer's volume that is cheaper than several aggregation round-trips; if
// a launderer ever carries enough history for this to matter, the daily
// buckets are the part to push into an aggregation pipeline with a $match on
// createdAt, since the rest is already O(orders).
const getLaundererAnalytics = async (req, resp) => {
  try {
    const [orders, catalogItems, reviews] = await Promise.all([
      Order.find({ launderer: req.user.username }).lean(),
      CatalogItem.countDocuments({ launderer: req.user.user_id }),
      Review.find({ launderer: req.user.user_id }).lean(),
    ]);

    const paidOrders = orders.filter((o) => o.paid);
    const revenue = money(
      paidOrders.reduce((s, o) => s + (o.orderTotal || 0), 0)
    );

    // Work already done but not yet paid for. This is the number a launderer
    // actually chases, and nothing in the old response showed it.
    const outstanding = money(
      orders.filter((o) => !o.paid).reduce((s, o) => s + (o.orderTotal || 0), 0)
    );

    const avgRating = reviews.length
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

    // Daily buckets, pre-seeded so empty days are zeros rather than gaps.
    const days = lastDays(TREND_DAYS);
    const buckets = new Map(
      days.map((d) => [d, { date: d, orders: 0, revenue: 0 }])
    );
    orders.forEach((o) => {
      const bucket = buckets.get(dayKey(o.createdAt));
      if (!bucket) return;
      bucket.orders += 1;
      if (o.paid) bucket.revenue += o.orderTotal || 0;
    });
    const trend = days.map((d) => {
      const b = buckets.get(d);
      return { ...b, revenue: money(b.revenue) };
    });

    // Rolling windows, and the window before each one so the UI can show a
    // direction rather than a bare number.
    const since = (n) => {
      const cut = new Date();
      cut.setUTCDate(cut.getUTCDate() - n);
      return cut;
    };
    const between = (from, to) =>
      orders.filter((o) => {
        const at = new Date(o.createdAt);
        return at >= from && (!to || at < to);
      });

    const today = dayKey(new Date());
    const last7 = summarise(between(since(7)));
    const prev7 = summarise(between(since(14), since(7)));
    const last30 = summarise(between(since(30)));

    // Which stage of the pipeline work is sitting in. Counts are cumulative by
    // design — an order that was delivered was also accepted — so the series
    // reads as a funnel rather than as disjoint buckets.
    const funnel = {
      placed: orders.length,
      accepted: orders.filter((o) => o.acceptedStatus).length,
      pickedUp: orders.filter((o) => o.pickUpStatus).length,
      delivered: orders.filter((o) => o.deliveredStatus).length,
      paid: paidOrders.length,
    };

    // What this launderer actually washes, by volume.
    const itemTotals = new Map();
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.name;
        const prev = itemTotals.get(key) || {
          name: key,
          quantity: 0,
          revenue: 0,
        };
        prev.quantity += item.quantity || 0;
        prev.revenue += (item.quantity || 0) * (item.pricePerItem || 0);
        itemTotals.set(key, prev);
      });
    });
    const topItems = [...itemTotals.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
      .map((i) => ({ ...i, revenue: money(i.revenue) }));

    const customers = new Set(orders.map((o) => String(o.user)));
    const ordersPerCustomer = orders.reduce((acc, o) => {
      const key = String(o.user);
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    const ratings = [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = reviews.filter((r) => r.rating === star).length;
      return acc;
    }, {});

    return resp.status(200).json({
      analytics: {
        // Unchanged keys — existing callers keep working.
        totalOrders: orders.length,
        pending: orders.filter((o) => !o.acceptedStatus).length,
        inProgress: orders.filter((o) => o.acceptedStatus && !o.deliveredStatus)
          .length,
        delivered: funnel.delivered,
        revenue,
        catalogItems,
        avgRating,
        reviewCount: reviews.length,
        // Added.
        outstanding,
        avgOrderValue: paidOrders.length
          ? money(revenue / paidOrders.length)
          : 0,
        today: summarise(orders.filter((o) => dayKey(o.createdAt) === today)),
        last7,
        prev7,
        last30,
        trend,
        trendDays: TREND_DAYS,
        funnel,
        topItems,
        fulfilment: {
          home_pickup: orders.filter((o) => o.fulfilmentMode !== 'self_dropoff')
            .length,
          self_dropoff: orders.filter(
            (o) => o.fulfilmentMode === 'self_dropoff'
          ).length,
        },
        express: {
          express: orders.filter((o) => o.express).length,
          standard: orders.filter((o) => !o.express).length,
        },
        ratings,
        uniqueCustomers: customers.size,
        repeatCustomers: [...ordersPerCustomer.values()].filter((n) => n > 1)
          .length,
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
