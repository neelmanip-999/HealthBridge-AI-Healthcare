const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patient'), appointmentController.createAppointment);
router.get('/my', protect, appointmentController.getMyAppointments);
router.get('/:id', protect, appointmentController.getAppointmentById);
router.put('/:id/status', protect, appointmentController.updateAppointmentStatus);
router.put('/:id/cancel', protect, appointmentController.cancelAppointment);
router.put('/:id/prescription', protect, authorize('doctor'), appointmentController.addPrescription);
router.put('/:id/rate', protect, authorize('patient'), appointmentController.rateAppointment);

module.exports = router;
