import React, { createContext, useEffect, useState } from 'react';
import { initSocket, getSocket } from '../services/socketService';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('hb_token');
    if (token) { const s = initSocket(token); setSocket(s); return () => s.disconnect(); }
  }, []);
  return <SocketContext.Provider value={{ socket: getSocket() }}>{children}</SocketContext.Provider>;
};
