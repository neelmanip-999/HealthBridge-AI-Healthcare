const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const { patientRegisterValidation, patientLoginValidation } = require('../validations/patientValidation');
const Doctor = require('../models/Doctor'); // Required for currentDoctor ref and fetching doctor lists

// Shared function to generate JWT
const generateToken = (id) => {
    // Note: The role is explicitly added here for frontend protection checks
    return jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

// POST /patient/register
exports.registerPatient = async (req, res) => {
    // 1. Validate input with Joi
    const { error } = patientRegisterValidation.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    // 2. Check if patient already exists
    const emailExists = await Patient.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    try {
        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // 4. Create and save new patient
        const patient = new Patient({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            age: req.body.age,
            gender: req.body.gender,
            medicalHistory: req.body.medicalHistory || [],
        });
        
        const savedPatient = await patient.save();
        
        // 5. Generate Token and respond
        const token = generateToken(savedPatient._id);
        res.header('auth-token', token).send({
            token,
            patient: { 
                id: savedPatient._id, 
                name: savedPatient.name, 
                email: savedPatient.email, 
                age: savedPatient.age 
            },
        });

    } catch (err) {
        console.error("Patient Registration Error:", err);
        res.status(500).send({ message: 'Server error during registration.' });
    }
};

// POST /patient/login
exports.loginPatient = async (req, res) => {
    // 1. Validate input with Joi
    const { error } = patientLoginValidation.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        // 2. Check if email exists
        const patient = await Patient.findOne({ email: req.body.email });
        if (!patient) return res.status(400).send({ message: 'Invalid Credentials.' });

        // 3. Check password
        const validPass = await bcrypt.compare(req.body.password, patient.password);
        if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

        // 4. Generate Token and respond
        const token = generateToken(patient._id);
        res.header('auth-token', token).send({
            token,
            patient: { 
                id: patient._id, 
                name: patient.name, 
                email: patient.email, 
                age: patient.age 
            },
        });

    } catch (err) {
        console.error("Patient Login Error:", err);
        res.status(500).send({ message: 'Server error during login.' });
    }
};

// GET /patient/doctors - Get list of doctors with status
exports.getAvailableDoctors = async (req, res) => {
    try {
        // Fetch specific fields (name, email, specialization, fees, status) and exclude password
        const doctors = await Doctor.find({}, 'name email specialization fees status')
            // Sort by status: 'free' first (1), then 'online' (2), 'busy' (3), 'offline' (4), then sort by name
            .sort({ status: 1, name: 1 }); 
        
        res.send(doctors);
    } catch (err) {
        console.error("Get doctors error:", err);
        res.status(500).send({ message: 'Server error while fetching doctors.' });
    }
};

// POST /patient/connect/:doctorId - Start chat session
exports.connectWithDoctor = async (req, res) => {
    // Implementation needed: check doctor status, set doctor to busy, save currentDoctor ID to patient, notify doctor via Socket.io
    res.status(501).send({ message: 'Doctor connection logic not yet fully implemented.' });
};
