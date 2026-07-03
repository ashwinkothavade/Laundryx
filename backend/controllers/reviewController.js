const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');

// @desc    Create a review for a delivered order
// @route   POST /reviews
// @access  Private (student, order owner)
const createReview = async (req, resp) => {
  try {
    const { orderId, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (
      !orderId ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return resp
        .status(400)
        .json({ message: 'orderId and a rating from 1 to 5 are required' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return resp.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.user_id) {
      return resp
        .status(403)
        .json({ message: 'You can only review your own orders' });
    }
    if (!order.deliveredStatus) {
      return resp
        .status(400)
        .json({ message: 'You can only review delivered orders' });
    }
    const launderer = await User.findOne({
      username: order.launderer,
      role: 'launderer',
    });
    if (!launderer) {
      return resp.status(404).json({ message: 'Launderer not found' });
    }
    const review = await Review.create({
      launderer: launderer._id,
      student: req.user.user_id,
      order: order._id,
      rating: numericRating,
      comment: comment || '',
    });
    return resp.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return resp
        .status(409)
        .json({ message: 'You have already reviewed this order' });
    }
    logger.error(`createReview error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error creating review' });
  }
};

// @desc    Get a launderer's reviews (with average)
// @route   GET /reviews/launderer/:username
// @access  Private
const getLaundererReviews = async (req, resp) => {
  try {
    const launderer = await User.findOne({
      username: req.params.username,
      role: 'launderer',
    });
    if (!launderer) {
      return resp.status(404).json({ message: 'Launderer not found' });
    }
    const reviews = await Review.find({ launderer: launderer._id })
      .populate('student', 'username -_id')
      .sort({ createdAt: -1 });
    const count = reviews.length;
    const avgRating = count
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;
    return resp.status(200).json({
      launderer: launderer.username,
      avgRating: Math.round(avgRating * 10) / 10,
      count,
      reviews,
    });
  } catch (err) {
    logger.error(`getLaundererReviews error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching reviews' });
  }
};

// @desc    Ratings summary for every launderer (for discovery/sorting)
// @route   GET /reviews/summary
// @access  Private
const getReviewsSummary = async (req, resp) => {
  try {
    const summary = await Review.aggregate([
      {
        $group: {
          _id: '$launderer',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: '_id',
          foreignField: '_id',
          as: 'launderer',
        },
      },
      { $unwind: '$launderer' },
      {
        $project: {
          _id: 0,
          username: '$launderer.username',
          avgRating: { $round: ['$avgRating', 1] },
          count: 1,
        },
      },
    ]);
    // Return as a map keyed by username for easy client lookup.
    const map = summary.reduce((acc, s) => {
      acc[s.username] = { avgRating: s.avgRating, count: s.count };
      return acc;
    }, {});
    return resp.status(200).json({ summary: map });
  } catch (err) {
    logger.error(`getReviewsSummary error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching summary' });
  }
};

module.exports = {
  createReview,
  getLaundererReviews,
  getReviewsSummary,
};
