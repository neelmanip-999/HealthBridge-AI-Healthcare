import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Stethoscope, LogOut, Briefcase, Calendar as CalendarIcon, Clock, 
    User, Bell, FileText, CheckCircle, X, 
    Users, DollarSign, ChevronRight, ChevronLeft, MapPin, Edit3, Save, Loader2,
    Trash2, Star, Brain, BarChart2, Printer, LayoutGrid, List, StickyNote, RefreshCw, MessageSquare, Download
} from 'lucide-react';
import api, { getDoctorAppointments } from '../services/api'; 
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    
    // Data State
    const [appointments, setAppointments] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const [notification, setNotification] = useState(null);
    
    // Dashboard Logic State
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [activeTab, setActiveTab] = useState('upcoming'); 
    const [selectedDate, setSelectedDate] = useState(null); 
    const [currentMonth, setCurrentMonth] = useState(new Date()); 
    const [patientNotes, setPatientNotes] = useState(() => JSON.parse(localStorage.getItem('doc_patient_notes')) || {});

    // Modals State
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    // AI & Form Data
    const [aiSummary, setAiSummary] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [consultationData, setConsultationData] = useState({ diagnosis: '', prescription: '' });
    const [profileData, setProfileData] = useState({ ...doctor });
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchAppointments();
        
        const handleNotification = (data) => {
            setNotification(data.message); 
            fetchAppointments(); 
            setTimeout(() => setNotification(null), 5000);
        };

        if (socket && doctor._id) {
            socket.emit('join_room', doctor._id);
            socket.on('appointment_notification', handleNotification);
        }

        return () => { 
            if (socket) socket.off('appointment_notification', handleNotification); 
        };
    }, [socket, doctor._id]);

    const fetchAppointments = async () => {
        try {
            const res = await getDoctorAppointments();
            setAppointments(res.data);
        } catch (err) { console.error("Failed to load appointments", err); }
    };

    // --- STATS & ANALYTICS ---
    const stats = useMemo(() => {
        const completed = appointments.filter(a => a.status === 'completed');
        const uniquePatients = new Set(completed.map(a => a.patientId?._id)).size;
        const totalEarnings = completed.reduce((sum, appt) => sum + (appt.price || parseInt(doctor.fees) || 0), 0);
        
        return { 
            earnings: totalEarnings, 
            patients: uniquePatients, 
            rating: doctor.averageRating || 4.8, // Fallback for demo 
            reviews: doctor.totalRatings || 12, 
            completedCount: completed.length, 
            pendingCount: appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length, 
            chart: [40, 60, 45, 80, 55, 90] 
        };
    }, [appointments, doctor]);

    // --- FILTERING ---
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;
        if (activeTab === 'upcoming') filtered = filtered.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
        else filtered = filtered.filter(a => a.status === 'completed' || a.status === 'cancelled');
        
        if (selectedDate) {
            filtered = filtered.filter(a => new Date(a.date).toDateString() === selectedDate.toDateString());
        }
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [appointments, activeTab, selectedDate]);

    // --- CALENDAR LOGIC (Pro Version) ---
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

    const hasAppointmentOnDate = (date) => date && appointments.some(a => new Date(a.date).toDateString() === date.toDateString());

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
        if (socket) socket.emit('start_session', { patientId: appointment.patientId._id, doctorId: doctor._id, doctorName: doctor.name });
        setChatSession({ partner: appointment.patientId, sessionId: `${appointment.patientId._id}-${doctor._id}`, appointment: appointment });
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        alert(`Rescheduled to ${rescheduleData.date} at ${rescheduleData.time} (Demo Only)`);
        setShowRescheduleModal(false);
    };

    const handleSaveNote = (patientId, note) => {
        const newNotes = { ...patientNotes, [patientId]: note };
        setPatientNotes(newNotes);
        localStorage.setItem('doc_patient_notes', JSON.stringify(newNotes));
    };

    const handlePrintSchedule = () => window.print();

    // 1. FEATURE: AI Summary
    const handleGenerateDoctorSummary = async (appt) => {
        setSelectedAppointment(appt);
        setShowAIModal(true);
        setAiLoading(true);
        setAiSummary("");
        try {
            const token = localStorage.getItem('token');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;
            const validDoctorId = doctor._id || doctor.id; 
            const validPatientId = appt.patientId._id || appt.patientId.id;

            const res = await axios.post(`${apiBaseURL}/ai/summarize`, {
                patientId: validPatientId,
                doctorId: validDoctorId,
                context: "doctor_view"
            }, { headers: { 'auth-token': token } });

            setAiSummary(res.data.success ? res.data.summary : "Could not generate summary.");
        } catch (err) { setAiSummary("AI Service Unavailable."); } 
        finally { setAiLoading(false); }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;
            await axios.post(`${apiBaseURL}/appointments/complete`, { appointmentId: selectedAppointment._id, ...consultationData }, { headers: { 'auth-token': token } });
            setAppointments(prev => prev.map(a => a._id === selectedAppointment._id ? { ...a, status: 'completed', diagnosis: consultationData.diagnosis, prescription: consultationData.prescription } : a));
            setShowCompleteModal(false);
        } catch (err) { alert("Failed to save."); }
    };

    const handleLogout = () => {
        handleUpdateStatus('offline');
        localStorage.clear();
        if (socket) socket.disconnect();
        navigate('/');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setDoctor(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));
        setShowProfileModal(false);
    };

    const handleCancel = async (id) => {
         if (!window.confirm("Cancel this appointment?")) return;
         try {
             await api.delete(`/appointments/${id}`);
             setAppointments(prev => prev.filter(a => a._id !== id));
         } catch(err) { alert("Failed to cancel"); }
    };

    // 4. FEATURE: Download Prescription (Mock)
    const handleDownloadPrescription = () => {
        alert("Downloading Prescription PDF... (Demo Feature)");
    };

    return (
        // KEY FIX: h-screen overflow-hidden prevents body scroll
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans text-gray-900">
            
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-200"><Stethoscope className="w-5 h-5" /></div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">Dr. {doctor.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {isConnected ? 'System Online' : 'Reconnecting...'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {notification && <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold animate-bounce shadow-lg flex items-center gap-2"><Bell className="w-3 h-3"/>{notification}</div>}
                    <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold">
                        <button onClick={() => handleUpdateStatus('free')} className={`px-4 py-1.5 rounded-lg transition-all ${doctor.status === 'free' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Online</button>
                        <button onClick={() => handleUpdateStatus('busy')} className={`px-4 py-1.5 rounded-lg transition-all ${doctor.status === 'busy' ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Busy</button>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"><LogOut className="w-5 h-5" /></button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                
                {/* SIDEBAR (Profile + Cal) */}
                <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col p-6 gap-6 overflow-y-auto shrink-0">
                    {/* Profile Card */}
                    <div className="bg-linear-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group shrink-0">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setProfileData(doctor); setShowProfileModal(true); }} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm"><Edit3 className="w-3 h-3 text-white" /></button>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30 shadow-inner">{doctor.name?.[0]}</div>
                            <div><h3 className="font-bold text-base">Dr. {doctor.name}</h3><p className="text-indigo-100 text-xs font-medium">{doctor.specialization}</p></div>
                        </div>
                        <div className="flex gap-2 text-xs bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400"/> <span className="font-bold">{stats.rating}</span></div>
                            <div className="w-px bg-white/20"></div>
                            <div className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-300"/> <span>{stats.patients} Patients</span></div>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="shrink-0">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider"><BarChart2 className="w-3 h-3"/> Performance</h4>
                        <div className="bg-white border border-gray-100 rounded-xl p-3 h-24 flex items-end justify-between gap-1 shadow-sm">
                            {stats.chart.map((val, i) => (
                                <div key={i} className="w-full bg-indigo-50 rounded-t-sm relative group hover:bg-indigo-500 transition-all duration-300 cursor-pointer" style={{ height: `${val}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* "PRO" CALENDAR WIDGET */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 text-sm">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded-lg transition"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded-lg transition"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[10px] gap-y-2 font-bold text-gray-400 mb-2 uppercase tracking-wide">
                            {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 text-center gap-1">
                            {calendarGrid.map((date, i) => {
                                const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                const hasEvents = hasAppointmentOnDate(date);
                                
                                return date ? (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDate(date.toDateString() === selectedDate?.toDateString() ? null : date)}
                                        className={`
                                            h-8 w-8 rounded-lg flex flex-col items-center justify-center text-xs relative transition-all duration-200
                                            ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : isToday ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'hover:bg-gray-100 text-gray-600'}
                                        `}
                                    >
                                        {date.getDate()}
                                        {hasEvents && !isSelected && (
                                            <span className="w-1 h-1 bg-red-500 rounded-full absolute bottom-1.5"></span>
                                        )}
                                    </button>
                                ) : <span key={i}></span>;
                            })}
                        </div>
                        {selectedDate && (
                            <button onClick={() => setSelectedDate(null)} className="mt-3 text-xs w-full py-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 font-bold">Clear Date Filter</button>
                        )}
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 bg-gray-50 p-6 overflow-hidden flex flex-col h-full relative">
                    {chatSession ? (
                        // KEY FIX: Chat Container Height constrained to parent (h-full)
                        <div className="flex-1 flex gap-6 h-full overflow-hidden">
                            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
                                {/* Chat Header */}
                                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">{chatSession.partner.name[0]}</div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm">{chatSession.partner.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                <span className="text-xs text-gray-500">Live Consultation</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setChatSession(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition"><X className="w-5 h-5"/></button>
                                </div>
                                
                                {/* Chat Window - Takes remaining height */}
                                <div className="flex-1 relative overflow-hidden bg-gray-50">
                                    <ChatWindow partner={chatSession.partner} onEndChat={() => setChatSession(null)} userRole="doctor" />
                                </div>
                            </div>
                            
                            {/* Right Panel: Patient Notes */}
                            <div className="w-80 hidden xl:flex flex-col gap-4 overflow-hidden">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                                    <h4 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2"><User className="w-4 h-4 text-indigo-500"/> Patient Details</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500">Patient ID</span><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">#{chatSession.partner._id.slice(-6)}</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800">{chatSession.partner.email}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Active</span></div>
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-5 rounded-2xl shadow-sm border border-yellow-200 flex-1 flex flex-col">
                                    <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider"><StickyNote className="w-4 h-4"/> Doctor's Notes</h4>
                                    <textarea 
                                        className="flex-1 bg-transparent resize-none outline-none text-sm text-yellow-900 placeholder-yellow-500/50 leading-relaxed font-medium"
                                        placeholder="Type quick notes here (e.g. allergies, symptoms)..."
                                        value={patientNotes[chatSession.partner._id] || ''}
                                        onChange={(e) => handleSaveNote(chatSession.partner._id, e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Dashboard Controls */}
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 shrink-0 gap-4">
                                <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm">
                                    <button onClick={() => setActiveTab('upcoming')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        Upcoming <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>{stats.pendingCount}</span>
                                    </button>
                                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        History
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition ${viewMode === 'list' ? 'bg-white shadow border border-gray-200 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}><List className="w-5 h-5"/></button>
                                    <button onClick={() => setViewMode('calendar')} className={`p-2.5 rounded-xl transition ${viewMode === 'calendar' ? 'bg-white shadow border border-gray-200 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}><LayoutGrid className="w-5 h-5"/></button>
                                    <button onClick={handlePrintSchedule} className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl shadow-sm hover:shadow transition" title="Print Schedule"><Printer className="w-5 h-5"/></button>
                                </div>
                            </div>

                            {/* MAIN APPOINTMENT LIST */}
                            <div className="flex-1 overflow-y-auto pb-20 pr-2 custom-scrollbar">
                                {viewMode === 'list' ? (
                                    <div className="space-y-4">
                                        {filteredAppointments.length === 0 ? (
                                            <div className="text-center py-32 flex flex-col items-center">
                                                <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100"><CalendarIcon className="w-10 h-10 text-gray-300" /></div>
                                                <h3 className="text-gray-900 font-bold text-lg mb-1">No Appointments Found</h3>
                                                <p className="text-gray-500 text-sm">Your schedule is clear for {activeTab}.</p>
                                            </div>
                                        ) : (
                                            filteredAppointments.map(apt => (
                                                <div key={apt._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all group animate-in slide-in-from-bottom-2 duration-500 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
                                                    
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-4">
                                                        
                                                        {/* Patient Info */}
                                                        <div className="flex items-center gap-6">
                                                            <div className="bg-gray-50 px-5 py-3 rounded-2xl text-center min-w-[80px] border border-gray-100">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</p>
                                                                <p className="text-3xl font-black text-gray-800 leading-none mt-1">{new Date(apt.date).getDate()}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl border-4 border-white shadow-sm">{apt.patientId.name[0]}</div>
                                                                    {/* 5. FEATURE: Smart Badge */}
                                                                    {appointments.filter(a => a.patientId._id === apt.patientId._id).length > 1 && (
                                                                        <span className="absolute -bottom-2 -right-2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white">RETURN</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-gray-900 text-lg">{apt.patientId.name}</h3>
                                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400"/> {apt.timeSlot}</span>
                                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                                        <span className={`${apt.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{apt.paymentStatus.toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                            {apt.status === 'completed' ? (
                                                                <>
                                                                    {/* 2. FEATURE: Edit Prescription (If <24h) */}
                                                                    <button onClick={() => { setSelectedAppointment(apt); setConsultationData({diagnosis: apt.diagnosis, prescription: apt.prescription}); setShowCompleteModal(true); }} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="Edit Prescription"><Edit3 className="w-5 h-5"/></button>
                                                                    {/* 3. FEATURE: Download PDF */}
                                                                    <button onClick={handleDownloadPrescription} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="Download Report"><Download className="w-5 h-5"/></button>
                                                                    {/* 1. FEATURE: AI Summary */}
                                                                    <button onClick={() => handleGenerateDoctorSummary(apt)} className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition" title="AI Summary"><Brain className="w-5 h-5" /></button>
                                                                    <div className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Completed</div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => { setSelectedAppointment(apt); setShowRescheduleModal(true); }} className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition" title="Reschedule"><RefreshCw className="w-5 h-5"/></button>
                                                                    <button onClick={() => handleCancel(apt._id)} className="p-2.5 text-red-400 bg-red-50 hover:bg-red-100 rounded-xl transition" title="Cancel"><Trash2 className="w-5 h-5"/></button>
                                                                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                                                                    <button onClick={() => handleStartChat(apt)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2 transition-transform active:scale-95"><MessageSquare className="w-4 h-4"/> Chat</button>
                                                                    <button onClick={() => { setSelectedAppointment(apt); setConsultationData({diagnosis: '', prescription: ''}); setShowCompleteModal(true); }} className="px-6 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors">Mark Done</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* COMPLETED DETAILS SECTION */}
                                                    {apt.status === 'completed' && (
                                                        <div className="mt-6 pt-6 border-t border-gray-100 grid md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Diagnosis</p>
                                                                <p className="text-gray-800 font-medium text-sm">{apt.diagnosis || "No diagnosis recorded"}</p>
                                                            </div>
                                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Prescription</p>
                                                                <p className="text-gray-800 font-mono text-sm line-clamp-2">{apt.prescription || "No prescription"}</p>
                                                            </div>
                                                            {/* 6. FEATURE: PATIENT REVIEW (Mocked or Real) */}
                                                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Patient Feedback</p>
                                                                    <div className="flex text-yellow-400">
                                                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current"/>)}
                                                                    </div>
                                                                </div>
                                                                <p className="text-yellow-800 text-sm italic">"Dr. {doctor.name.split(' ')[0]} was very helpful and kind!"</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    // --- CALENDAR GRID VIEW ---
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
                                        <div className="grid grid-cols-7 gap-4 h-full">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center font-bold text-gray-300 pb-4 border-b tracking-wider text-sm">{d}</div>)}
                                            {calendarGrid.map((date, i) => (
                                                <div key={i} className={`border border-gray-50 rounded-2xl p-3 transition-all duration-200 flex flex-col gap-2 ${date ? 'hover:bg-gray-50 hover:shadow-inner' : ''}`}>
                                                    {date && (
                                                        <>
                                                            <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${date.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>{date.getDate()}</div>
                                                            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                                                {appointments.filter(a => new Date(a.date).toDateString() === date.toDateString()).map(appt => (
                                                                    <div key={appt._id} className={`text-[10px] px-2 py-1.5 rounded-lg font-medium truncate cursor-pointer transition-transform hover:scale-105 ${appt.status === 'completed' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                        {appt.timeSlot} • {appt.patientId.name.split(' ')[0]}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* MODALS (Complete, Profile, AI, Reschedule) */}
            {/* Same logic as before, just kept clean at bottom */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Reschedule Appointment</h3>
                        <p className="text-sm text-gray-500 mb-4">Select a new date and time for {selectedAppointment?.patientId.name}.</p>
                        <form onSubmit={handleReschedule} className="space-y-4">
                            <input type="date" required className="w-full p-3 bg-gray-50 border rounded-xl" onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} />
                            <input type="time" required className="w-full p-3 bg-gray-50 border rounded-xl" onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} />
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-indigo-600"/> Finalize Consultation</h2><button onClick={() => setShowCompleteModal(false)}><X className="w-5 h-5 text-gray-500"/></button></div>
                        <form onSubmit={handleComplete} className="space-y-5">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Diagnosis</label><input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={consultationData.diagnosis} onChange={e => setConsultationData({...consultationData, diagnosis: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Prescription</label><textarea required rows="4" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={consultationData.prescription} onChange={e => setConsultationData({...consultationData, prescription: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Save & Complete</button>
                        </form>
                    </div>
                </div>
            )}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 shrink-0"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Brain className="text-purple-600 w-5 h-5"/> Patient Case Summary</h2><button onClick={() => setShowAIModal(false)}><X className="w-5 h-5 text-gray-500"/></button></div>
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-700 custom-scrollbar">
                            {aiLoading ? <div className="flex flex-col items-center justify-center h-40"><Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2"/><p className="text-gray-400">Analyzing chat logs...</p></div> : <div className="whitespace-pre-wrap">{aiSummary}</div>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end shrink-0"><button onClick={() => setShowAIModal(false)} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm">Close</button></div>
                    </div>
                </div>
            )}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User className="text-indigo-600"/> Edit Profile</h2><button onClick={() => setShowProfileModal(false)}><X className="w-5 h-5 text-gray-500"/></button></div>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-1">Specialization</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.specialization} onChange={e => setProfileData({...profileData, specialization: e.target.value})} /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Experience (Yrs)</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} /></div></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Clinic Address (Location)</label><input type="text" className="w-full p-3 border rounded-lg" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Consultation Fees ($)</label><input type="number" className="w-full p-3 border rounded-lg" value={profileData.fees} onChange={e => setProfileData({...profileData, fees: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Profile</button>
                        </form>
                    </div>
                </div>
            )}   
        </div>
    );
};

export default DoctorDashboard;