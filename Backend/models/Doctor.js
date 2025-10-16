const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  specialization: { type: String, required: true },
  fees: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["online", "offline", "free", "busy"],
    default: "offline"
  },
  createdAt: { type: Date, default: Date.now }
});

// CRITICAL FIX: Ensure Mongoose creates and exports the model directly
module.exports = mongoose.model('Doctor', DoctorSchema);
