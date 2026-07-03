const { Router } = require('express');

const router = Router();
const couponController = require('../controllers/couponController');
const { verifyUser, verifyAdmin } = require('../middlewares/authMiddleware');

// Any authenticated user can preview a coupon at checkout.
router.get('/coupons/:code', verifyUser, couponController.previewCoupon);

// Admin management.
router.post(
  '/admin/coupons',
  verifyUser,
  verifyAdmin,
  couponController.createCoupon
);
router.get(
  '/admin/coupons',
  verifyUser,
  verifyAdmin,
  couponController.listCoupons
);
router.delete(
  '/admin/coupons/:id',
  verifyUser,
  verifyAdmin,
  couponController.deleteCoupon
);

module.exports = router;
