// HealthBridge/backend/controllers/pharmacyController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Pharmacy = require('../models/Pharmacy');
const PharmacyUser = require('../models/PharmacyUser');
const { pharmacyAddValidation } = require('../validations/pharmacyValidation');

// Shared function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'pharmacy' }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// POST /pharmacy/register
exports.registerPharmacy = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Check if pharmacy already exists
    const emailExists = await PharmacyUser.findOne({ email });
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new pharmacy user
    const pharmacy = new PharmacyUser({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });
    
    const savedPharmacy = await pharmacy.save();
    
    // Generate Token and respond
    const token = generateToken(savedPharmacy._id);
    res.header('auth-token', token).send({
      token,
      pharmacy: { id: savedPharmacy._id, name: savedPharmacy.name, email: savedPharmacy.email, address: savedPharmacy.address },
    });

  } catch (err) {
    console.error("Pharmacy Registration error:", err);
    res.status(500).send({ message: 'Server error during registration.' });
  }
};

// POST /pharmacy/login
exports.loginPharmacy = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email exists
    const pharmacy = await PharmacyUser.findOne({ email });
    if (!pharmacy) return res.status(400).send({ message: 'Invalid Credentials.' });

    // Check password
    const validPass = await bcrypt.compare(password, pharmacy.password);
    if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

    // Generate Token and respond
    const token = generateToken(pharmacy._id);
    res.header('auth-token', token).send({
      token,
      pharmacy: { id: pharmacy._id, name: pharmacy.name, email: pharmacy.email, address: pharmacy.address },
    });
  } catch (err) {
    console.error("Pharmacy Login error:", err);
    res.status(500).send({ message: 'Server error during login.' });
  }
};

// POST /pharmacy/add
exports.addMedicine = async (req, res) => {
    const { error } = pharmacyAddValidation.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const newMedicine = new Pharmacy(req.body);
        await newMedicine.save();
        res.status(201).send({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (err) {
        res.status(500).send({ message: 'Server error adding medicine.', error: err.message });
    }
};

// GET /pharmacy/list
exports.listMedicines = async (req, res) => {
    try {
        const medicines = await Pharmacy.find({});
        res.send(medicines);
    } catch (err) {
        res.status(500).send({ message: 'Server error listing medicines.' });
    }
};

// PUT /pharmacy/update/:id
exports.updateMedicine = async (req, res) => {
    const { error } = pharmacyAddValidation.validate(req.body); // Reuse validation
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const updatedMed = await Pharmacy.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!updatedMed) return res.status(404).send({ message: 'Medicine not found.' });
        res.send({ message: 'Medicine updated successfully', medicine: updatedMed });
    } catch (err) {
        res.status(500).send({ message: 'Server error updating medicine.' });
    }
};

// DELETE /pharmacy/delete/:id
exports.deleteMedicine = async (req, res) => {
    try {
        const deletedMed = await Pharmacy.findByIdAndDelete(req.params.id);
        if (!deletedMed) return res.status(404).send({ message: 'Medicine not found.' });
        res.send({ message: 'Medicine deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Server error deleting medicine.' });
    }
};