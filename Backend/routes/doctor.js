// backend/routes/doctor.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth'); // Assuming your auth middleware is set up

// --- Authentication Routes (Unchanged) ---
router.post('/register', doctorController.registerDoctor);
router.post('/login', doctorController.loginDoctor);

// --- Protected Routes (Requires JWT) ---
router.put('/status', auth, doctorController.updateStatus);

// --- ADD THIS ROUTE FOR THE "Find Doctors" PAGE ---
router.get('/all', auth, doctorController.getAllDoctors);

// --- ADD THIS ROUTE TO FIX THE CHAT PAGE ERROR ---
// This route matches the frontend's request: /api/doctor/profile/:id
router.get('/profile/:id', auth, doctorController.getDoctorProfileById);

module.exports = router;
