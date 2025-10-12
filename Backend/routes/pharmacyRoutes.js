const express = require('express');
const router = express.Router();
const { getNearbyPharmacies, getAllPharmacies, getPharmacyOrders, updateOrderStatus } = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyPharmacies);
router.get('/', getAllPharmacies);
router.get('/orders', protect, authorize('pharmacy'), getPharmacyOrders);
router.put('/orders/:id/status', protect, authorize('pharmacy'), updateOrderStatus);

module.exports = router;
