const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');

const register = asyncHandler(async (req, res) => {
  const { email, password, role, name, phone, ...rest } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('User exists'); }

  let data = { email, password, role, name, phone };
  if (role === 'patient') data.patientDetails = { age: rest.age, gender: rest.gender, bloodGroup: rest.bloodGroup, address: rest.address, city: rest.city, state: rest.state, pincode: rest.pincode, emergencyContact: rest.emergencyContact };
  if (role === 'doctor') data.doctorDetails = { specialization: rest.specialization, qualifications: rest.qualifications||[], experience: rest.experience, registrationNumber: rest.registrationNumber, consultationFee: rest.consultationFee, about: rest.about, clinicAddress: rest.clinicAddress, city: rest.city, state: rest.state, pincode: rest.pincode, availability: rest.availability||[] };
  if (role === 'pharmacy') data.pharmacyDetails = { pharmacyName: rest.pharmacyName, registrationNumber: rest.registrationNumber, licenseNumber: rest.licenseNumber, address: rest.address, city: rest.city, state: rest.state, pincode: rest.pincode, operatingHours: rest.operatingHours, deliveryAvailable: rest.deliveryAvailable, location: { type:'Point', coordinates: rest.coordinates || [0,0] } };

  const user = await User.create(data);
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email, role });
  if (user && await user.matchPassword(password)) {
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
  } else {
    res.status(401); throw new Error('Invalid credentials');
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.password) user.password = req.body.password;
  if (user.role === 'patient' && req.body.patientDetails) user.patientDetails = { ...user.patientDetails, ...req.body.patientDetails };
  if (user.role === 'doctor' && req.body.doctorDetails) user.doctorDetails = { ...user.doctorDetails, ...req.body.doctorDetails };
  if (user.role === 'pharmacy' && req.body.pharmacyDetails) user.pharmacyDetails = { ...user.pharmacyDetails, ...req.body.pharmacyDetails };
  const updated = await user.save();
  res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, token: generateToken(updated._id, updated.role) });
});

module.exports = { register, login, getProfile, updateProfile };
