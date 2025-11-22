import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext'; // <-- Use the shared context

const ChatWindow = ({ partner, onEndChat, userRole }) => {
    const { socket, isConnected } = useSocket(); // <-- Get shared socket and connection status
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?._id; // <-- FIX: Use _id to match MongoDB
    const isDoctor = userRole === 'doctor';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Effect for fetching initial chat history
    useEffect(() => {
        if (!currentUserId || !partner?._id) return;
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/history/${currentUserId}/${partner._id}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, [currentUserId, partner._id]);

    // Effect for listening to incoming messages on the shared socket
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            // Add the new message to the state
            setMessages((prev) => [...prev, message]);
        };

        socket.on('receiveMessage', handleReceiveMessage);

        // Cleanup the listener when the component unmounts
        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [socket]); // Re-run only if the socket instance changes

    useEffect(scrollToBottom, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() === '' || !socket || !isConnected) return;

        const messageData = {
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: input.trim(),
        };

        socket.emit('sendMessage', messageData);
        setInput('');
    };

    const handleEndChat = async () => {
        if (!window.confirm("Are you sure you want to end this consultation?")) return;
        try {
            if (isDoctor) {
                await api.put('/doctor/status', { status: 'free' });
            }
            if (socket) {
                socket.emit('endConsultation', { partnerId: partner._id });
            }
            onEndChat();
        } catch (err) {
            console.error("Error ending consultation:", err);
            onEndChat();
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-indigo-700">Chat with {partner.name}</h3>
                <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${isConnected ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                        {isConnected ? 'Live' : 'Connecting...'}
                    </span>
                    <button onClick={handleEndChat} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={msg._id || index} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md p-3 rounded-xl shadow-md ${msg.senderId === currentUserId ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 rounded-tl-none'}`}>
                            <p>{msg.message}</p>
                            <span className={`text-xs mt-1 block ${msg.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t flex space-x-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-3 border rounded-xl"
                    disabled={!isConnected}
                />
                <button type="submit" className="bg-indigo-600 text-white py-3 px-5 rounded-xl disabled:opacity-50" disabled={!isConnected || input.trim() === ''}>
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;

