// HealthBridge/backend/routes/pharmacy.js
const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const auth = require('../middleware/auth'); 

// Authentication Routes
router.post('/register', pharmacyController.registerPharmacy);
router.post('/login', pharmacyController.loginPharmacy);

// Protected Routes (requires authentication)
router.post('/add', auth, pharmacyController.addMedicine);
router.get('/list', auth, pharmacyController.listMedicines);
router.put('/update/:id', auth, pharmacyController.updateMedicine);
router.delete('/delete/:id', auth, pharmacyController.deleteMedicine);

module.exports = router;