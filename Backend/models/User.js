const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient','doctor','pharmacy'], required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  profileImage: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  patientDetails: {
    age: Number,
    gender: { type: String, enum: ['male','female','other'] },
    bloodGroup: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    emergencyContact: String,
    medicalHistory: [{ condition: String, diagnosedDate: Date, medications: [String] }]
  },
  doctorDetails: {
    specialization: String,
    qualifications: [String],
    experience: Number,
    registrationNumber: String,
    consultationFee: Number,
    availability: [{ day: String, startTime: String, endTime: String }],
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    about: String,
    clinicAddress: String,
    city: String,
    state: String,
    pincode: String
  },
  pharmacyDetails: {
    pharmacyName: String,
    registrationNumber: String,
    licenseNumber: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    operatingHours: { opening: String, closing: String },
    deliveryAvailable: { type: Boolean, default: false },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ 'pharmacyDetails.location': '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = require('mongoose').model('User', userSchema);
