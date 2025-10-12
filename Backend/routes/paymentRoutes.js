const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, processRefund } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/refund', protect, processRefund);

module.exports = router;
