import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Stethoscope, 
    LogOut, 
    MessageSquare, 
    Briefcase, 
    Calendar, 
    Clock, 
    User,
    Bell
} from 'lucide-react';
import api, { getDoctorAppointments } from '../services/api'; // Import new API function
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [appointments, setAppointments] = useState([]);
    const [statusError, setStatusError] = useState('');
    const [chatSession, setChatSession] = useState(null);
    const [notification, setNotification] = useState(null); // State for new booking alerts

    // 1. Initial Data Fetch & Socket Setup
    useEffect(() => {
        fetchAppointments();

        if (socket && doctor._id) {
            // CRITICAL: Join a specific room for this doctor so backend can target notifications
            socket.emit('join_room', doctor._id);

            // Listen for new booking notifications
            socket.on('appointment_notification', (data) => {
                setNotification(data.message); // Show alert
                fetchAppointments(); // Refresh list immediately
                
                // Hide alert after 5 seconds
                setTimeout(() => setNotification(null), 5000);
            });
        }

        return () => {
            if (socket) socket.off('appointment_notification');
        };
    }, [socket, doctor._id]);

    const fetchAppointments = async () => {
        try {
            const res = await getDoctorAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to load appointments", err);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const res = await api.put('/doctor/status', { status: newStatus });
            const updatedDoctor = { ...doctor, status: res.data.status };
            setDoctor(updatedDoctor);
            localStorage.setItem('user', JSON.stringify(updatedDoctor));
            if (socket) socket.emit('doctorStatusUpdate', { id: doctor._id, status: newStatus });
        } catch (err) {
            setStatusError('Failed to update status.');
        }
    };

    const handleStartChatFromAppointment = (appointment) => {
        // Set the chat session with the patient details from the appointment
        setChatSession({ 
            partner: appointment.patientId, 
            sessionId: `${appointment.patientId._id}-${doctor._id}` 
        });
    };

    const handleEndChat = () => {
        setChatSession(null);
        handleUpdateStatus('free');
    };

    const handleLogout = () => {
        handleUpdateStatus('offline');
        localStorage.clear();
        if (socket) socket.disconnect();
        navigate('/');
    };

    // Helper: Format Date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 md:p-10 relative overflow-hidden">
            
            {/* Notification Banner */}
            {notification && (
                <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                        <h4 className="font-bold">New Booking!</h4>
                        <p className="text-sm">{notification}</p>
                    </div>
                </div>
            )}

            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-3xl mb-10 border-t-4 border-indigo-600 relative z-10">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl">
                        <Stethoscope className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Dr. {doctor?.name}'s Portal</h1>
                        <p className="text-gray-500 mt-1">Professional Healthcare Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                        doctor.status === 'free' ? 'bg-green-100 text-green-700' : 
                        doctor.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                        {doctor.status}
                    </span>
                    <button onClick={handleLogout} className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition">
                        <LogOut className="w-4 h-4" /> 
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* --- LEFT COLUMN: PROFILE & CONTROLS --- */}
                <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-indigo-100 h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-indigo-600 border-b border-indigo-200 pb-4 flex items-center space-x-3">
                        <Briefcase className="w-5 h-5" />
                        <span>Profile Management</span>
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <p className="text-sm text-gray-600 mb-1">Specialization</p>
                            <p className="text-lg font-semibold text-indigo-700">{doctor?.specialization}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <p className="text-sm text-gray-600 mb-1">Consultation Fees</p>
                            <p className="text-2xl font-bold text-green-700">${doctor?.fees}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Set Availability</h3>
                        <div className='grid grid-cols-1 gap-3'>
                            <button onClick={() => handleUpdateStatus('free')} className="py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 font-semibold transition">Set Free (Ready)</button>
                            <button onClick={() => handleUpdateStatus('busy')} className="py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 font-semibold transition">Set Busy</button>
                            <button onClick={() => handleUpdateStatus('offline')} className="py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition">Set Offline</button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: APPOINTMENTS OR CHAT --- */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-indigo-100 flex flex-col min-h-[75vh] overflow-hidden">
                    
                    {chatSession ? (
                        // 1. ACTIVE CHAT VIEW
                        <ChatWindow 
                            partner={chatSession.partner}
                            onEndChat={handleEndChat}
                            userRole="doctor"
                        />
                    ) : (
                        // 2. APPOINTMENTS LIST VIEW
                        <div className="p-8 h-full flex flex-col">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-indigo-600" />
                                Upcoming Appointments
                            </h2>

                            {appointments.length === 0 ? (
                                <div className='flex flex-col items-center justify-center flex-1 opacity-60'>
                                    <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500">No appointments scheduled yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {appointments.map((apt) => (
                                        <div key={apt._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                                            
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                                    {apt.patientId.name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{apt.patientId.name}</h3>
                                                    <div className="flex items-center text-sm text-gray-500 gap-3 mt-1">
                                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(apt.date)}</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.timeSlot}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                    apt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {apt.paymentStatus}
                                                </span>
                                                
                                                <button 
                                                    onClick={() => handleStartChatFromAppointment(apt)}
                                                    className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-200"
                                                >
                                                    Join Consultation
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;