const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');

const getMessagesForAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const messages = await Message.find({ appointmentId }).sort({ timestamp: 1 }).populate('senderId','name').populate('receiverId','name');
  res.json(messages);
});

const markAsRead = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  await Message.updateMany({ appointmentId, receiverId: req.user._id }, { isRead: true });
  res.json({ message: 'Messages marked as read' });
});

module.exports = { getMessagesForAppointment, markAsRead };
