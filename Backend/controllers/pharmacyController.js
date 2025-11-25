// HealthBridge/backend/controllers/pharmacyController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PharmacyUser = require('../models/PharmacyUser'); // User Auth Model
const Medicine = require('../models/Medicine');         // NEW: Inventory Model
const Order = require('../models/Order');               // NEW: Order Model
const { pharmacyAddValidation } = require('../validations/pharmacyValidation');

// Shared function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'pharmacy' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// ==========================================
// 1. AUTHENTICATION (Login & Register)
// ==========================================

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

// ==========================================
// 2. INVENTORY MANAGEMENT (Seller Dashboard)
// ==========================================

// GET /pharmacy/inventory
// Get only the medicines belonging to the logged-in pharmacy
exports.getPharmacyInventory = async (req, res) => {
    try {
        const medicines = await Medicine.find({ pharmacyId: req.user.id });
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching inventory.' });
    }
};

// POST /pharmacy/add
exports.addMedicine = async (req, res) => {
    // Validate incoming data
    const { error } = pharmacyAddValidation.validate(req.body);
    if (error) {
        return res.status(400).send({ 
            message: error.details[0].message || 'Validation error',
            details: error.details
        });
    }

    try {
        const pharmacyUser = await PharmacyUser.findById(req.user.id);
        if (!pharmacyUser) return res.status(404).send({ message: 'Pharmacy user not found.' });

        // Create new Medicine linked to this Pharmacy ID
        // Note: Mapping 'medicineName' from your validation to 'name' in our new model
        const newMedicine = new Medicine({
            pharmacyId: req.user.id, 
            name: req.body.medicineName || req.body.name, 
            price: req.body.price,
            stock: req.body.stock,
            expiryDate: req.body.expiryDate,
            category: req.body.category || 'General',
            description: req.body.description || ''
        });

        const savedMedicine = await newMedicine.save();
        res.status(201).send({ message: 'Medicine added successfully', medicine: savedMedicine });
    } catch (err) {
        console.error('Error adding medicine:', err);
        res.status(500).send({ message: 'Server error adding medicine.', error: err.message });
    }
};

// PUT /pharmacy/update/:id
exports.updateMedicine = async (req, res) => {
    try {
        // Find medicine and ensure it belongs to the logged-in pharmacy
        const medicine = await Medicine.findOne({ _id: req.params.id, pharmacyId: req.user.id });
        
        if (!medicine) {
            return res.status(404).send({ message: 'Medicine not found or unauthorized.' });
        }

        // Update fields
        const updateData = {
            name: req.body.medicineName || req.body.name,
            price: req.body.price,
            stock: req.body.stock,
            expiryDate: req.body.expiryDate,
            category: req.body.category,
            description: req.body.description
        };

        const updatedMed = await Medicine.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true }
        );
        res.send({ message: 'Medicine updated successfully', medicine: updatedMed });
    } catch (err) {
        res.status(500).send({ message: 'Server error updating medicine.' });
    }
};

// DELETE /pharmacy/delete/:id
exports.deleteMedicine = async (req, res) => {
    try {
        const deletedMed = await Medicine.findOneAndDelete({ 
            _id: req.params.id, 
            pharmacyId: req.user.id // Ensure ownership
        });

        if (!deletedMed) return res.status(404).send({ message: 'Medicine not found or unauthorized.' });

        res.send({ message: 'Medicine deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Server error deleting medicine.' });
    }
};

// ==========================================
// 3. ORDER MANAGEMENT (Click & Collect)
// ==========================================

// GET /pharmacy/orders
// Get all incoming orders for this pharmacy
exports.getPharmacyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ pharmacyId: req.user.id })
            .populate('patientId', 'name email') // Show who ordered it
            .sort({ orderDate: -1 }); // Newest first
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /pharmacy/orders/:id/status
// Update order status (e.g., Mark as Ready)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // Expecting { "status": "Ready" }
        
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, pharmacyId: req.user.id }, // Ensure ownership
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found" });

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};