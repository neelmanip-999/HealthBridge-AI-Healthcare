import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatWindow from '../components/ChatWindow';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:5000";

const Chat = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socket = useRef(null);

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

    // Effect to manage the socket connection and notify the server
    useEffect(() => {
        // Wait until we have both the doctor's info and the current user's info
        if (!doctor || !currentUser?.id) return;

        // Initialize and connect the socket
        socket.current = io(SOCKET_SERVER_URL, {
            auth: { userId: currentUser.id },
            transports: ['websocket']
        });

        // Once connected, emit the event to start the consultation
        socket.current.on('connect', () => {
            console.log("Patient socket connected. Emitting startConsultation.");
            socket.current.emit('startConsultation', {
                doctorId: doctor._id,
                patient: {
                    _id: currentUser.id, // Ensure your localStorage user has 'id'
                    name: currentUser.name // Ensure your localStorage user has 'name'
                }
            });
        });

        // Cleanup: disconnect the socket when the component is unmounted
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [doctor, currentUser?.id]); // This effect re-runs if the doctor or user changes


    const handleEndChat = () => {
        navigate('/patient/dashboard');
    };

    if (loading) {
        return <div className="text-center p-10 font-bold">Loading Doctor Profile...</div>;
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
            {doctor && (
                <ChatWindow
                    partner={doctor}
                    onEndChat={handleEndChat}
                    userRole="patient"
                />
            )}
        </div>
    );
};

export default Chat;

