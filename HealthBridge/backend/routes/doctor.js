// backend/routes/doctor.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth'); // A JWT verification middleware you need to create

// Authentication Routes
router.post('/register', doctorController.registerDoctor);
router.post('/login', doctorController.loginDoctor);

// Protected Routes (requires JWT)
router.put('/status', auth, doctorController.updateStatus);
// router.get('/all', doctorController.getAllDoctors); // Will use Socket.io for live status

module.exports = router;