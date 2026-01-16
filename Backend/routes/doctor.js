const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth'); 

// --- PUBLIC ROUTES ---

// 1. Get all doctors (with optional filters)
// @route GET /api/doctor
router.get('/', doctorController.getAllDoctors); 

// 2. Get specific doctor details (Now includes reviews!)
// @route GET /api/doctor/profile/:id
router.get('/profile/:id', doctorController.getDoctorProfileById);

// 3. Register a new doctor
// @route POST /api/doctor/register
router.post('/register', doctorController.registerDoctor);

// 4. Login doctor
// @route POST /api/doctor/login
router.post('/login', doctorController.loginDoctor);


// --- PROTECTED ROUTES (Requires Login) ---

// 5. Update doctor status
// @route PUT /api/doctor/status
router.put('/status', auth, doctorController.updateStatus);

// 6. NEW: Add a Review
// @route POST /api/doctor/review
router.post('/review', auth, doctorController.addReview); // <--- ADDED THIS

module.exports = router;