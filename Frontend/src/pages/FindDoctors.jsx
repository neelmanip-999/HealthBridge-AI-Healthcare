import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stethoscope,
    ArrowLeft,
    MessageCircle,
    Clock,
    DollarSign,
    Star, // Added Star icon for rating
} from 'lucide-react';
import api from '../services/api';

const FindDoctors = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            // NOTE: Assuming the API returns an array of doctor objects like:
            // { _id: 'd123', name: 'Anya Sharma', specialization: 'Dermatology', status: 'free', fees: 25, rating: 4.8 }
            const res = await api.get('/patient/doctors');
            setDoctors(res.data);
        } catch (err) {
            setError('Failed to fetch doctors. Please try again.');
            console.error('Error fetching doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'free': return 'bg-green-100 text-green-800';
            case 'busy': return 'bg-yellow-100 text-yellow-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'free': return 'Available';
            case 'busy': return 'Busy';
            case 'offline': return 'Offline';
            default: return 'Unknown';
        }
    };

    /**
     * UPDATED FUNCTION:
     * This now navigates to a specific chat route for the doctor.
     * The `Maps` function can take an object to pass 'state',
     * which allows the Chat component to access the doctor's details
     * immediately without a second API call.
     */
    const handleStartConsultation = (doctor) => {
        if (doctor.status === 'free') {
            // 1. Navigate to the chat page route, using the doctor's ID in the URL.
            // 2. Pass the doctor object in the state so the chat page has the data.
            navigate(`/patient/chat/${doctor._id}`, { 
                state: { doctorData: doctor } 
            });
        } else {
            // This case should not be reachable if the button is disabled, but good for safety.
            alert(`Dr. ${doctor.name} is ${getStatusText(doctor.status)}. Please wait or choose another doctor.`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background decorative elements (kept as is) */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative z-10">
                {/* Header (kept as is) */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/patient/dashboard')}
                            className="p-2 hover:bg-white/50 rounded-xl transition-colors duration-200"
                        >
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                                <Stethoscope className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 gradient-text">Find Doctors</h1>
                                <p className="text-gray-500">Browse available specialists and start consultations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State (kept as is) */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-bounce">
                            <Stethoscope className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-gray-600">Loading available doctors...</p>
                    </div>
                )}

                {/* Error State (kept as is) */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center border border-red-200 mb-6">
                        {error}
                    </div>
                )}

                {/* Doctors List */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                                    <Stethoscope className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Doctors Available</h3>
                                <p className="text-gray-500">There are currently no doctors registered in the system.</p>
                            </div>
                        ) : (
                            doctors.map((doctor) => (
                                <div
                                    key={doctor._id}
                                    className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-green-100 hover-lift card-hover animate-slideInRight"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                                                <Stethoscope className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Dr. {doctor.name}</h3>
                                                <p className="text-indigo-600 font-medium">{doctor.specialization}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(doctor.status)}`}>
                                            {getStatusText(doctor.status)}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <DollarSign className="h-4 w-4" />
                                            <span className="text-lg font-semibold text-green-600">${doctor.fees}</span>
                                            <span className="text-sm">consultation fee</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">Usually responds within 5 minutes</span>
                                        </div>
                                        {/* Added Rating/Experience detail */}
                                        {doctor.rating && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-medium">{doctor.rating} Star Rating</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        // MODIFIED: Pass the entire doctor object
                                        onClick={() => handleStartConsultation(doctor)} 
                                        disabled={doctor.status !== 'free'}
                                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                                            doctor.status === 'free'
                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>
                                                {doctor.status === 'free' ? 'Start Consultation' : 'Not Available'}
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FindDoctors;