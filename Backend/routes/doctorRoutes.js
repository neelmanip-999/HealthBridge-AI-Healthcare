const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', doctorController.getAllDoctors);
router.get('/search', doctorController.searchDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/appointments', protect, authorize('doctor'), doctorController.getDoctorAppointments);
router.put('/availability', protect, authorize('doctor'), doctorController.updateAvailability);
router.get('/stats', protect, authorize('doctor'), doctorController.getDoctorStats);

module.exports = router;
