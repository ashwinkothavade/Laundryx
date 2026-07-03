const mongoose = require('mongoose');

// Admin-managed discount codes. `discountType` is either a flat amount off or a
// percentage (optionally capped by maxDiscount), applied to the item subtotal.
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrder: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 = uncapped (only meaningful for percent coupons)
    },
    active: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'Coupon',
  }
);

module.exports = mongoose.model('Coupon', couponSchema);
