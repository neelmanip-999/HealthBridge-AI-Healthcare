import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    HeartPulse, 
    Stethoscope, 
    Pill, 
    Brain,
    Calendar,
    Clock,
    Video,
    Trash2,
    LogOut
} from "lucide-react"; 
import { getPatientAppointments, cancelAppointment } from '../services/api';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const patient = JSON.parse(localStorage.getItem('user'));
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await getPatientAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await cancelAppointment(id);
                setAppointments(appointments.filter(apt => apt._id !== id));
            } catch (err) {
                alert("Failed to cancel appointment.");
            }
        }
    };

    const handleJoinChat = (appointment) => {
        navigate(`/patient/chat/${appointment.doctorId._id}`, { 
            state: { doctorData: appointment.doctorId } 
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const DashboardCard = ({ title, icon: Icon, colorClass, link, description }) => {
        const colorMap = {
            'border-indigo-500': 'indigo',
            'border-red-500': 'red',
            'border-yellow-500': 'yellow',
            'border-purple-500': 'purple'
        };
        const color = colorMap[colorClass] || 'indigo';
        
        return (
            <div 
                className={`group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-l-4 ${colorClass} transition-all duration-500 hover:shadow-3xl cursor-pointer hover-lift card-hover animate-slideInRight`}
                onClick={() => navigate(link)}
            >
                <div className="flex items-center space-x-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-${color}-100 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-8 w-8 text-${color}-600`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{title}</h3>
                        <p className="text-gray-500 mt-2 group-hover:text-gray-600 transition-colors duration-300">{description}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-3xl mb-10 border-t-4 border-green-600 relative z-10 animate-fadeInUp">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl">
                        <HeartPulse className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 gradient-text">Patient Dashboard</h1>
                        <p className="text-gray-500 mt-1">Your Health & Wellness Center</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">Hello, {patient?.name || 'Patient'}!</span>
                    </div>
                    <button onClick={handleLogout} className="btn-danger btn-ripple flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div style={{ animationDelay: '0.1s' }}>
                        {/* FIX: Link is now /patient/doctors to match App.jsx */}
                        <DashboardCard title="Find a Doctor" description="View specialists, their status, and availability." icon={Stethoscope} colorClass="border-indigo-500" link="/patient/doctors" />
                    </div>
                    <div style={{ animationDelay: '0.2s' }}>
                        <DashboardCard title="Medical History" description="Review and update your past records." icon={HeartPulse} colorClass="border-red-500" link="/patient/history" />
                    </div>
                    <div style={{ animationDelay: '0.3s' }}>
                        <DashboardCard title="Pharmacy Catalog" description="Browse available medicines and prices." icon={Pill} colorClass="border-yellow-500" link="/patient/pharmacy" />
                    </div>
                    <div style={{ animationDelay: '0.4s' }}>
                        <DashboardCard title="AI Health Assistant" description="Get instant health answers and find nearby facilities." icon={Brain} colorClass="border-purple-500" link="/patient/ai-assistant" />
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-green-100 hover-lift animate-slideInRight" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                            <Stethoscope className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">Your Consultations</h2>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading appointments...</div>
                    ) : appointments.length === 0 ? (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border-2 border-dashed border-indigo-200 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
                                <Stethoscope className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">No Active Consultations</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Start a new consultation by finding a doctor and booking an appointment.
                            </p>
                            {/* FIX: Button link updated here as well */}
                            <button 
                                onClick={() => navigate('/patient/doctors')}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
                            >
                                Find a Doctor
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((apt) => (
                                <div key={apt._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <img 
                                            src={apt.doctorId.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} 
                                            alt="Doctor" 
                                            className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover"
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Dr. {apt.doctorId.name}</h3>
                                            <p className="text-indigo-600 font-medium">{apt.doctorId.specialization}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> {formatDate(apt.date)}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {apt.timeSlot}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            apt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {apt.paymentStatus}
                                        </span>

                                        <button 
                                            onClick={() => handleJoinChat(apt)}
                                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                                        >
                                            <Video className="h-5 w-5" />
                                            Join
                                        </button>

                                        <button 
                                            onClick={() => handleCancel(apt._id)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
                                            title="Cancel Appointment"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;