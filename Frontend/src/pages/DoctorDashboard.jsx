import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Stethoscope, LogOut, MessageSquare, Briefcase, Calendar, Clock, 
    User, Bell, FileText, CheckCircle, Activity, X, TrendingUp, 
    Users, DollarSign, ChevronRight, ChevronLeft, MapPin, Edit3, Save, Loader2, 
    Download, Trash2 // <--- Added Trash2 Icon
} from 'lucide-react';
import api, { getDoctorAppointments } from '../services/api'; 
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
// import { generateChatPDF } from '../utils/chatPdfGenerator'; 

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    
    // Data State
    const [appointments, setAppointments] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const [notification, setNotification] = useState(null);
    
    // Dashboard Logic State
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
    const [selectedDate, setSelectedDate] = useState(null); // Filter by calendar date
    const [currentMonth, setCurrentMonth] = useState(new Date()); // For calendar navigation

    // Modals State
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    // Form Data
    const [consultationData, setConsultationData] = useState({ diagnosis: '', prescription: '' });
    const [profileData, setProfileData] = useState({ ...doctor });

    // --- 1. INITIAL FETCH & SOCKETS ---
    useEffect(() => {
        fetchAppointments();
        if (socket && doctor._id) {
            socket.emit('join_room', doctor._id);
            socket.on('appointment_notification', (data) => {
                setNotification(data.message); 
                fetchAppointments(); 
                setTimeout(() => setNotification(null), 5000);
            });
        }
        return () => { if (socket) socket.off('appointment_notification'); };
    }, [socket, doctor._id]);

    const fetchAppointments = async () => {
        try {
            const res = await getDoctorAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to load appointments", err);
        }
    };

    // --- 2. STATISTICS ENGINE 📊 ---
    const stats = useMemo(() => {
        const completed = appointments.filter(a => a.status === 'completed');
        const uniquePatients = new Set(completed.map(a => a.patientId?._id)).size;
        const totalEarnings = completed.reduce((sum, appt) => {
            const fee = appt.price || parseInt(doctor.fees) || 0; 
            return sum + fee;
        }, 0);
        
        return {
            earnings: totalEarnings,
            patients: uniquePatients,
            completedCount: completed.length,
            pendingCount: appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length
        };
    }, [appointments, doctor.fees]);

    // --- 3. FILTERING LOGIC ---
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
        } else {
            filtered = filtered.filter(a => a.status === 'completed' || a.status === 'cancelled');
        }
        if (selectedDate) {
            filtered = filtered.filter(a => {
                const apptDate = new Date(a.date).toDateString();
                const filterDate = selectedDate.toDateString();
                return apptDate === filterDate;
            });
        }
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [appointments, activeTab, selectedDate]);

    const upNext = appointments
        .filter(a => a.status !== 'completed' && a.status !== 'cancelled' && new Date(a.date) >= new Date().setHours(0,0,0,0))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    // --- 4. CALENDAR GENERATOR 📅 ---
    const calendarGrid = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const grid = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(new Date(year, month, i));
        return grid;
    }, [currentMonth]);

    const hasAppointmentOnDate = (date) => {
        if (!date) return false;
        return appointments.some(a => new Date(a.date).toDateString() === date.toDateString());
    };

    // --- HANDLERS ---
    const handleUpdateStatus = async (newStatus) => {
        try {
            const res = await api.put('/doctor/status', { status: newStatus });
            const updatedDoctor = { ...doctor, status: res.data.status };
            setDoctor(updatedDoctor);
            localStorage.setItem('user', JSON.stringify(updatedDoctor));
            if (socket) socket.emit('doctorStatusUpdate', { id: doctor._id, status: newStatus });
        } catch (err) { alert('Status update failed'); }
    };

    const handleStartChat = (appointment) => {
        if (socket) {
            socket.emit('start_session', {
                patientId: appointment.patientId._id,
                doctorId: doctor._id,
                doctorName: doctor.name
            });
        }
        setChatSession({ 
            partner: appointment.patientId, 
            sessionId: `${appointment.patientId._id}-${doctor._id}` 
        });
    };

    // --- NEW: Download PDF Handler ---
    const handleDownloadChat = async (apt) => {
        try {
            const res = await api.get(`/chat/history/${doctor._id}/${apt.patientId._id}`);
            const messages = res.data;
            if (!messages || messages.length === 0) {
                alert("No chat conversation found.");
                return;
            }
            generateChatPDF(messages, doctor.name, apt.patientId.name, apt.date);
        } catch (err) {
            console.error("Error downloading chat:", err);
            alert("Failed to download chat transcript.");
        }
    };

    // --- NEW: Cancel Appointment Handler ---
    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment? This cannot be undone.")) return;
        try {
            await api.delete(`/appointments/${id}`);
            setAppointments(prev => prev.filter(a => a._id !== id));
            alert("Appointment cancelled successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to cancel appointment.");
        }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/appointments/complete', {
                appointmentId: selectedAppointment._id,
                ...consultationData
            }, { headers: { 'auth-token': token } });
            
            setAppointments(prev => prev.map(a => 
                a._id === selectedAppointment._id ? { ...a, status: 'completed' } : a
            ));
            
            setShowCompleteModal(false);
            alert('Consultation Completed! Earnings updated.');
        } catch (err) { alert("Failed to save."); }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setDoctor(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
            setShowProfileModal(false);
            alert("Profile Updated Successfully!");
        } catch (err) {
            alert("Failed to update profile.");
        }
    };

    const handleLogout = () => {
        handleUpdateStatus('offline');
        localStorage.clear();
        if (socket) socket.disconnect();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white"><Stethoscope className="w-6 h-6" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dr. {doctor.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {isConnected ? 'System Online' : 'Reconnecting...'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {notification && <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm animate-bounce"><Bell className="w-4 h-4 inline mr-2"/>{notification}</div>}
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                        <button onClick={() => handleUpdateStatus('free')} className={`px-3 py-1.5 rounded-md transition ${doctor.status === 'free' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Online</button>
                        <button onClick={() => handleUpdateStatus('busy')} className={`px-3 py-1.5 rounded-md transition ${doctor.status === 'busy' ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500'}`}>Busy</button>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                
                {/* SIDEBAR */}
                <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col overflow-y-auto p-6 gap-8">
                    {/* Profile Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setProfileData(doctor); setShowProfileModal(true); }} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm"><Edit3 className="w-4 h-4 text-white" /></button>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">{doctor.name?.[0]}</div>
                            <div><h3 className="font-bold text-lg leading-tight">Dr. {doctor.name}</h3><p className="text-indigo-100 text-sm">{doctor.specialization}</p></div>
                        </div>
                        <div className="space-y-2 text-sm text-indigo-100">
                            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 opacity-70"/> {doctor.experience || '5+ Years'} Exp.</div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-70"/> {doctor.address || 'Main Clinic, NY'}</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100"><p className="text-xs text-green-600 font-medium mb-1">Total Earnings</p><p className="text-xl font-bold text-green-800 flex items-center"><DollarSign className="w-4 h-4"/>{stats.earnings}</p></div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><p className="text-xs text-blue-600 font-medium mb-1">Total Patients</p><p className="text-xl font-bold text-blue-800 flex items-center"><Users className="w-4 h-4 mr-1"/>{stats.patients}</p></div>
                    </div>

                    {/* Calendar */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4"/></button>
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-xs gap-y-2">
                            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-gray-400 font-bold">{d}</span>)}
                            {calendarGrid.map((date, i) => (
                                date ? (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDate(date.toDateString() === selectedDate?.toDateString() ? null : date)}
                                        className={`h-8 w-8 rounded-full flex flex-col items-center justify-center transition relative ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                                    >
                                        <span>{date.getDate()}</span>
                                        {hasAppointmentOnDate(date) && <span className={`w-1 h-1 rounded-full absolute bottom-1 ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-white' : 'bg-red-500'}`}></span>}
                                    </button>
                                ) : <span key={i}></span>
                            ))}
                        </div>
                        {selectedDate && <button onClick={() => setSelectedDate(null)} className="mt-3 text-xs text-indigo-600 font-medium hover:underline w-full text-center">Clear Filter</button>}
                    </div>
                </aside>

                {/* MAIN AREA */}
                <main className="flex-1 bg-gray-50 p-4 md:p-8 overflow-y-auto">
                    {chatSession ? (
                        <div className="h-full max-w-4xl mx-auto">
                            <ChatWindow partner={chatSession.partner} onEndChat={() => setChatSession(null)} userRole="doctor" />
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex gap-6 border-b border-gray-200 mb-6">
                                <button onClick={() => setActiveTab('upcoming')} className={`pb-3 font-semibold text-sm transition ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Upcoming Appointments <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-1">{stats.pendingCount}</span>
                                </button>
                                <button onClick={() => setActiveTab('history')} className={`pb-3 font-semibold text-sm transition ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Consultation History
                                </button>
                            </div>

                            <div className="space-y-4">
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-gray-400" /></div>
                                        <p className="text-gray-500 font-medium">No appointments found for this filter.</p>
                                    </div>
                                ) : (
                                    filteredAppointments.map(apt => (
                                        <div key={apt._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                                            <div className="flex items-center gap-5 w-full md:w-auto">
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</p>
                                                    <p className="text-2xl font-bold text-gray-800">{new Date(apt.date).getDate()}</p>
                                                </div>
                                                <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">{apt.patientId.name[0]}</div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg">{apt.patientId.name}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.timeSlot}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${apt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{apt.paymentStatus}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                {apt.status === 'completed' ? (
                                                    <div className="flex gap-2">
                                                        <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold border border-gray-100"><CheckCircle className="w-4 h-4 text-green-500" /> Completed</span>
                                                        {/* ARCHIVE BUTTON */}
                                                        <button 
                                                            onClick={() => handleDownloadChat(apt)}
                                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition shadow-sm border border-indigo-100"
                                                            title="Download Chat Archive"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleStartChat(apt)} className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-100">Chat Now</button>
                                                        
                                                        <button onClick={() => { setSelectedAppointment(apt); setConsultationData({diagnosis: '', prescription: ''}); setShowCompleteModal(true); }} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">Mark Complete</button>
                                                        
                                                        {/* --- CANCEL BUTTON --- */}
                                                        <button 
                                                            onClick={() => handleCancel(apt._id)} 
                                                            className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition border border-transparent hover:border-red-200"
                                                            title="Cancel Appointment"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* COMPLETION MODAL */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-indigo-600"/> Finalize Consultation</h2>
                            <button onClick={() => setShowCompleteModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleComplete} className="space-y-5">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Diagnosis</label><input type="text" required placeholder="e.g. Viral Fever" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={consultationData.diagnosis} onChange={e => setConsultationData({...consultationData, diagnosis: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Prescription</label><textarea required rows="4" placeholder="Treatment details..." className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={consultationData.prescription} onChange={e => setConsultationData({...consultationData, prescription: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Save & Complete</button>
                        </form>
                    </div>
                </div>
            )}

            {/* PROFILE MODAL */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User className="text-indigo-600"/> Edit Profile</h2>
                            <button onClick={() => setShowProfileModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Specialization</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.specialization} onChange={e => setProfileData({...profileData, specialization: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Experience (Yrs)</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} /></div>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Clinic Address (Location)</label><input type="text" placeholder="e.g. 123 Health St, New York" className="w-full p-3 border rounded-lg" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Consultation Fees ($)</label><input type="number" className="w-full p-3 border rounded-lg" value={profileData.fees} onChange={e => setProfileData({...profileData, fees: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Profile</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;