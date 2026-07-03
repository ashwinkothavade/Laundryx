const { Router } = require('express');

const router = Router();
const reviewController = require('../controllers/reviewController');
const { verifyUser } = require('../middlewares/authMiddleware');

router.post('/reviews', verifyUser, reviewController.createReview);
router.get('/reviews/summary', verifyUser, reviewController.getReviewsSummary);
router.get(
  '/reviews/launderer/:username',
  verifyUser,
  reviewController.getLaundererReviews
);

module.exports = router;
