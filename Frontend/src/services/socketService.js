import { io } from 'socket.io-client';
let socket = null;
export const initSocket = (token) => { if(!token) return null; if(socket) socket.disconnect(); const base = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api',''); socket = io(base, { auth: { token } }); return socket; };
export const getSocket = () => socket;
