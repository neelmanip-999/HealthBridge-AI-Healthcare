const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  timeSlot: { 
    type: String, 
    required: true // Format: "10:00 - 10:30"
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentId: { 
    type: String // Stores the Razorpay/Stripe Payment ID
  },
  // --- NEW FIELDS FOR MEDICAL HISTORY ---
  diagnosis: {
    type: String, // Doctor adds this after consultation
    default: ''
  },
  prescription: {
    type: String, // Doctor adds this after consultation
    default: ''
  },
  // -------------------------------------
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);