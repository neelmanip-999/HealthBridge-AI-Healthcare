// HealthBridge/backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  senderRole: { type: String, enum: ['doctor', 'patient'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);