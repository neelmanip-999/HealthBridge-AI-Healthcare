const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// FIX: Ensure the import correctly references the Mongoose model. 
// If Doctor.js uses module.exports = mongoose.model(...), this is correct.
const Doctor = require('../models/Doctor'); 
const { doctorRegisterValidation, doctorLoginValidation } = require('../validations/doctorValidation');

// Shared function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'doctor' }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// POST /doctor/register
exports.registerDoctor = async (req, res) => {
  // 1. Validate input with Joi
  const { error } = doctorRegisterValidation.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  try {
    // 2. Check if doctor already exists
    // LINE 21 (where the error occurs)
    const emailExists = await Doctor.findOne({ email: req.body.email }); 
    if (emailExists) return res.status(400).send({ message: 'Email already exists' });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 4. Create and save new doctor
    const doctor = new Doctor({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      specialization: req.body.specialization,
      fees: req.body.fees,
    });
    
    const savedDoctor = await doctor.save();
    
    // 5. Generate Token and respond
    const token = generateToken(savedDoctor._id);
    res.header('auth-token', token).send({
      token,
      doctor: { id: savedDoctor._id, name: savedDoctor.name, email: savedDoctor.email, specialization: savedDoctor.specialization },
    });

  } catch (err) {
    // If the error persists after the fix, it will be caught here. 
    // Console log the full error for detailed inspection.
    console.error("Registration error:", err); 
    res.status(500).send({ message: 'Server error during registration.' });
  }
};

// POST /doctor/login
exports.loginDoctor = async (req, res) => {
  // 1. Validate input with Joi
  const { error } = doctorLoginValidation.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  try {
    // 2. Check if email exists
    const doctor = await Doctor.findOne({ email: req.body.email });
    if (!doctor) return res.status(400).send({ message: 'Invalid Credentials.' });

    // 3. Check password
    const validPass = await bcrypt.compare(req.body.password, doctor.password);
    if (!validPass) return res.status(400).send({ message: 'Invalid Credentials.' });

    // 4. Generate Token and respond
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

// PUT /doctor/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doctorId = req.user.id; // From auth middleware

    // Validate status
    const validStatuses = ['online', 'offline', 'free', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).send({ message: 'Invalid status. Must be one of: online, offline, free, busy' });
    }

    // Update doctor status
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

// Note: Ensure your Doctor.js file looks like this:
// // backend/models/Doctor.js
// const mongoose = require('mongoose');
// // ... Schema definition ...
// module.exports = mongoose.model('Doctor', DoctorSchema);
