const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor'); 
const { doctorRegisterValidation, doctorLoginValidation } = require('../validations/doctorValidation');

// Shared function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'doctor' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// POST /doctor/register
exports.registerDoctor = async (req, res) => {
  // Note: You might need to update your Joi validation schema in 'doctorValidation.js' 
  // to allow these new fields (about, experience, etc.) or just validate the basics.
  const { error } = doctorRegisterValidation.validate(req.body, { allowUnknown: true });
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
      // NEW FIELDS added from Model update
      experience: req.body.experience,
      about: req.body.about,
      image: req.body.image,
      availableSlots: req.body.availableSlots || [] // Empty array if not provided
    });
    
    const savedDoctor = await doctor.save();
    
    const token = generateToken(savedDoctor._id);
    res.header('auth-token', token).send({
      token,
      doctor: { 
        id: savedDoctor._id, 
        name: savedDoctor.name, 
        email: savedDoctor.email, 
        specialization: savedDoctor.specialization 
      },
    });

  } catch (err) {
    console.error("Registration error:", err); 
    res.status(500).send({ message: 'Server error during registration.' });
  }
};

// POST /doctor/login
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
      doctor: { 
        id: doctor._id, 
        name: doctor.name, 
        email: doctor.email, 
        specialization: doctor.specialization, 
        status: doctor.status,
        image: doctor.image // sending image back on login is helpful
      },
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


// --- GET ALL DOCTORS WITH FILTERS ---
exports.getAllDoctors = async (req, res) => {
    try {
        const { category, search } = req.query; // Capture query params
        let query = {};

        // 1. Filter by Category (Specialization)
        if (category && category !== 'All' && category !== '') {
            query.specialization = category;
        }

        // 2. Filter by Name Search (Optional logic if you add a search bar later)
        if (search) {
             query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        const doctors = await Doctor.find(query).select('-password');
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- GET SINGLE DOCTOR PROFILE ---
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