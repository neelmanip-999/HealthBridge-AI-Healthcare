// HealthBridge/backend/models/Pharmacy.js
const mongoose = require('mongoose');

const PharmacySchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  pharmacistName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pharmacy', PharmacySchema);