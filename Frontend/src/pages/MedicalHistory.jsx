import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, User, FileText, Activity, Clock, 
    ChevronRight, Stethoscope, Pill, Download 
} from 'lucide-react';

const MedicalHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    // Fetch Data
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // This connects to the backend route we made earlier
                const res = await axios.get('http://localhost:5000/api/patient/medical-history', {
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

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
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
        </div>
    );
};

export default MedicalHistory;