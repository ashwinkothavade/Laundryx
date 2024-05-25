const { Router } = require('express');

const router = Router();
const razorpayController = require('../controllers/razorpayController');

router.post('/payment', razorpayController.createOrder);
router.post('/payment/validate', razorpayController.validatePayment);

module.exports = router;
