import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:5000";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    // Use a ref to hold the socket instance. This prevents it from being re-created on every render.
    const socketRef = useRef(null);

    // This effect now runs on re-renders, making it reactive to login/logout.
    useEffect(() => {
        // Get the current user from localStorage each time the effect runs.
        const user = JSON.parse(localStorage.getItem('user'));

        // SCENARIO 1: A user is logged in, but we don't have a socket connection yet.
        if (user?._id && !socketRef.current) {
            // Create the one and only socket connection for this session.
            socketRef.current = io(SOCKET_SERVER_URL, {
                auth: { userId: user._id },
                transports: ['websocket'],
            });

            // Set up listeners to update the global 'isConnected' state.
            socketRef.current.on('connect', () => {
                console.log(`Socket connected successfully for user: ${user._id}`);
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected.');
                setIsConnected(false);
            });
        }
        // SCENARIO 2: No user is logged in, but we have a lingering socket connection.
        else if (!user && socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }); // <-- No dependency array, so it re-evaluates on re-renders. The logic inside prevents duplicates.

    // This is the value that all components consuming the context will receive.
    const value = {
        socket: socketRef.current, // Provide the actual socket instance.
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

