import api from './api';
export const bookAppointment = (data) => api.post('/appointments', data).then(r=>r.data);
export const getMyAppointments = () => api.get('/appointments/my').then(r=>r.data);
export const getAppointment = (id) => api.get(`/appointments/${id}`).then(r=>r.data);
export const updateAppointmentStatus = (id, status) => api.put(`/appointments/${id}/status`, { status }).then(r=>r.data);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`).then(r=>r.data);
export const addPrescription = (id, payload) => api.put(`/appointments/${id}/prescription`, payload).then(r=>r.data);
