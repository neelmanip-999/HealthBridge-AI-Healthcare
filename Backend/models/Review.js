const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  patientName: { type: String, required: true }, // Store name to avoid extra population queries
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

// Compound index to ensure a patient can review a doctor only once (Optional, but good practice)
ReviewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);