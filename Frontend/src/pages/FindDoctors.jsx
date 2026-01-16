import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <--- Added Axios
import {
    Stethoscope,
    ArrowLeft,
    Search,
    Filter,
    Briefcase,
    DollarSign,
    Star,
    CalendarCheck,
    Sparkles, // <--- AI Icon
    Loader2   // <--- Loading Icon
} from 'lucide-react';
import { searchDoctors } from '../services/api'; 
import BookingModal from '../components/BookingModal';

const categories = ["All", "Cardiologist", "Dermatologist", "Neurologist", "General Physician", "Pediatrician"];

const FindDoctors = () => {
    const navigate = useNavigate();
    
    // State for Data
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for Filters
    const [category, setCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false); // <--- New State

    // State for Booking Modal
    const [selectedDoctor, setSelectedDoctor] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, [category]); 

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await searchDoctors(category, searchTerm);
            setDoctors(res.data);
        } catch (err) {
            setError('Failed to fetch doctors. Please try again.');
            console.error('Error fetching doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDoctors();
    };

    // --- NEW: AI SMART MATCH FUNCTION ---
    const handleAiMatch = async () => {
        if (!searchTerm.trim()) return;
        setIsAiSearching(true);
        try {
            const token = localStorage.getItem('token');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;
            
            // Ask AI to categorize the symptoms
            const res = await axios.post(`${apiBaseURL}/ai/query`, {
                prompt: searchTerm,
                context: "symptom_checker"
            }, { headers: { 'auth-token': token } });

            if (res.data.success) {
                const suggestedCategory = res.data.response.trim();
                
                // Check if the suggested category exists in our list
                const match = categories.find(c => c.toLowerCase() === suggestedCategory.toLowerCase());
                
                if (match) {
                    setCategory(match); // Auto-switch the dropdown
                    // Optional: You could show a toast message here "Switched to Dermatologist"
                } else {
                    // Fallback if AI suggests something obscure (e.g. "Oncologist" which isn't in your list)
                    // We keep 'All' or switch to 'General Physician'
                    alert(`AI suggests seeing a ${suggestedCategory}, but we currently don't have that filter. Showing all doctors.`);
                    setCategory("All");
                }
            }
        } catch (err) {
            console.error("AI Match Failed", err);
            alert("AI could not connect. Please search manually.");
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleBookAppointment = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDoctor(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-100 text-green-800 border-green-200';
            case 'busy': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 md:p-10 relative">
            
            {/* --- HEADER & FILTERS --- */}
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    
                    {/* Title & Back Button */}
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <button onClick={() => navigate('/patient/dashboard')} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Find Doctors</h1>
                            <p className="text-gray-500">Book appointments with top specialists</p>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="pl-10 pr-4 py-3 rounded-xl border-none shadow-md focus:ring-2 focus:ring-green-500 bg-white text-gray-700 w-full md:w-48 appearance-none cursor-pointer"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="relative flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search name or describe symptoms..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-3 rounded-xl border-none shadow-md focus:ring-2 focus:ring-green-500 w-full"
                                />
                            </div>
                            {/* AI BUTTON */}
                            <button 
                                onClick={handleAiMatch} 
                                disabled={isAiSearching || !searchTerm}
                                className="bg-indigo-600 text-white px-4 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                                title="Auto-detect Specialist based on symptoms"
                            >
                                {isAiSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                <span className="hidden md:inline">AI Match</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- DOCTORS GRID --- */}
                {loading ? (
                    <div className="text-center py-12 animate-pulse">
                        <Stethoscope className="h-12 w-12 text-green-600 mx-auto mb-4 animate-bounce" />
                        <p className="text-gray-600">Finding best doctors for you...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center border border-red-200">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => (
                            <div key={doctor._id} className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-green-50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                
                                {/* Top Section: Image & Basic Info */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <img 
                                            src={doctor.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} 
                                            alt={doctor.name} 
                                            className="w-16 h-16 rounded-full border-2 border-green-100 object-cover"
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Dr. {doctor.name}</h3>
                                            <p className="text-green-600 font-medium text-sm">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(doctor.status)}`}>
                                        {doctor.status}
                                    </span>
                                </div>

                                {/* Info Grid */}
                                <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl flex-grow">
                                    
                                    {/* Fees */}
                                    <div className="flex items-center justify-between text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="font-semibold text-gray-900">${doctor.fees}</span>
                                        </div>
                                        <span className="text-xs">Consultation Fee</span>
                                    </div>

                                    {/* Experience */}
                                    <div className="flex items-center justify-between text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <Briefcase className="h-4 w-4 text-blue-500" />
                                            <span className="font-semibold text-gray-900">{doctor.experience || 0}+ Years</span>
                                        </div>
                                        <span className="text-xs">Experience</span>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center justify-between text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-semibold text-gray-900">
                                                {doctor.averageRating ? doctor.averageRating.toFixed(1) : "New"} 
                                                <span className="text-gray-400 text-xs font-normal ml-1">
                                                    ({doctor.totalRatings || 0} reviews)
                                                </span>
                                            </span>
                                        </div>
                                        <span className="text-xs">Rating</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleBookAppointment(doctor)}
                                    className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 mt-auto"
                                >
                                    <CalendarCheck className="h-5 w-5" />
                                    <span>Book Appointment</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- BOOKING MODAL --- */}
            {isModalOpen && selectedDoctor && (
                <BookingModal 
                    doctor={selectedDoctor} 
                    onClose={handleCloseModal} 
                />
            )}
        </div>
    );
};

export default FindDoctors;