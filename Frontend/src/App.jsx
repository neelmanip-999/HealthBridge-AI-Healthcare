import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext'; // <-- IMPORT

// Import all your pages...
import HomePage from './pages/HomePage';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientLogin from './pages/PatientLogin';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import FindDoctors from './pages/FindDoctors';
import AIHealthAssistant from './pages/AIHealthAssistant';
import Chat from './pages/chat';
import MapPage from './pages/MapPage';
import PharmacyLogin from './pages/PharmacyLogin';
import PharmacyRegister from './pages/PharmacyRegister';
import PharmacyDashboard from './pages/PharmacyDashboard';

// Your ProtectedRoute remains unchanged
const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== role) {
        localStorage.clear();
        return <Navigate to="/" />;
    }
    return children;
};

const App = () => {
    return (
        <Router>
            {/* --- THE FIX IS HERE: PROVIDER IS NOW INSIDE ROUTER --- */}
            <SocketProvider>
                <Routes>
                    {/* All your existing routes go here */}
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Doctor Routes */}
                    <Route path="/doctor/login" element={<DoctorLogin />} />
                    <Route path="/doctor/register" element={<DoctorRegister />} />
                    <Route 
                        path="/doctor/dashboard" 
                        element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} 
                    />
                    
                    {/* Patient Routes */}
                    <Route path="/patient/login" element={<PatientLogin />} />
                    <Route path="/patient/register" element={<PatientRegister />} />
                    <Route 
                        path="/patient/dashboard" 
                        element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} 
                    />
                    <Route 
                        path="/patient/doctors" 
                        element={<ProtectedRoute role="patient"><FindDoctors /></ProtectedRoute>} 
                    />
                    <Route 
                        path="/patient/ai-assistant" 
                        element={<ProtectedRoute role="patient"><AIHealthAssistant /></ProtectedRoute>} 
                    />
                    <Route 
                        path="/patient/chat/:doctorId" 
                        element={<ProtectedRoute role="patient"><Chat /></ProtectedRoute>} 
                    />
                    <Route 
                        path="/patient/map" 
                        element={<ProtectedRoute role="patient"><MapPage /></ProtectedRoute>} 
                    />
                    
                    {/* Pharmacy Routes */}
                    <Route path="/pharmacy/login" element={<PharmacyLogin />} />
                    <Route path="/pharmacy/register" element={<PharmacyRegister />} />
                    <Route 
                        path="/pharmacy/dashboard" 
                        element={<ProtectedRoute role="pharmacy"><PharmacyDashboard /></ProtectedRoute>} 
                    />

                    <Route path="*" element={<h1 className='text-4xl text-center pt-20 font-bold text-red-500'>404 | Page Not Found</h1>} />
                </Routes>
            </SocketProvider>
        </Router>
    );
};

export default App;

