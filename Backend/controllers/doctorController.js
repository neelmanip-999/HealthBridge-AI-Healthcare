const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor'); 
const { doctorRegisterValidation, doctorLoginValidation } = require('../validations/doctorValidation');

// Shared function to generate JWT (Unchanged)
const generateToken = (id) => {
  return jwt.sign({ id, role: 'doctor' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// POST /doctor/register (Unchanged)
exports.registerDoctor = async (req, res) => {
  const { error } = doctorRegisterValidation.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  try {
    const emailExists = await Doctor.findOne({ email: req.body.email }); 
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const doctor = new Doctor({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      specialization: req.body.specialization,
      fees: req.body.fees,
    });
    
    const savedDoctor = await doctor.save();
    
    const token = generateToken(savedDoctor._id);
    res.header('auth-token', token).send({
      token,
      doctor: { id: savedDoctor._id, name: savedDoctor.name, email: savedDoctor.email, specialization: savedDoctor.specialization },
    });

  } catch (err) {
    console.error("Registration error:", err); 
    res.status(500).send({ message: 'Server error during registration.' });
  }
};

// POST /doctor/login (Unchanged)
exports.loginDoctor = async (req, res) => {
  const { error } = doctorLoginValidation.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  try {
    const doctor = await Doctor.findOne({ email: req.body.email });
    if (!doctor) return res.status(400).send({ message: 'Invalid Credentials.' });

    const validPass = await bcrypt.compare(req.body.password, doctor.password);
    if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

    const token = generateToken(doctor._id);
    res.header('auth-token', token).send({
      token,
      doctor: { id: doctor._id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, status: doctor.status },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ message: 'Server error during login.' });
  }
};

// PUT /doctor/status (Unchanged)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doctorId = req.user.id; 

    const validStatuses = ['online', 'offline', 'free', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).send({ message: 'Invalid status.' });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { status: status },
      { new: true, select: 'name email specialization fees status' }
    );

    if (!updatedDoctor) {
      return res.status(404).send({ message: 'Doctor not found' });
    }

    res.send({ 
      message: 'Status updated successfully',
      status: updatedDoctor.status,
      doctor: updatedDoctor
    });

  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send({ message: 'Server error during status update.' });
  }
};


// --- 1. ADD THIS FUNCTION TO GET ALL DOCTORS ---
// Corresponds to the GET /all route
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- 2. ADD THIS FUNCTION TO GET A SINGLE DOCTOR'S PROFILE ---
// Corresponds to the GET /profile/:id route
exports.getDoctorProfileById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('-password');
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Doctor not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
};

