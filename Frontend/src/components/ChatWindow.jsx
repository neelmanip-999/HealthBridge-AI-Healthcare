import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

// Function to create a consistent Room ID regardless of who is user1 and user2.
// This is CRITICAL for room-based messaging.
const getChatRoomId = (id1, id2) => {
    // Ensure both IDs are strings before sorting
    const strId1 = String(id1);
    const strId2 = String(id2);
    // Sort the IDs to ensure the room name is always consistent (e.g., 'A-B' not 'B-A')
    const sortedIds = [strId1, strId2].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
};

const ChatWindow = ({ partner, onEndChat, userRole }) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Get the current user ID, handling both '_id' and 'id' fields
    const currentUserId = currentUser?._id || currentUser?.id; 
    const isDoctor = userRole === 'doctor';
    
    // Get the consistent room ID
    const roomId = getChatRoomId(currentUserId, partner._id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Fetch History
    useEffect(() => {
        if (!currentUserId || !partner?._id) return;

        const fetchHistory = async () => {
            try {
                // Ensure IDs are consistent with what the backend expects
                const response = await api.get(`/chat/history/${currentUserId}/${partner._id}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, [currentUserId, partner._id]);

    // 2. Listen for Incoming Messages & Join Room
    useEffect(() => {
        if (!socket || !currentUserId || !partner?._id) return;

        // **CRITICAL FIX 1: JOIN ROOM**
        // Tell the server which room this socket should listen to
        socket.emit('join_room', roomId); 

        const handleReceiveMessage = (message) => {
            // Check if the received message belongs to this current chat window
            // This is a safety check since the server now broadcasts to a room.
            const participantsMatch = 
                (message.senderId === currentUserId && message.receiverId === partner._id) ||
                (message.senderId === partner._id && message.receiverId === currentUserId);

            if (participantsMatch) {
                // **FIX 2: RELY ON SERVER ECHO**
                // Add the message only once (when confirmed and returned by the server)
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            // Clean up listener when the component unmounts or partner changes
            socket.off('receiveMessage', handleReceiveMessage);
            // Optional: socket.emit('leave_room', roomId);
        };
    }, [socket, currentUserId, partner._id, roomId]); // Dependency array includes roomId

    // Scroll on new message
    useEffect(scrollToBottom, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || !socket || !isConnected || !currentUserId) return;

        const messageData = {
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: input.trim(),
            timestamp: new Date().toISOString(),
            // **CRITICAL FIX 3: INCLUDE ROOM ID**
            roomId: roomId, 
        };

        // Emit the message and wait for the server to save it, then echo it back to us.
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
                // Notifying the partner and server
                socket.emit('endConsultation', { partnerId: partner._id });
                // Optional: socket.emit('leave_room', roomId);
            }
            onEndChat();
        } catch (err) {
            console.error("Error ending consultation:", err);
            onEndChat();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img 
                            src={partner.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} 
                            alt={partner.name}
                            className="w-10 h-10 rounded-full border border-gray-200 object-cover" 
                        />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{partner.name}</h3>
                        <span className="text-xs text-gray-500 flex items-center">
                            {isConnected ? 'Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
                <button onClick={handleEndChat} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                )}
                
                {messages.map((msg, index) => {
                    // Check senderId against currentUserId, handling both ObjectId and string comparison
                    const isMe = String(msg.senderId) === String(currentUserId);
                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm relative ${
                                isMe 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex space-x-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all outline-none"
                    disabled={!isConnected}
                />
                <button 
                    type="submit" 
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95 shadow-lg shadow-indigo-200" 
                    disabled={!isConnected || input.trim() === ''}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;