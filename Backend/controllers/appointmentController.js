const Appointment = require('../models/Appointment');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, timeSlot, symptoms, consultationType } = req.body;
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  const existing = await Appointment.findOne({ doctorId, appointmentDate, timeSlot, status: { $ne: 'cancelled' } });
  if (existing) { res.status(400); throw new Error('Time slot already booked'); }
  const appointment = await Appointment.create({ patientId: req.user._id, doctorId, appointmentDate, timeSlot, symptoms, consultationType, consultationFee: doctor.doctorDetails.consultationFee });
  const populated = await Appointment.findById(appointment._id).populate('patientId','name email phone').populate('doctorId','name email doctorDetails');
  res.status(201).json(populated);
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate('patientId','name email phone patientDetails').populate('doctorId','name email doctorDetails');
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.patientId._id.toString() !== req.user._id.toString() && appointment.doctorId._id.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  res.json(appointment);
});

const getMyAppointments = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'patient') query.patientId = req.user._id;
  else if (req.user.role === 'doctor') query.doctorId = req.user._id;
  else { res.status(403); throw new Error('Not authorized'); }
  const appointments = await Appointment.find(query).populate('patientId','name email phone').populate('doctorId','name email doctorDetails').sort({ appointmentDate: -1 });
  res.json(appointments);
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.patientId.toString() !== req.user._id.toString() && appointment.doctorId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  appointment.status = status;
  await appointment.save();
  res.json({ message: 'Appointment status updated', appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.patientId.toString() !== req.user._id.toString() && appointment.doctorId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (appointment.status === 'completed') { res.status(400); throw new Error('Cannot cancel completed appointment'); }
  appointment.status = 'cancelled';
  await appointment.save();
  res.json({ message: 'Appointment cancelled', appointment });
});

const addPrescription = asyncHandler(async (req, res) => {
  const { medicines, diagnosis, additionalNotes } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.doctorId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  appointment.prescription = { medicines, diagnosis, additionalNotes, prescribedAt: new Date() };
  appointment.status = 'completed';
  await appointment.save();
  res.json({ message: 'Prescription added', appointment });
});

const rateAppointment = asyncHandler(async (req, res) => {
  const { score, review } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.patientId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (appointment.status !== 'completed') { res.status(400); throw new Error('Can only rate completed appointments'); }
  appointment.rating = { score, review, ratedAt: new Date() };
  await appointment.save();
  const doctor = await User.findById(appointment.doctorId);
  if (doctor) {
    const currentTotal = doctor.doctorDetails.rating * doctor.doctorDetails.totalRatings;
    doctor.doctorDetails.totalRatings += 1;
    doctor.doctorDetails.rating = (currentTotal + score) / doctor.doctorDetails.totalRatings;
    await doctor.save();
  }
  res.json({ message: 'Rating submitted', appointment });
});

module.exports = { createAppointment, getAppointmentById, getMyAppointments, updateAppointmentStatus, cancelAppointment, addPrescription, rateAppointment };
