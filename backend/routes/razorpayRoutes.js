const { Router } = require('express');

const router = Router();
const razorpayController = require('../controllers/razorpayController');
const { verifyUser } = require('../middlewares/authMiddleware');

// Both endpoints move money, so both require an authenticated caller. They
// additionally verify that the caller owns the order being paid for.
router.post('/payment', verifyUser, razorpayController.createOrder);
router.put('/payment/validate', verifyUser, razorpayController.validatePayment);

module.exports = router;
