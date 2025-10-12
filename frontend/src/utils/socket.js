import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connection_error', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Generic event emitter
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Send message
  sendMessage(receiverId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        receiverId,
        message
      });
    }
  }

  // Start typing
  startTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { receiverId });
    }
  }

  // Stop typing
  stopTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { receiverId });
    }
  }

  // Join conversation
  joinConversation(otherUserId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', { otherUserId });
    }
  }

  // Leave conversation
  leaveConversation(otherUserId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { otherUserId });
    }
  }

  // Get online users
  getOnlineUsers() {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_online_users');
    }
  }

  getSocket() {
    return this.socket;
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager;

