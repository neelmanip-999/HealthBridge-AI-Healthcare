import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, RotateCcw } from 'lucide-react';
import io from 'socket.io-client';
import api from '../services/api';

const SOCKET_SERVER_URL = "http://localhost:5000";

// Initialize socket connection outside the component and memoize it
// We connect automatically when the ChatWindow component mounts
const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false,
    transports: ['websocket']
});

const ChatWindow = ({ partner, sessionId, onEndChat, userRole, initialMessages = [] }) => {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?.id;
    const isDoctor = userRole === 'doctor';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- Socket.io Handlers ---
    useEffect(() => {
        if (!currentUserId || !sessionId) return;

        // 1. Connect and identify user/room
        socket.auth = { userId: currentUserId, sessionId };
        if (!socket.connected) {
            socket.connect();
        }

        socket.on('connect', () => {
            setIsConnected(true);
            console.log(`Socket connected. User ID: ${currentUserId}`);
        });

        // 2. Receive messages
        socket.on('receiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });
        
        // 3. Handle consultation ended by partner
        socket.on('consultationEnded', (data) => {
            if (data.sessionId === sessionId) {
                // Use a simple modal/alert for confirmation (avoid browser alert in production)
                window.alert(`${partner.name} has ended the consultation. Closing chat.`);
                onEndChat(); // Clears chat session state in parent dashboard
            }
        });

        // 4. Cleanup on component unmount
        return () => {
            socket.off('connect');
            socket.off('receiveMessage');
            socket.off('consultationEnded');
            socket.disconnect();
            setIsConnected(false);
        };
    }, [currentUserId, sessionId, onEndChat, partner.name]);

    useEffect(scrollToBottom, [messages]);

    // --- Message Logic ---
    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const message = {
            senderId: currentUserId,
            receiverId: partner.id,
            senderRole: userRole,
            message: input.trim(),
            timestamp: Date.now(),
        };

        socket.emit('sendMessage', message);
        setMessages((prevMessages) => [...prevMessages, message]);
        setInput('');
    };

    // --- End Chat Logic ---
    const handleEndChat = async () => {
        if (!window.confirm("Are you sure you want to end this consultation?")) {
            return;
        }

        try {
            // 1. Only Doctor updates status back to 'free' via API
            if (isDoctor) {
                 await api.put('/doctor/status', { status: 'free' });
                 // Update local doctor status immediately
                 const updatedDoctor = { ...currentUser, status: 'free' };
                 localStorage.setItem('user', JSON.stringify(updatedDoctor));
            }
           
            // 2. Notify partner and trigger server-side cleanup
            socket.emit('endConsultation', { sessionId, endedBy: userRole });

            // 3. Clear local state
            onEndChat();

        } catch (err) {
            console.error("Error ending consultation:", err);
            // Even if API fails, clear locally to allow navigation
            onEndChat(); 
        }
    };


    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-indigo-200 bg-indigo-50 rounded-t-3xl flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-bold text-indigo-700">Chat with {partner.name}</h3>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isConnected ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {isConnected ? 'Live' : 'Connecting...'}
                    </span>
                    <button 
                        onClick={handleEndChat}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
                        title="End Consultation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <RotateCcw className="w-8 h-8 mx-auto mb-3 animate-spin-slow" />
                        <p>Starting secure consultation...</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md ${
                            msg.senderId === currentUserId 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-gray-200 text-gray-800 rounded-tl-none'
                        }`}>
                            <p>{msg.message}</p>
                            <span className={`text-xs mt-1 block ${msg.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 border-t border-indigo-200 bg-indigo-50 rounded-b-3xl flex space-x-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-3 input-field focus:ring-indigo-500 focus:border-indigo-500 rounded-xl"
                    disabled={!isConnected}
                />
                <button
                    type="submit"
                    className="btn-primary btn-ripple py-3 px-5 disabled:opacity-50"
                    disabled={!isConnected || input.trim() === ''}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
