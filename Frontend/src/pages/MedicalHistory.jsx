import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, User, FileText, Activity, Clock, 
    ChevronRight, Stethoscope, Pill, Download, Brain, X, Loader2, Star 
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal'; // <--- IMPORT THE NEW MODAL

const MedicalHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // --- AI SUMMARY STATE ---
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    // --- REVIEW MODAL STATE ---
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedReviewDoctor, setSelectedReviewDoctor] = useState(null);

    // Fetch Data
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Use localhost or dynamic IP for flexibility
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;

                const res = await axios.get(`${apiBaseURL}/patient/medical-history`, {
                    headers: { 'auth-token': token }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Error fetching history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [token]);

    // --- HANDLER: AI SUMMARY ---
    const handleAISummary = async (record) => {
        setShowSummaryModal(true);
        setSummaryLoading(true);
        setSummaryData(null);

        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;

            const res = await axios.post(`${apiBaseURL}/ai/summarize`, 
                { 
                    patientId: currentUser._id || currentUser.id,
                    doctorId: record.doctorId._id 
                },
                { headers: { 'auth-token': token } }
            );

            if (res.data.success) {
                setSummaryData(res.data.summary);
            } else {
                setSummaryData("Could not generate a summary for this consultation.");
            }
        } catch (err) {
            console.error("AI Summary Failed:", err);
            setSummaryData("Failed to connect to AI service. Please try again.");
        } finally {
            setSummaryLoading(false);
        }
    };

    // --- HANDLER: OPEN REVIEW MODAL ---
    const handleRateDoctor = (record) => {
        setSelectedReviewDoctor({
            id: record.doctorId._id,
            name: record.doctorId.name
        });
        setReviewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 relative">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-3 bg-teal-100 rounded-xl">
                        <Activity className="w-8 h-8 text-teal-600" />
                    </div>
                    Medical History & Prescriptions
                </h1>
                <p className="text-gray-500 mt-2 ml-16">
                    View your past consultations, diagnoses, and digital prescriptions.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading your health records...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No History Found</h3>
                        <p className="text-gray-500 mt-2">You haven't completed any consultations yet.</p>
                    </div>
                ) : (
                    /* Timeline View */
                    <div className="space-y-6">
                        {history.map((record) => (
                            <div key={record._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                {/* Decorative sidebar */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500"></div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Date & Time Section */}
                                    <div className="flex-shrink-0 md:w-48 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                                        <div className="flex items-center gap-2 text-teal-700 font-bold text-lg mb-1">
                                            <Calendar className="w-5 h-5" />
                                            {new Date(record.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Clock className="w-4 h-4" />
                                            {record.timeSlot}
                                        </div>
                                        <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                            COMPLETED
                                        </span>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-grow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-gray-400" />
                                                    Dr. {record.doctorId?.name || 'Unknown Doctor'}
                                                </h3>
                                                <p className="text-sm text-gray-500 ml-7">
                                                    {record.doctorId?.specialization || 'General Physician'}
                                                </p>
                                            </div>
                                            
                                            {/* --- ACTION BUTTONS --- */}
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button 
                                                    onClick={() => handleRateDoctor(record)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-200 transition transform"
                                                >
                                                    <Star className="w-3 h-3" /> Rate Doctor
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleAISummary(record)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:scale-105 transition transform"
                                                >
                                                    <Brain className="w-3 h-3" /> AI Summary
                                                </button>
                                            </div>
                                        </div>

                                        {/* Diagnosis & Prescription Box */}
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</h4>
                                                <p className="text-gray-800 font-medium">
                                                    {record.diagnosis || "No diagnosis recorded."}
                                                </p>
                                            </div>

                                            {record.prescription && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Pill className="w-4 h-4" /> Prescription
                                                    </h4>
                                                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-line font-mono text-sm">
                                                        {record.prescription}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- AI SUMMARY MODAL --- */}
            {showSummaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Brain className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Consultation Insights</h3>
                                    <p className="text-purple-100 text-xs">Powered by HealthBridge AI</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSummaryModal(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-grow">
                            {summaryLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                                    <p className="text-gray-500 font-medium animate-pulse">Analyzing consultation logs...</p>
                                </div>
                            ) : (
                                <div className="prose prose-purple max-w-none text-sm text-gray-700">
                                    <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm whitespace-pre-wrap leading-relaxed">
                                        {summaryData}
                                    </div>
                                    <div className="mt-4 flex gap-2 items-start text-xs text-gray-400 italic bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                        <span className="text-yellow-600 font-bold not-italic">Disclaimer:</span>
                                        This summary is generated by AI based on your chat history. It is for informational purposes only and does not replace official medical advice.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white border-t border-gray-200 text-center shrink-0">
                            <button 
                                onClick={() => setShowSummaryModal(false)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REVIEW MODAL --- */}
            <ReviewModal 
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                doctorId={selectedReviewDoctor?.id}
                doctorName={selectedReviewDoctor?.name}
                onSuccess={(newRating) => {
                    alert(`Thank you! Doctor's new rating is ${newRating} stars.`);
                    setReviewModalOpen(false);
                }}
            />
        </div>
    );
};

export default MedicalHistory;