import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, MessageSquare, Briefcase } from 'lucide-react';
import api from '../services/api';
import ChatWindow from '../components/ChatWindow';
import io from 'socket.io-client'; // CRITICAL: Import Socket.io Client

const SOCKET_SERVER_URL = "http://localhost:5000";

// Initialize socket connection outside the component for dedicated status listening
const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false,
    transports: ['websocket']
});


const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        return storedUser || {};
    });
    const [statusError, setStatusError] = useState('');
    const [chatSession, setChatSession] = useState(null); // { partner: {id, name}, sessionId }

    // --- Status Colors ---
    const statusColors = {
        online: 'bg-indigo-500 text-white',
        offline: 'bg-gray-500 text-white',
        free: 'bg-green-500 text-white',
        busy: 'bg-yellow-500 text-gray-800',
    };

    // --- Socket.io Listeners for Incoming Patient Connection ---
    useEffect(() => {
        const doctorId = doctor?.id;
        if (!doctorId) return;

        // 1. Connect the socket and join the private room for direct events
        if (!socket.connected) {
             socket.auth = { userId: doctorId, userRole: 'doctor' };
             socket.connect();
        }

        // 2. Listener for when a patient successfully connects (event sent by server.js)
        socket.on('consultationStarted', (data) => {
            console.log("Consultation Started received:", data);
            
            // The data contains the patient's info (partner) and the shared session ID
            const { partner, sessionId } = data;
            
            // Set the chat session state to open the ChatWindow
            setChatSession({ partner, sessionId });
        });

        // 3. Listener for consultation end (in case the partner ends it)
        socket.on('consultationEnded', (data) => {
            if (chatSession && data.sessionId === chatSession.sessionId) {
                // This calls the cleanup function to reset state
                handleEndChat(); 
            }
        });
        
        // 4. Cleanup on component unmount
        return () => {
            socket.off('consultationStarted');
            socket.off('consultationEnded');
            // We keep socket connected for Doctor dashboard status updates unless fully unmounted
        };
    }, [doctor, chatSession]); 
    // The previous useEffect containing mock logic has been entirely removed/replaced by this hook.

    // --- Doctor Status Update (Calls API) ---
    const handleUpdateStatus = async (newStatus) => {
        setStatusError('');
        try {
            // API call updates DB status
            const res = await api.put('/doctor/status', { status: newStatus });
            
            const updatedDoctor = { ...doctor, status: res.data.status };
            setDoctor(updatedDoctor);
            localStorage.setItem('user', JSON.stringify(updatedDoctor));

            // CRITICAL: Emit status update via socket so Patient lists can refresh live
            socket.emit('doctorStatusUpdate', { id: doctor.id, status: newStatus });
            
            return true; 

        } catch (err) {
            setStatusError(err.response?.data?.message || 'Failed to update status.');
            return false;
        }
    };

    // --- End Chat Callback (Called by ChatWindow or Socket Listener) ---
    const handleEndChat = () => {
        setChatSession(null);
        // Doctor must manually set back to 'free' after session ends
        handleUpdateStatus('free'); 
        localStorage.removeItem('activeChatSession'); 
    };


    // --- Logout ---
    const handleLogout = () => {
        handleUpdateStatus('offline').catch(() => console.error("Failed to set offline status on logout.")); 
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeChatSession');
        navigate('/');
    };
    
    const StatusPill = ({ status }) => (
        <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full capitalize ${statusColors[status]}`}>
            {status}
        </span>
    );


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background decorative elements omitted */}

            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-3xl mb-10 border-t-4 border-indigo-600 relative z-10 animate-fadeInUp">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl">
                        <Stethoscope className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 gradient-text">Dr. {doctor?.name}'s Portal</h1>
                        <p className="text-gray-500 mt-1">Professional Healthcare Dashboard</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <StatusPill status={doctor?.status || 'offline'} />
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 btn-danger btn-ripple"
                    >
                        <LogOut className="w-4 h-4" /> 
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Profile and Status Controls */}
                <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-indigo-100 hover-lift animate-slideInRight">
                     <h2 className="text-2xl font-bold mb-6 text-indigo-600 border-b border-indigo-200 pb-4 flex items-center space-x-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-xl">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Profile Management</span>
                    </h2>
                     <div className="space-y-4 mt-6">
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100">
                            <p className="text-sm text-gray-600 mb-1">Specialization</p>
                            <p className="text-lg font-semibold text-indigo-700">{doctor?.specialization}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                            <p className="text-sm text-gray-600 mb-1">Consultation Fees</p>
                            <p className="text-2xl font-bold text-green-700">${doctor?.fees}</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                            <p className="text-sm text-gray-600 mb-1">Current Status</p>
                            <div className="flex items-center space-x-2">
                                <StatusPill status={doctor?.status || 'offline'} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Set Availability
                        </h3>
                        {statusError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4 border border-red-200">
                                {statusError}
                            </div>
                        )}
                        <div className='grid grid-cols-1 gap-3'>
                            <button 
                                onClick={() => handleUpdateStatus('free')} 
                                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    doctor?.status === 'free' 
                                        ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-300' 
                                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                }`}
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                    <span>Set Free</span>
                                </span>
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus('busy')} 
                                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    doctor?.status === 'busy' 
                                        ? 'bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-300' 
                                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
                                }`}
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                    <span>Set Busy</span>
                                </span>
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus('offline')} 
                                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    doctor?.status === 'offline' 
                                        ? 'bg-gray-600 text-white shadow-lg ring-2 ring-gray-300' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                    <span>Set Offline</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-0 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col h-[75vh] hover-lift animate-slideInRight" style={{ animationDelay: '0.2s' }}>
                    {chatSession ? (
                        <ChatWindow 
                            partner={chatSession.partner}
                            sessionId={chatSession.sessionId}
                            onEndChat={handleEndChat}
                            userRole="doctor"
                        />
                    ) : (
                        <div className='flex flex-col items-center justify-center h-full p-8'>
                            <MessageSquare className="h-16 w-16 text-indigo-400 mb-6 animate-pulse" />
                            <h2 className="text-2xl font-bold mb-3 text-gray-700">Waiting for Consultation</h2>
                            <p className="text-gray-500 text-center max-w-sm">
                                Set your status to **Free** to receive incoming patient requests. The chat will open automatically when a patient connects.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;
