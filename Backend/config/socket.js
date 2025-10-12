const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const activeUsers = new Map();

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: token missing'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    activeUsers.set(socket.userId, socket.id);
    socket.join(socket.userId);

    socket.on('join-appointment', (appointmentId) => {
      socket.join(`appointment-${appointmentId}`);
    });

    socket.on('send-message', async (data) => {
      const { appointmentId, receiverId, message, senderRole, senderName } = data;
      try {
        const newMessage = new Message({
          appointmentId,
          senderId: socket.userId,
          receiverId,
          message,
          senderRole
        });
        await newMessage.save();

        io.to(`appointment-${appointmentId}`).emit('receive-message', {
          ...newMessage.toObject(),
          senderName
        });

        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new-message-notification', {
            appointmentId,
            message,
            senderName
          });
        }
      } catch (err) {
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    socket.on('video-call-request', (data) => {
      const { receiverId, appointmentId, offer } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', {
          callerId: socket.userId,
          appointmentId,
          offer
        });
      } else {
        socket.emit('user-offline', { message: 'User offline' });
      }
    });

    socket.on('video-call-answer', (data) => {
      const { callerId, answer } = data;
      const callerSocketId = activeUsers.get(callerId);
      if (callerSocketId) io.to(callerSocketId).emit('call-answered', { answer });
    });

    socket.on('ice-candidate', (data) => {
      const { targetId, candidate } = data;
      const targetSocketId = activeUsers.get(targetId);
      if (targetSocketId) io.to(targetSocketId).emit('ice-candidate', { candidate });
    });

    socket.on('end-call', (data) => {
      const { targetId } = data;
      const targetSocketId = activeUsers.get(targetId);
      if (targetSocketId) io.to(targetSocketId).emit('call-ended');
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.userId);
    });
  });
};

module.exports = { initializeSocket };
