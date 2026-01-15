// HealthBridge/backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  senderRole: { type: String, enum: ['doctor', 'patient'], required: true },
  
  // Modified: Message is optional now (default empty) in case sending only a file
  message: { type: String, default: '' },
  
  // --- NEW FIELDS FOR ATTACHMENTS ---
  attachmentUrl: { type: String, default: null }, // The link to the image/pdf/meeting
  
  // *** CRITICAL FIX: Added 'video_call' to the enum ***
  attachmentType: { 
    type: String, 
    enum: ['image', 'pdf', 'video_call', 'none'], // <--- Updated here
    default: 'none' 
  }, 
  // ----------------------------------

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);