const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
// const auth = require('../middleware/auth'); // Will be used later for protected routes

// Registration Route
router.post('/register', patientController.registerPatient);

// Login and other routes
router.post('/login', patientController.loginPatient);
router.get('/doctors', patientController.getAvailableDoctors);

module.exports = router;
