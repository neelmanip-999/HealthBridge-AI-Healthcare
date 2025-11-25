const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyUser', // UPDATED to match your file 'PharmacyUser.js'
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);