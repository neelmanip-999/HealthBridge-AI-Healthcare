const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const asyncHandler = require('express-async-handler');

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const appointment = await Appointment.findById(appointmentId).populate('doctorId','name doctorDetails');
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.patientId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (appointment.paymentStatus === 'paid') { res.status(400); throw new Error('Already paid'); }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: appointment.consultationFee * 100,
    currency: 'inr',
    metadata: { appointmentId, patientId: req.user._id.toString(), doctorId: appointment.doctorId._id.toString() }
  });
  res.json({ clientSecret: paymentIntent.client_secret, amount: appointment.consultationFee });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { appointmentId, paymentId } = req.body;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  appointment.paymentStatus = 'paid';
  appointment.paymentId = paymentId;
  await appointment.save();
  res.json({ message: 'Payment confirmed', appointment });
});

const processRefund = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) { res.status(404); throw new Error('Appointment not found'); }
  if (appointment.paymentStatus !== 'paid') { res.status(400); throw new Error('No payment to refund'); }
  if (appointment.status !== 'cancelled') { res.status(400); throw new Error('Only cancelled can be refunded'); }
  const refund = await stripe.refunds.create({ payment_intent: appointment.paymentId });
  appointment.paymentStatus = 'refunded';
  await appointment.save();
  res.json({ message: 'Refund processed', refundId: refund.id, appointment });
});

module.exports = { createPaymentIntent, confirmPayment, processRefund };
