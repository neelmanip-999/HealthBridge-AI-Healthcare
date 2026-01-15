const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth'); // Middleware is active

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
// Medical History Routes
// ===========================
// Get past completed appointments (Diagnosis & Prescriptions)
router.get('/medical-history', auth, patientController.getMedicalHistory);

// ===========================
// Pharmacy Catalog & Order Routes
// ===========================
// Get all medicines available across all pharmacies
router.get('/medicines', auth, patientController.getAllMedicines);

// Reserve a medicine (Click & Collect) - NOW ACCEPTS PRESCRIPTIONS
router.post('/reserve-medicine', auth, patientController.reserveMedicine);

// Get Patient's Order History (NEW)
router.get('/orders', auth, patientController.getPatientOrders);

module.exports = router;