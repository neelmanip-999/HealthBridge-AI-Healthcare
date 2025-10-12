const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medicines: [{ name:String, quantity:Number, price:Number }],
  totalAmount: { type:Number, required:true },
  status: { type: String, enum: ['pending','confirmed','processing','delivered','cancelled'], default: 'pending' },
  deliveryType: { type:String, enum:['pickup','delivery'], default:'pickup' },
  deliveryAddress: { address:String, city:String, state:String, pincode:String },
  paymentMethod: { type:String, enum:['online','cod'], default:'online' },
  paymentStatus: { type:String, enum:['pending','paid','refunded'], default:'pending' },
  paymentId: String,
  orderNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Order', orderSchema);
