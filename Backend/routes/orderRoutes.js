const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
