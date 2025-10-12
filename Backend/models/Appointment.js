const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['scheduled','completed','cancelled','in-progress'], default: 'scheduled' },
  consultationType: { type: String, enum: ['chat','video','both'], default: 'chat' },
  symptoms: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
  paymentId: String,
  consultationFee: { type: Number, required: true },
  prescription: { medicines: [{ name:String,dosage:String,duration:String,instructions:String }], diagnosis:String, additionalNotes:String, prescribedAt:Date },
  rating: { score: { type:Number, min:1, max:5 }, review:String, ratedAt:Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Appointment', appointmentSchema);
