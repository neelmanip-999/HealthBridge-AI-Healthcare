const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor'); 
const Appointment = require('../models/Appointment'); // NEW: For Medical History
const Medicine = require('../models/Medicine');       // NEW: For Pharmacy Catalog
const Order = require('../models/Order');             // NEW: For reserving medicines
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
// 3. MEDICAL HISTORY (New Feature)
// ==========================================

// GET /patient/medical-history
// Fetches only COMPLETED appointments which contain diagnosis/prescription
exports.getMedicalHistory = async (req, res) => {
    try {
        const history = await Appointment.find({ 
            patientId: req.user.id,
            status: 'completed' // Only show finished consultations
        })
        .populate('doctorId', 'name specialization') // Show Doctor details
        .sort({ date: -1 }); // Newest first

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching medical history' });
    }
};

// ==========================================
// 4. PHARMACY CATALOG (New Feature)
// ==========================================

// GET /patient/medicines
// Fetches all available medicines from all pharmacies
exports.getAllMedicines = async (req, res) => {
    try {
        // Find medicines with stock > 0
        const medicines = await Medicine.find({ stock: { $gt: 0 } })
            .populate('pharmacyId', 'name address'); // Show which pharmacy sells it
        
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching medicines' });
    }
};

// POST /patient/reserve-medicine
// Creates an order for "Click & Collect"
exports.reserveMedicine = async (req, res) => {
    const { pharmacyId, medicineId, medicineName, price } = req.body;

    try {
        const newOrder = new Order({
            patientId: req.user.id,
            pharmacyId,
            medicineId,
            medicineName,
            price,
            status: 'Pending'
        });

        const savedOrder = await newOrder.save();
        res.status(201).json({ message: 'Medicine reserved successfully!', order: savedOrder });
    } catch (err) {
        res.status(400).json({ message: 'Error reserving medicine' });
    }
};