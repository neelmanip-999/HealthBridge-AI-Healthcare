const User = require('../models/User');
const Appointment = require('../models/Appointment');
const asyncHandler = require('express-async-handler');

const getAllDoctors = asyncHandler(async (req, res) => {
  const { specialization, city, minFee, maxFee } = req.query;
  let query = { role: 'doctor', isActive: true };
  if (specialization) query['doctorDetails.specialization'] = new RegExp(specialization,'i');
  if (city) query['doctorDetails.city'] = new RegExp(city,'i');
  if (minFee || maxFee) {
    query['doctorDetails.consultationFee'] = {};
    if (minFee) query['doctorDetails.consultationFee'].$gte = Number(minFee);
    if (maxFee) query['doctorDetails.consultationFee'].$lte = Number(maxFee);
  }
  const doctors = await User.find(query).select('-password').sort({'doctorDetails.rating':-1});
  res.json(doctors);
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  res.json(doctor);
});

const searchDoctors = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) { res.status(400); throw new Error('Query required'); }
  const doctors = await User.find({ role:'doctor', isActive:true, $or:[ {name:new RegExp(q,'i')}, {'doctorDetails.specialization':new RegExp(q,'i')}, {'doctorDetails.city':new RegExp(q,'i')} ] }).select('-password').limit(Number(limit));
  res.json(doctors);
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  let query = { doctorId: req.user._id };
  if (status) query.status = status;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date); endDate.setDate(endDate.getDate()+1);
    query.appointmentDate = { $gte: startDate, $lt: endDate };
  }
  const appointments = await Appointment.find(query).populate('patientId','name email phone patientDetails').sort({ appointmentDate: 1 });
  res.json(appointments);
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const doctor = await User.findById(req.user._id);
  if (!doctor || doctor.role !== 'doctor') { res.status(404); throw new Error('Doctor not found'); }
  doctor.doctorDetails.availability = availability;
  await doctor.save();
  res.json({ message: 'Availability updated', availability: doctor.doctorDetails.availability });
});

const getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const totalAppointments = await Appointment.countDocuments({ doctorId });
  const completedAppointments = await Appointment.countDocuments({ doctorId, status:'completed' });
  const todayAppointments = await Appointment.countDocuments({ doctorId, appointmentDate: { $gte: new Date().setHours(0,0,0,0), $lt: new Date().setHours(23,59,59,999) } });
  const revenue = await Appointment.aggregate([{ $match: { doctorId, paymentStatus: 'paid' } }, { $group: { _id:null, total: { $sum: '$consultationFee' } } }]);
  res.json({ totalAppointments, completedAppointments, todayAppointments, totalRevenue: revenue[0]?.total || 0 });
});

module.exports = { getAllDoctors, getDoctorById, searchDoctors, getDoctorAppointments, updateAvailability, getDoctorStats };
