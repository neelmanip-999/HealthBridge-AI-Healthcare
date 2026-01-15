import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Paperclip, Video, FileText, PhoneIncoming, PhoneOff } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

// Helper to ensure consistent Room ID
const getChatRoomId = (id1, id2) => {
    const sortedIds = [String(id1), String(id2)].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
};

const ChatWindow = ({ partner, onEndChat, userRole }) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // --- VIDEO CALL STATE ---
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoRoomId, setVideoRoomId] = useState(null);
    const [incomingVideoCall, setIncomingVideoCall] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?._id || currentUser?.id; 
    const isDoctor = userRole === 'doctor';
    const roomId = getChatRoomId(currentUserId, partner._id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Fetch History
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

    // 2. Listen for Incoming Messages & Video Calls
    useEffect(() => {
        if (!socket || !currentUserId || !partner?._id) return;

        socket.emit('join_room', roomId); 

        const handleReceiveMessage = (message) => {
            const participantsMatch = 
                (message.senderId === currentUserId && message.receiverId === partner._id) ||
                (message.senderId === partner._id && message.receiverId === currentUserId);

            if (participantsMatch) {
                setMessages((prev) => [...prev, message]);

                // Detect Incoming Video Call
                if (message.attachmentType === 'video_call' && String(message.senderId) !== String(currentUserId)) {
                    setIncomingVideoCall({
                        meetingId: message.attachmentUrl,
                        senderName: partner.name
                    });
                }
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [socket, currentUserId, partner._id, roomId, partner.name]);

    useEffect(scrollToBottom, [messages]);

    // --- FILE UPLOAD LOGIC ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://localhost:5000/api/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { filePath, fileType } = res.data;

            const messageData = {
                senderId: currentUserId,
                receiverId: partner._id,
                senderRole: userRole,
                message: '',
                attachmentUrl: filePath,
                attachmentType: fileType,
                timestamp: new Date().toISOString(),
                roomId: roomId, 
            };
            socket.emit('sendMessage', messageData);
        } catch (err) {
            alert("Failed to upload file.");
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    // --- VIDEO CALL LOGIC ---
    const startVideoCall = () => {
        // Create a simpler, unique room name to avoid Jitsi collisions
        const meetingId = `HealthBridge-${Date.now()}`;
        
        const messageData = {
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: 'I have started a video call.',
            attachmentUrl: meetingId,
            attachmentType: 'video_call',
            timestamp: new Date().toISOString(),
            roomId: roomId, 
        };
        socket.emit('sendMessage', messageData);
        
        setVideoRoomId(meetingId);
        setShowVideoModal(true);
    };

    const acceptVideoCall = () => {
        if (incomingVideoCall) {
            setVideoRoomId(incomingVideoCall.meetingId);
            setShowVideoModal(true);
            setIncomingVideoCall(null);
        }
    };

    const declineVideoCall = () => {
        setIncomingVideoCall(null);
    };

    const joinVideoCallManual = (meetingId) => {
        setVideoRoomId(meetingId);
        setShowVideoModal(true);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || !socket || !isConnected) return;

        const messageData = {
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: input.trim(),
            attachmentUrl: null,
            attachmentType: 'none',
            timestamp: new Date().toISOString(),
            roomId: roomId, 
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
            onEndChat();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER HELPERS ---
    const renderAttachment = (url, type) => {
        if (type === 'video_call') {
            return (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl mb-2 flex flex-col items-center text-center">
                    <div className="bg-indigo-100 p-2 rounded-full mb-2">
                        <Video className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-indigo-800 mb-2">Video Consultation Invite</p>
                    <button onClick={() => joinVideoCallManual(url)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition w-full">Join Call</button>
                </div>
            );
        }
        const fullUrl = `http://localhost:5000${url}`;
        if (type === 'image') {
            return (
                <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer"><img src={fullUrl} alt="attachment" className="max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition" /></a>
                </div>
            );
        }
        if (type === 'pdf') {
            return (
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-blue-600 hover:bg-gray-200 transition mb-2">
                    <FileText className="w-5 h-5" /><span className="text-sm underline font-semibold">View Medical Report (PDF)</span>
                </a>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
            
            {/* --- INCOMING CALL POPUP --- */}
            {incomingVideoCall && !showVideoModal && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                        <PhoneIncoming className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{incomingVideoCall.senderName}</h2>
                    <p className="text-gray-300 mb-10 text-lg">is requesting a video call...</p>
                    <div className="flex gap-8">
                        <button onClick={declineVideoCall} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110 group-hover:bg-red-600"><PhoneOff className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Decline</span></button>
                        <button onClick={acceptVideoCall} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110 group-hover:bg-green-600 animate-pulse"><Video className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Accept</span></button>
                    </div>
                </div>
            )}

            {/* --- VIDEO MODAL (UPDATED WITH NAMES) --- */}
            {showVideoModal && videoRoomId && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            Live Consultation
                        </span>
                        {/* INSTRUCTION BANNER FOR DOCTOR */}
                        {isDoctor && (
                            <div className="hidden md:block text-xs bg-yellow-600 text-black px-2 py-1 rounded font-bold">
                                Doctor: Please "Log in" below to start the room.
                            </div>
                        )}
                        <button onClick={() => setShowVideoModal(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm font-bold">End Call</button>
                    </div>
                    
                    {/* IFRAME WITH DISPLAY NAME CONFIG */}
                    <iframe 
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        src={`https://meet.jit.si/${videoRoomId}?config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(currentUser.name)}`} 
                        className="flex-1 w-full h-full border-none"
                        title="Video Call"
                    ></iframe>
                </div>
            )}

            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img src={partner.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt={partner.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{partner.name}</h3>
                        <span className="text-xs text-gray-500 flex items-center">{isConnected ? 'Online' : 'Connecting...'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={startVideoCall} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition" title="Start Video Call"><Video className="w-5 h-5" /></button>
                    <button onClick={handleEndChat} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition" title="End Chat"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm">No messages yet. Share a report or say hi!</p></div>
                )}
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(currentUserId);
                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                {msg.attachmentUrl && renderAttachment(msg.attachmentUrl, msg.attachmentType)}
                                {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                                <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex items-center space-x-3">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading || !isConnected} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition disabled:opacity-50" title="Attach Medical Report">
                    {isUploading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <Paperclip className="w-5 h-5" />}
                </button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isUploading ? "Uploading..." : "Type your message..."} className="flex-grow px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all outline-none" disabled={!isConnected || isUploading} />
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95 shadow-lg shadow-indigo-200" disabled={!isConnected || (input.trim() === '' && !isUploading)}><Send className="w-5 h-5" /></button>
            </form>
        </div>
    );
};

export default ChatWindow;