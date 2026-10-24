const { Router } = require('express');

const router = Router();
const razorpayController = require('../controllers/razorpayController');
const { verifyUser } = require('../middlewares/authMiddleware');

// Both endpoints move money, so both require an authenticated caller. They
// additionally verify that the caller owns the order being paid for.
router.post('/payment', verifyUser, razorpayController.createOrder);
router.put('/payment/validate', verifyUser, razorpayController.validatePayment);

// Razorpay's server-to-server confirmation. Deliberately unauthenticated:
// the caller is Razorpay, not a signed-in user, and it is authenticated by
// the HMAC signature over the raw body instead of by a session cookie.
router.post('/payment/webhook', razorpayController.handleWebhook);

module.exports = router;
