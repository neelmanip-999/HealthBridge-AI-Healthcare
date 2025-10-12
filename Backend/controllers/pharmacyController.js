const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');

const getNearbyPharmacies = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 5000 } = req.query;
  if (!lat || !lng) { res.status(400); throw new Error('lat/lng required'); }
  const pharmacies = await User.find({ role:'pharmacy', isActive:true, 'pharmacyDetails.location': { $near: { $geometry: { type:'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: parseInt(maxDistance) } } }).select('-password');
  res.json(pharmacies);
});

const getAllPharmacies = asyncHandler(async (req, res) => {
  const { city, deliveryAvailable } = req.query;
  let query = { role:'pharmacy', isActive:true };
  if (city) query['pharmacyDetails.city'] = new RegExp(city,'i');
  if (deliveryAvailable !== undefined) query['pharmacyDetails.deliveryAvailable'] = deliveryAvailable === 'true';
  const pharmacies = await User.find(query).select('-password');
  res.json(pharmacies);
});

const getPharmacyOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = { pharmacyId: req.user._id };
  if (status) query.status = status;
  const orders = await Order.find(query).populate('patientId','name email phone patientDetails').populate('appointmentId','prescription').sort({ createdAt: -1 });
  res.json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.pharmacyId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  order.status = status;
  await order.save();
  res.json({ message: 'Order updated', order });
});

module.exports = { getNearbyPharmacies, getAllPharmacies, getPharmacyOrders, updateOrderStatus };
