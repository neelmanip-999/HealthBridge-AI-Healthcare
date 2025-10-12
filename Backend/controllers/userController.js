const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.password) user.password = req.body.password;
  if (user.role === 'patient' && req.body.patientDetails) user.patientDetails = { ...user.patientDetails, ...req.body.patientDetails };
  if (user.role === 'doctor' && req.body.doctorDetails) user.doctorDetails = { ...user.doctorDetails, ...req.body.doctorDetails };
  if (user.role === 'pharmacy' && req.body.pharmacyDetails) user.pharmacyDetails = { ...user.pharmacyDetails, ...req.body.pharmacyDetails };
  const updated = await user.save();
  res.json({ message: 'User updated', user: updated });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = false;
  await user.save();
  res.json({ message: 'User deactivated' });
});

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser };
