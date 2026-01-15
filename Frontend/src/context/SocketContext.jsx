import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom'; 

// Detect if running on localhost or network
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_SERVER_URL = isLocalhost ? "http://localhost:5000" : `http://${window.location.hostname}:5000`;

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const location = useLocation(); 

    // Fetch user from storage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // --- THE FIX: Handle both '_id' (MongoDB default) and 'id' (Normalized) ---
    const userId = user?._id || user?.id;

    useEffect(() => {
        // SCENARIO 1: User is logged in (we have a valid ID), but socket isn't connected yet.
        if (userId && !socketRef.current) {
            console.log("Initializing Socket for user:", userId);
            
            socketRef.current = io(SOCKET_SERVER_URL, {
                auth: { userId: userId }, // Send the correct ID to the server
                transports: ['websocket'],
            });

            socketRef.current.on('connect', () => {
                console.log(`Socket connected: ${socketRef.current.id}`);
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected.');
                setIsConnected(false);
            });
        }
        // SCENARIO 2: User logged out (no ID), but socket is still open.
        else if (!userId && socketRef.current) {
            console.log("User logged out, closing socket.");
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
        
        // Re-run this effect if the userId changes or the user navigates
    }, [userId, location.pathname]); 

    const value = {
        socket: socketRef.current,
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};