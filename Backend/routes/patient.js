const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth'); // Uncommented and active!

// ===========================
// Authentication Routes
// ===========================
router.post('/register', patientController.registerPatient);
router.post('/login', patientController.loginPatient);

// ===========================
// Doctor Routes
// ===========================
// Get list of all doctors
router.get('/doctors', patientController.getAvailableDoctors);

// Connect with a doctor (Placeholder for future logic)
router.post('/connect/:doctorId', auth, patientController.connectWithDoctor);

// ===========================
// Medical History Routes (New)
// ===========================
// Get past completed appointments (Diagnosis & Prescriptions)
router.get('/medical-history', auth, patientController.getMedicalHistory);

// ===========================
// Pharmacy Catalog Routes (New)
// ===========================
// Get all medicines available across all pharmacies
router.get('/medicines', auth, patientController.getAllMedicines);

// Reserve a medicine (Click & Collect)
router.post('/reserve-medicine', auth, patientController.reserveMedicine);

module.exports = router;