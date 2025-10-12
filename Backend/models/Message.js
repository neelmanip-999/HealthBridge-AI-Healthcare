const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  senderRole: { type: String, enum: ['patient','doctor'], required: true },
  isRead: { type: Boolean, default: false },
  attachments: [{ type: String }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = require('mongoose').model('Message', messageSchema);
