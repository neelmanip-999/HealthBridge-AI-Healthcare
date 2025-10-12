import api from './api';
export const fetchMessages = (appointmentId) => api.get(`/chat/${appointmentId}`).then(r=>r.data);
export const markRead = (appointmentId) => api.put(`/chat/${appointmentId}/read`).then(r=>r.data);
