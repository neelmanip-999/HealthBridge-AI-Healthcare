const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth'); // Middleware to verify JWT token

// @route   POST /api/appointments/book
// @desc    Initialize a new appointment (Status: pending)
// @access  Private (Patient only)
router.post('/book', auth, appointmentController.bookAppointment);

// @route   POST /api/appointments/confirm-payment
// @desc    Confirm payment and schedule the appointment
// @access  Private (Patient only)
router.post('/confirm-payment', auth, appointmentController.confirmPayment);

// @route   GET /api/appointments/doctor
// @desc    Get all appointments for the logged-in doctor
// @access  Private (Doctor only)
router.get('/doctor', auth, appointmentController.getDoctorAppointments);

// @route   GET /api/appointments/patient
// @desc    Get all appointments for the logged-in patient
// @access  Private (Patient only)
router.get('/patient', auth, appointmentController.getPatientAppointments);

// @route   DELETE /api/appointments/:id
// @desc    Cancel an appointment
// @access  Private
router.delete('/:id', auth, appointmentController.cancelAppointment);

module.exports = router;