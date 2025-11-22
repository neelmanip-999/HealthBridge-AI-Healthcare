import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext'; // <-- 1. Import the hook

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

const Chat = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    // --- THE FIX IS HERE ---
    const { socket } = useSocket(); // <-- 2. Destructure to get the actual socket instance
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Effect to fetch the doctor's profile data
    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const response = await api.get(`/doctor/profile/${doctorId}`);
                setDoctor(response.data);
            } catch (err) {
                setError('Could not load doctor information. They may not exist or the server is down.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctorData();
    }, [doctorId]);

    // Effect to notify the doctor that a consultation is starting
    useEffect(() => {
        // Wait until the shared socket, doctor data, and user data are all available
        if (socket && doctor && currentUser?._id) {
            console.log("Patient chat page is ready. Emitting startConsultation.");
            socket.emit('startConsultation', {
                doctorId: doctor._id,
                patient: {
                    // Send patient info so the doctor's UI can display the name
                    _id: currentUser._id,
                    name: currentUser.name
                }
            });
        }
    }, [socket, doctor, currentUser?._id]); // Re-run if any of these change

    const handleEndChat = () => {
        navigate('/patient/dashboard');
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/patient/doctors')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                    Find Another Doctor
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen p-4 bg-gray-100">
            {doctor ? (
                <ChatWindow
                    partner={doctor}
                    onEndChat={handleEndChat}
                    userRole="patient"
                />
            ) : (
                 <p className="text-center">Loading chat...</p>
            )}
        </div>
    );
};

export default Chat;

