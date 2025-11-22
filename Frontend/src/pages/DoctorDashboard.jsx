import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, MessageSquare, Briefcase } from 'lucide-react';
import api from '../services/api';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext'; // <-- 1. Import the hook

const DoctorDashboard = () => {
    const navigate = useNavigate();
    // --- THE FIX IS HERE ---
    const { socket, isConnected } = useSocket(); // <-- 2. Destructure to get the actual socket instance
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [statusError, setStatusError] = useState('');
    const [chatSession, setChatSession] = useState(null);

    const statusColors = {
        online: 'bg-indigo-500 text-white',
        offline: 'bg-gray-500 text-white',
        free: 'bg-green-500 text-white',
        busy: 'bg-yellow-500 text-gray-800',
    };

    // Effect to listen for incoming chats on the shared socket
    useEffect(() => {
        // The guard `if (!socket)` prevents errors if the connection isn't ready
        if (!socket) return;

        const handleConsultationStarted = (data) => {
            console.log("DoctorDashboard received consultationStarted:", data);
            // Use _id consistently
            setChatSession({ partner: data.patient, sessionId: data.sessionId });
        };

        socket.on('consultationStarted', handleConsultationStarted);

        // Cleanup listener when the component unmounts
        return () => {
            socket.off('consultationStarted', handleConsultationStarted);
        };
    }, [socket]); // The only dependency is the shared socket instance

    const handleUpdateStatus = async (newStatus) => {
        if (!socket) {
            setStatusError("Socket not connected. Cannot update status.");
            return;
        }
        setStatusError('');
        try {
            const res = await api.put('/doctor/status', { status: newStatus });
            const updatedDoctor = { ...doctor, status: res.data.status };
            setDoctor(updatedDoctor);
            localStorage.setItem('user', JSON.stringify(updatedDoctor));
            // Use _id consistently
            socket.emit('doctorStatusUpdate', { id: doctor._id, status: newStatus });
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleEndChat = () => {
        setChatSession(null);
        handleUpdateStatus('free');
    };

    const handleLogout = () => {
        handleUpdateStatus('offline');
        localStorage.clear(); // Clear all localStorage on logout
        if (socket) socket.disconnect();
        navigate('/');
    };
    
    const StatusPill = ({ status }) => (
        <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full capitalize ${statusColors[status]}`}>
            {status}
        </span>
    );

    // --- Your beautiful JSX is preserved ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 md:p-10 relative overflow-hidden">
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
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
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
                                Set Free
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus('busy')} 
                                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    doctor?.status === 'busy' 
                                        ? 'bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-300' 
                                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
                                }`}
                            >
                                Set Busy
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus('offline')} 
                                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    doctor?.status === 'offline' 
                                        ? 'bg-gray-600 text-white shadow-lg ring-2 ring-gray-300' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                            >
                               Set Offline
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-0 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col h-[75vh] hover-lift animate-slideInRight" style={{ animationDelay: '0.2s' }}>
                    {chatSession ? (
                        <ChatWindow 
                            partner={chatSession.partner}
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

