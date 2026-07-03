const Coupon = require('../models/couponModel');
const logger = require('../utils/logger');

// Pure helper: the discount a coupon yields on a given subtotal.
const computeDiscount = (coupon, subtotal) => {
  if (coupon.discountType === 'flat') {
    return Math.min(coupon.value, subtotal);
  }
  let discount = (subtotal * coupon.value) / 100;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return Math.round(discount * 100) / 100;
};

// Shared validation used by both the preview endpoint and order creation.
const validateCouponFor = async (code, subtotal) => {
  if (!code) return { valid: false, discount: 0, message: 'No coupon' };
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon || !coupon.active) {
    return { valid: false, discount: 0, message: 'Invalid coupon' };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, discount: 0, message: 'Coupon expired' };
  }
  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order of ₹${coupon.minOrder} required`,
    };
  }
  return {
    valid: true,
    discount: computeDiscount(coupon, subtotal),
    code: coupon.code,
    message: 'Coupon applied',
  };
};

// @desc    Preview a coupon against a subtotal
// @route   GET /coupons/:code?subtotal=NN
// @access  Private
const previewCoupon = async (req, resp) => {
  try {
    const subtotal = Number(req.query.subtotal) || 0;
    const result = await validateCouponFor(req.params.code, subtotal);
    return resp.status(200).json(result);
  } catch (err) {
    logger.error(`previewCoupon error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error checking coupon' });
  }
};

// @desc    Create a coupon
// @route   POST /admin/coupons
// @access  Private (admin)
const createCoupon = async (req, resp) => {
  try {
    const { code, discountType, value, minOrder, maxDiscount, expiresAt } =
      req.body;
    if (!code || !['percent', 'flat'].includes(discountType)) {
      return resp
        .status(400)
        .json({ message: 'code and a valid discountType are required' });
    }
    if (typeof value !== 'number' || value < 0) {
      return resp.status(400).json({ message: 'Invalid discount value' });
    }
    const coupon = await Coupon.create({
      code,
      discountType,
      value,
      minOrder: minOrder || 0,
      maxDiscount: maxDiscount || 0,
      expiresAt: expiresAt || undefined,
    });
    return resp.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 11000) {
      return resp.status(409).json({ message: 'That code already exists' });
    }
    logger.error(`createCoupon error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error creating coupon' });
  }
};

// @desc    List all coupons
// @route   GET /admin/coupons
// @access  Private (admin)
const listCoupons = async (req, resp) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return resp.status(200).json({ coupons });
  } catch (err) {
    logger.error(`listCoupons error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching coupons' });
  }
};

// @desc    Delete a coupon
// @route   DELETE /admin/coupons/:id
// @access  Private (admin)
const deleteCoupon = async (req, resp) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return resp.status(404).json({ message: 'Coupon not found' });
    return resp
      .status(200)
      .json({ message: 'Coupon deleted', id: req.params.id });
  } catch (err) {
    logger.error(`deleteCoupon error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error deleting coupon' });
  }
};

module.exports = {
  validateCouponFor,
  previewCoupon,
  createCoupon,
  listCoupons,
  deleteCoupon,
};
