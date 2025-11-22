// HealthBridge/frontend/src/pages/PatientDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
// FIX: Changed 'Pills' to the correct icon name, 'Pill'
import { HeartPulse, Stethoscope, Pill, Brain, MapPin } from "lucide-react"; 

const PatientDashboard = () => {
    const navigate = useNavigate();
    // Assuming patient data is stored in localStorage after login
    const patient = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
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
                
                {/* Decorative elements */}
                <div className={`absolute top-4 right-4 w-20 h-20 bg-${color}-200/20 rounded-full -z-10 group-hover:scale-150 transition-transform duration-700`}></div>
                <div className={`absolute bottom-4 left-4 w-12 h-12 bg-${color}-300/20 rounded-full -z-10 group-hover:scale-125 transition-transform duration-500`}></div>
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
                    <button 
                        onClick={handleLogout}
                        className="btn-danger btn-ripple"
                    >
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div style={{ animationDelay: '0.1s' }}>
                        <DashboardCard
                            title="Find a Doctor"
                            description="View specialists, their status, and availability."
                            icon={Stethoscope}
                            colorClass="border-indigo-500"
                            link="/patient/doctors"
                        />
                    </div>
                    <div style={{ animationDelay: '0.2s' }}>
                        <DashboardCard
                            title="Medical History"
                            description="Review and update your past records."
                            icon={HeartPulse}
                            colorClass="border-red-500"
                            link="/patient/history"
                        />
                    </div>
                    <div style={{ animationDelay: '0.3s' }}>
                        <DashboardCard
                            title="Pharmacy Catalog"
                            description="Browse available medicines and prices."
                            icon={Pill}
                            colorClass="border-yellow-500"
                            link="/patient/pharmacy"
                        />
                    </div>
                    <div style={{ animationDelay: '0.4s' }}>
                        <DashboardCard
                            title="AI Health Assistant"
                            description="Get instant health answers and find nearby facilities."
                            icon={Brain}
                            colorClass="border-purple-500"
                            link="/patient/ai-assistant"
                        />
                    </div>
                    <div style={{ animationDelay: '0.5s' }}>
                        <DashboardCard
                            title="Route Finder"
                            description="Find routes to hospitals, pharmacies, and save your locations."
                            icon={MapPin}
                            colorClass="border-blue-500"
                            link="/patient/map"
                        />
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-green-100 hover-lift animate-slideInRight" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                            <Stethoscope className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">Your Consultations</h2>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border-2 border-dashed border-indigo-200 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6 animate-bounce">
                            <Stethoscope className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Live Consultations</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Real-time consultation list and chat history will appear here. Connect with doctors instantly for your health needs.
                        </p>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-200 inline-block">
                            <p className="text-indigo-600 font-medium flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Click "Find a Doctor" to start a new session
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;