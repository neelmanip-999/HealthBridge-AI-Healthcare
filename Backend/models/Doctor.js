const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  specialization: { type: String, required: true },
  fees: { type: Number, required: true, default: 0 },
  experience: { type: Number, default: 0 }, // Added for UI display
  about: { type: String, default: "Experienced medical professional." }, // Added for profile details
  image: { 
    type: String, 
    default: "https://cdn-icons-png.flaticon.com/512/377/377429.png" 
  },
  
  // CRITICAL FOR BOOKING: Defines when the doctor is available
  availableSlots: [
    {
      day: { type: String }, // e.g., "Monday"
      startTime: { type: String }, // e.g., "10:00"
      endTime: { type: String } // e.g., "17:00"
    }
  ],

  status: {
    type: String,
    enum: ["online", "offline", "free", "busy"],
    default: "offline"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', DoctorSchema);