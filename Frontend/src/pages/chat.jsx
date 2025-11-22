import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import api from '../services/api';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
    </div>
);

const Chat = () => {
    // NOTE: Ensure your Route in App.jsx is something like path="/patient/chat/:id"
    // If your route param is named ':id', change this to: const { id: doctorId } = useParams();
    const { doctorId } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation(); // <-- Capture data passed from Dashboard
    const { socket } = useSocket();

    // 1. Initialize state with passed data (fast load) or null (need to fetch)
    const [doctor, setDoctor] = useState(location.state?.doctorData || null);
    const [loading, setLoading] = useState(!location.state?.doctorData);
    const [error, setError] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // 2. Fetch Doctor Profile (Only if we didn't get it from navigation state)
    useEffect(() => {
        if (doctor) return; // Skip if we already have the data

        const fetchDoctorData = async () => {
            try {
                setLoading(true);
                // Fallback: Fetch by ID from URL
                const response = await api.get(`/doctor/profile/${doctorId}`);
                setDoctor(response.data);
            } catch (err) {
                setError('Could not load doctor information. They may not exist or the server is down.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchDoctorData();
        }
    }, [doctorId, doctor]);

    // 3. Notify Doctor (Socket Event)
    useEffect(() => {
        if (socket && doctor && currentUser?._id) {
            console.log("Patient chat page is ready. Emitting startConsultation.");
            socket.emit('startConsultation', {
                doctorId: doctor._id,
                patient: {
                    _id: currentUser._id,
                    name: currentUser.name
                }
            });
        }
    }, [socket, doctor, currentUser?._id]);

    const handleEndChat = () => {
        navigate('/patient/dashboard');
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/patient/find-doctors')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                    Find Another Doctor
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gray-50">
            {doctor ? (
                <ChatWindow
                    partner={doctor} // Pass the full doctor object
                    onEndChat={handleEndChat}
                    userRole="patient"
                />
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Initializing secure chat environment...</p>
                 </div>
            )}
        </div>
    );
};

export default Chat;