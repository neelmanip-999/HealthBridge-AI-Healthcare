import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socketManager from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ currentUser, selectedUser, onBack, userType }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      socketManager.connect(token);
      
      // Set up socket event listeners
      socketManager.on('new_message', handleNewMessage);
      socketManager.on('user_typing', handleUserTyping);
      socketManager.on('connection_status', handleConnectionStatus);
      socketManager.on('message_sent', handleMessageSent);
      socketManager.on('error', handleSocketError);

      return () => {
        socketManager.off('new_message', handleNewMessage);
        socketManager.off('user_typing', handleUserTyping);
        socketManager.off('connection_status', handleConnectionStatus);
        socketManager.off('message_sent', handleMessageSent);
        socketManager.off('error', handleSocketError);
      };
    }
  }, [token]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      // Join conversation room
      socketManager.joinConversation(selectedUser.userId);
      
      // Mark messages as read
      markMessagesAsRead();

      return () => {
        socketManager.leaveConversation(selectedUser.userId);
      };
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/conversation/${selectedUser.userId}`);
      setMessages(response.data);
    } catch (error) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await axios.put(`/api/messages/mark-read/${selectedUser.userId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleNewMessage = (data) => {
    if (data.sender.id === selectedUser.userId) {
      setMessages(prev => [...prev, data.message]);
      setOtherUserTyping(false);
    }
  };

  const handleUserTyping = (data) => {
    if (data.senderId === selectedUser.userId) {
      setOtherUserTyping(data.isTyping);
    }
  };

  const handleConnectionStatus = (data) => {
    setConnectionStatus(data.connected);
  };

  const handleMessageSent = (data) => {
    if (data.receiver.id === selectedUser.userId) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleSocketError = (error) => {
    console.error('Socket error:', error);
    setError('Connection error. Please try again.');
  };

  const sendMessage = (messageText) => {
    if (messageText.trim() && connectionStatus) {
      socketManager.sendMessage(selectedUser.userId, messageText.trim());
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketManager.startTyping(selectedUser.userId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketManager.stopTyping(selectedUser.userId);
    }, 1000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      socketManager.stopTyping(selectedUser.userId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  userType === 'doctor' ? 'bg-secondary-100' : 'bg-primary-100'
                }`}>
                  <span className="text-lg font-medium text-gray-700">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    {userType === 'doctor' ? selectedUser.name : `Dr. ${selectedUser.name}`}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        selectedUser.isOnline ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-500">
                      {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">
                      {connectionStatus ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <MessageList
            messages={messages}
            currentUserId={currentUser.id}
            currentUserType={currentUser.type}
          />
          <TypingIndicator
            isVisible={otherUserTyping}
            userName={selectedUser.name}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <MessageInput
          onSendMessage={sendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={!connectionStatus}
          placeholder={
            connectionStatus
              ? `Type a message to ${userType === 'doctor' ? selectedUser.name : `Dr. ${selectedUser.name}`}...`
              : 'Connecting...'
          }
        />
      </div>
    </div>
  );
};

export default ChatWindow;

