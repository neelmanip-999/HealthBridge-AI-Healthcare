const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

const createOrder = asyncHandler(async (req, res) => {
  const { pharmacyId, appointmentId, medicines, deliveryType, deliveryAddress, paymentMethod } = req.body;
  const totalAmount = medicines.reduce((s,m)=>s + (m.price * m.quantity), 0);
  const order = await Order.create({ patientId: req.user._id, pharmacyId, appointmentId, medicines, totalAmount, deliveryType, deliveryAddress, paymentMethod });
  const populated = await Order.findById(order._id).populate('pharmacyId','pharmacyDetails').populate('patientId','name email phone');
  res.status(201).json(populated);
});

const getMyOrders = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'patient') query.patientId = req.user._id;
  else if (req.user.role === 'pharmacy') query.pharmacyId = req.user._id;
  else { res.status(403); throw new Error('Not authorized'); }
  const orders = await Order.find(query).populate('pharmacyId','pharmacyDetails').populate('patientId','name email phone').sort({ createdAt: -1 });
  res.json(orders);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.patientId.toString() !== req.user._id.toString() && order.pharmacyId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  if (order.status === 'delivered') { res.status(400); throw new Error('Cannot cancel delivered'); }
  order.status = 'cancelled';
  await order.save();
  res.json({ message: 'Order cancelled', order });
});

module.exports = { createOrder, getMyOrders, cancelOrder };
