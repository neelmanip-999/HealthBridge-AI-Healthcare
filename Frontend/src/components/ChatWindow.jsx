import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Paperclip, Video, FileText, PhoneIncoming, PhoneOff, CheckCheck } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

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
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, [currentUserId, partner._id]);

    // 2. Listen for Incoming Messages (FIXED DUPLICATION)
    useEffect(() => {
        if (!socket || !currentUserId || !partner?._id) return;

        socket.emit('join_room', roomId); 

        const handleReceiveMessage = (message) => {
            // FIX 1: Ignore messages sent by ME (because I already added them locally)
            if (String(message.senderId) === String(currentUserId)) return;

            const participantsMatch = 
                (message.senderId === currentUserId && message.receiverId === partner._id) ||
                (message.senderId === partner._id && message.receiverId === currentUserId);

            if (participantsMatch) {
                setMessages((prev) => [...prev, message]);

                // Detect Incoming Video Call
                if (message.attachmentType === 'video_call') {
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
    }, [socket, currentUserId, partner._id, roomId]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- FILE UPLOAD ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const uploadURL = isLocalhost ? 'http://localhost:5000/api/chat/upload' : `http://${window.location.hostname}:5000/api/chat/upload`;
            
            const res = await axios.post(uploadURL, formData, {
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
            
            // Optimistic Update
            setMessages((prev) => [...prev, messageData]);
            socket.emit('sendMessage', messageData);
            await api.post('/chat/send', messageData);
        } catch (err) {
            alert("Failed to upload file.");
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    // --- VIDEO CALL ---
    const startVideoCall = () => {
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
        
        setMessages((prev) => [...prev, messageData]);
        socket.emit('sendMessage', messageData);
        api.post('/chat/send', messageData).catch(err => console.error(err));
        
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

        // 1. Add to local UI immediately
        setMessages((prev) => [...prev, messageData]);
        
        // 2. Send to Server (Server will broadcast to partner)
        socket.emit('sendMessage', messageData);
        
        // 3. Save to DB
        try {
            await api.post('/chat/send', messageData);
        } catch (err) {
            console.error('Failed to save message:', err);
        }
        
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

    const renderAttachment = (url, type) => {
        if (type === 'video_call') {
            return (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl mb-2 flex flex-col items-center text-center">
                    <div className="bg-indigo-100 p-2 rounded-full mb-2">
                        <Video className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-indigo-800 mb-2">Video Consultation Invite</p>
                    <button onClick={() => { setVideoRoomId(url); setShowVideoModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition w-full">Join Call</button>
                </div>
            );
        }
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseURL = isLocalhost ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
        
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
        // KEY FIX: 'h-full' and 'min-h-0' are crucial for nested flex scrolling
        <div className="flex flex-col h-full min-h-0 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
            
            {/* INCOMING CALL MODAL */}
            {incomingVideoCall && !showVideoModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                        <PhoneIncoming className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{incomingVideoCall.senderName}</h2>
                    <p className="text-gray-300 mb-10 text-lg">is requesting a video call...</p>
                    <div className="flex gap-8">
                        <button onClick={() => setIncomingVideoCall(null)} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110 group-hover:bg-red-600"><PhoneOff className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Decline</span></button>
                        <button onClick={acceptVideoCall} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110 group-hover:bg-green-600 animate-pulse"><Video className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Accept</span></button>
                    </div>
                </div>
            )}

            {/* VIDEO ROOM MODAL */}
            {showVideoModal && videoRoomId && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white shrink-0">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base"><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span> Live Consultation</span>
                        <button onClick={() => setShowVideoModal(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm font-bold">End Call</button>
                    </div>
                    <iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src={`https://meet.jit.si/${videoRoomId}?config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(currentUser.name)}`} className="flex-1 w-full h-full border-none" title="Video Call"></iframe>
                </div>
            )}

            {/* HEADER */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img src={partner.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt={partner.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 leading-tight">{partner.name}</h3>
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">{isConnected ? 'Online' : 'Connecting...'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={startVideoCall} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition shadow-sm"><Video className="w-5 h-5" /></button>
                    <button onClick={handleEndChat} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition shadow-sm"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* MESSAGES AREA - FIXED SCROLLING */}
            {/* min-h-0 is the magic CSS property that stops flex children from overflowing parent */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80 min-h-0 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(currentUserId);
                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                            <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-sm relative text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                {msg.attachmentUrl && renderAttachment(msg.attachmentUrl, msg.attachmentType)}
                                {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                                <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                                    {isMe && <CheckCheck className="w-3 h-3" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading || !isConnected} className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition border border-gray-200" title="Attach File">
                    {isUploading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <Paperclip className="w-5 h-5" />}
                </button>
                
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={isUploading ? "Uploading..." : "Type your message..."} 
                    className="flex-grow px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl transition-all outline-none text-sm font-medium placeholder-gray-400"
                    disabled={!isConnected || isUploading} 
                />
                
                <button type="submit" disabled={!isConnected || (input.trim() === '' && !isUploading)} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95 shadow-md shadow-indigo-200">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;