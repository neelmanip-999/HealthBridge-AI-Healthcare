const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor'); 
const Appointment = require('../models/Appointment'); 
const Medicine = require('../models/Medicine');       
const Order = require('../models/Order');             
const { patientRegisterValidation, patientLoginValidation } = require('../validations/patientValidation');

// Shared function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET, {
        expiresIn: '1d', 
    });
};

// ==========================================
// 1. AUTHENTICATION (Register & Login)
// ==========================================

// POST /patient/register
exports.registerPatient = async (req, res) => {
    const { error } = patientRegisterValidation.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const emailExists = await Patient.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const patient = new Patient({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            age: req.body.age,
            gender: req.body.gender,
            medicalHistory: req.body.medicalHistory || [],
        });
        
        const savedPatient = await patient.save();
        const token = generateToken(savedPatient._id);
        
        res.header('auth-token', token).send({
            token,
            patient: { id: savedPatient._id, name: savedPatient.name, email: savedPatient.email, age: savedPatient.age },
        });

    } catch (err) {
        console.error("Patient Registration Error:", err);
        res.status(500).send({ message: 'Server error during registration.' });
    }
};

// POST /patient/login
exports.loginPatient = async (req, res) => {
    const { error } = patientLoginValidation.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const patient = await Patient.findOne({ email: req.body.email });
        if (!patient) return res.status(400).send({ message: 'Invalid Credentials.' });

        const validPass = await bcrypt.compare(req.body.password, patient.password);
        if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

        const token = generateToken(patient._id);
        res.header('auth-token', token).send({
            token,
            patient: { id: patient._id, name: patient.name, email: patient.email, age: patient.age },
        });

    } catch (err) {
        console.error("Patient Login Error:", err);
        res.status(500).send({ message: 'Server error during login.' });
    }
};

// ==========================================
// 2. DOCTOR INTERACTION
// ==========================================

// GET /patient/doctors
exports.getAvailableDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({}, 'name email specialization fees status')
            .sort({ status: 1, name: 1 }); 
        res.send(doctors);
    } catch (err) {
        res.status(500).send({ message: 'Server error while fetching doctors.' });
    }
};

// POST /patient/connect/:doctorId
exports.connectWithDoctor = async (req, res) => {
    res.status(501).send({ message: 'Doctor connection logic not yet fully implemented.' });
};

// ==========================================
// 3. MEDICAL HISTORY 
// ==========================================

// GET /patient/medical-history
exports.getMedicalHistory = async (req, res) => {
    try {
        const history = await Appointment.find({ 
            patientId: req.user.id,
            status: 'completed' 
        })
        .populate('doctorId', 'name specialization') 
        .sort({ date: -1 });

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching medical history' });
    }
};

// ==========================================
// 4. PHARMACY CATALOG & ORDERS (UPDATED)
// ==========================================

// GET /patient/medicines
exports.getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find({ stock: { $gt: 0 } })
            .populate('pharmacyId', 'name address'); 
        
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching medicines' });
    }
};

// POST /patient/reserve-medicine (UPDATED WITH DELIVERY LOGIC)
exports.reserveMedicine = async (req, res) => {
    // Added fulfillmentType and deliveryAddress
    const { pharmacyId, medicineId, medicineName, price, prescription, appointmentId, fulfillmentType, deliveryAddress } = req.body;

    try {
        const newOrder = new Order({
            patientId: req.user.id,
            pharmacyId,
            medicineId,
            medicineName,
            price,
            status: 'Pending',
            // Prescription Details
            prescription: prescription || '', 
            appointmentId: appointmentId || null,
            // Delivery Details (New)
            fulfillmentType: fulfillmentType || 'Pickup',
            deliveryAddress: deliveryAddress || ''
        });

        const savedOrder = await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully!', order: savedOrder });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error placing order' });
    }
};

// GET /patient/orders 
exports.getPatientOrders = async (req, res) => {
    try {
        const orders = await Order.find({ patientId: req.user.id })
            .populate('pharmacyId', 'name address phone') 
            .sort({ orderDate: -1 }); 
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};