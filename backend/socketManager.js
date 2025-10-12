const jwt = require('jsonwebtoken');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Message = require('./models/Message');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map(); // userId -> socketId mapping
    this.typingUsers = new Map(); // userId -> Set of users they're typing to
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('New connection attempt:', socket.id);

      // Authenticate user
      const user = await this.authenticateUser(socket);
      if (!user) {
        socket.disconnect();
        return;
      }

      console.log(`${user.type} connected:`, user.name);
      
      // Store user's socket ID
      this.onlineUsers.set(user.userId, socket.id);
      await this.updateUserSocketId(user.userId, user.type, socket.id);

      // Join user to their personal room
      socket.join(user.userId);

      // Emit user online status to relevant users
      this.emitUserStatus(user.userId, user.type, true);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`${user.type} disconnected:`, user.name);
        this.handleDisconnect(user.userId, user.type, socket.id);
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, user, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(user.userId, data.receiverId, socket);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(user.userId, data.receiverId, socket);
      });

      // Handle getting online users
      socket.on('get_online_users', () => {
        this.sendOnlineUsers(socket, user.type);
      });

      // Handle joining conversation room
      socket.on('join_conversation', (data) => {
        socket.join(`conversation_${user.userId}_${data.otherUserId}`);
      });

      // Handle leaving conversation room
      socket.on('leave_conversation', (data) => {
        socket.leave(`conversation_${user.userId}_${data.otherUserId}`);
      });
    });
  }

  async authenticateUser(socket) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        socket.emit('error', { message: 'No token provided' });
        return null;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = null;
      if (decoded.userType === 'Doctor') {
        user = await Doctor.findById(decoded.userId);
      } else if (decoded.userType === 'Patient') {
        user = await Patient.findById(decoded.userId);
      }

      if (!user) {
        socket.emit('error', { message: 'Invalid token' });
        return null;
      }

      return {
        userId: user._id.toString(),
        userType: decoded.userType,
        name: user.name,
        email: user.email
      };
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
      return null;
    }
  }

  async updateUserSocketId(userId, userType, socketId) {
    try {
      if (userType === 'Doctor') {
        await Doctor.findByIdAndUpdate(userId, { socketId });
      } else {
        await Patient.findByIdAndUpdate(userId, { socketId });
      }
    } catch (error) {
      console.error('Error updating socket ID:', error);
    }
  }

  emitUserStatus(userId, userType, isOnline) {
    // Get all conversations for this user and notify relevant users
    const eventName = isOnline ? 'user_online' : 'user_offline';
    const data = { userId, userType, isOnline };
    
    // Emit to all connected sockets (in a real app, you'd be more selective)
    this.io.emit(eventName, data);
  }

  async handleDisconnect(userId, userType, socketId) {
    // Remove from online users
    this.onlineUsers.delete(userId);
    
    // Clear typing status
    this.typingUsers.delete(userId);
    
    // Update database
    await this.updateUserSocketId(userId, userType, null);
    
    // Emit offline status
    this.emitUserStatus(userId, userType, false);
  }

  async handleSendMessage(socket, sender, data) {
    try {
      const { receiverId, message } = data;
      
      if (!receiverId || !message) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      // Determine receiver type
      const receiverType = sender.userType === 'Doctor' ? 'Patient' : 'Doctor';
      const senderType = sender.userType;

      // Save message to database
      const newMessage = new Message({
        senderId: sender.userId,
        senderType,
        receiverId,
        receiverType,
        message: message.trim()
      });

      await newMessage.save();

      // Emit message to receiver if online
      const receiverSocketId = this.onlineUsers.get(receiverId);
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('new_message', {
          message: newMessage,
          sender: {
            id: sender.userId,
            name: sender.name,
            type: sender.userType
          }
        });
      }

      // Emit confirmation to sender
      socket.emit('message_sent', {
        message: newMessage,
        receiver: {
          id: receiverId,
          type: receiverType
        }
      });

      // Emit to conversation room
      this.io.to(`conversation_${sender.userId}_${receiverId}`).emit('conversation_update', {
        message: newMessage
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(senderId, receiverId, socket) {
    if (!this.typingUsers.has(senderId)) {
      this.typingUsers.set(senderId, new Set());
    }
    
    this.typingUsers.get(senderId).add(receiverId);
    
    const receiverSocketId = this.onlineUsers.get(receiverId);
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit('user_typing', {
        senderId,
        isTyping: true
      });
    }
  }

  handleTypingStop(senderId, receiverId, socket) {
    if (this.typingUsers.has(senderId)) {
      this.typingUsers.get(senderId).delete(receiverId);
      
      const receiverSocketId = this.onlineUsers.get(receiverId);
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('user_typing', {
          senderId,
          isTyping: false
        });
      }
    }
  }

  sendOnlineUsers(socket, userType) {
    try {
      const onlineUsersList = Array.from(this.onlineUsers.entries()).map(([userId, socketId]) => ({
        userId,
        socketId
      }));

      socket.emit('online_users', onlineUsersList);
    } catch (error) {
      console.error('Error sending online users:', error);
    }
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }
}

module.exports = SocketManager;

