import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Must match your backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- API FUNCTIONS ---

// 1. Doctor Search & Filters
// Calls: GET /api/doctor?category=Cardiologist&search=Dr.Neelmani
export const searchDoctors = (category, searchTerm) => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (searchTerm) params.append('search', searchTerm);
  
  return api.get(`/doctor?${params.toString()}`);
};

// Get single doctor details (for the booking modal)
export const getDoctorById = (id) => api.get(`/doctor/profile/${id}`);

// 2. Appointment Booking
export const bookAppointment = (data) => api.post('/appointments/book', data);

// 3. Payment Confirmation
export const confirmPayment = (data) => api.post('/appointments/confirm-payment', data);

// 4. Dashboard Data
export const getDoctorAppointments = () => api.get('/appointments/doctor');
export const getPatientAppointments = () => api.get('/appointments/patient');

// 5. Cancel Appointment
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`);

export default api;