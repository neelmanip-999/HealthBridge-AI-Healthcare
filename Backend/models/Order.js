const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyUser',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  // --- EXISTING FIELDS ---
  prescription: {
    type: String,
    default: ''
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  // --- NEW DELIVERY FIELDS ---
  fulfillmentType: { 
      type: String, 
      enum: ['Pickup', 'Delivery'], 
      default: 'Pickup' 
  },
  deliveryAddress: { 
      type: String, 
      default: '' 
  },
  // ---------------------------
  status: {
    type: String,
    enum: ['Pending', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);