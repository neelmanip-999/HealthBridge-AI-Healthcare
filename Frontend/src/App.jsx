import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';

// --- EXISTING PAGES ---
import HomePage from './pages/HomePage';
import UnifiedLogin from './pages/UnifiedLogin';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientLogin from './pages/PatientLogin';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import FindDoctors from './pages/FindDoctors';
import ReportAnalysis from './pages/ReportAnalysis'; // Keep this for your ML Model
import MapPage from './pages/MapPage';
import Chat from './pages/chat';
import PharmacyLogin from './pages/PharmacyLogin';
import PharmacyRegister from './pages/PharmacyRegister';
import PharmacyDashboard from './pages/PharmacyDashboard';

// --- NEW PAGES ---
import MedicalHistory from './pages/MedicalHistory';
import PharmacyCatalog from './pages/PharmacyCatalog';
import AIHealthAssistant from './pages/AIHealthAssistant'; 
import MedicalReportDecoder from './pages/MedicalReportDecoder'; // <--- Imported here
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegister from './pages/HospitalRegister';
import HospitalDashboard from './pages/HospitalDashboard';


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
            <SocketProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Unified Login Route */}
                    <Route path="/login" element={<UnifiedLogin />} />
                    
                    {/* Doctor Routes */}
                    <Route path="/doctor/login" element={<DoctorLogin />} />
                    <Route path="/doctor/register" element={<DoctorRegister />} />
                    <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
                    
                    {/* Patient Routes */}
                    <Route path="/patient/login" element={<PatientLogin />} />
                    <Route path="/patient/register" element={<PatientRegister />} />
                    <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
                    <Route path="/patient/doctors" element={<ProtectedRoute role="patient"><FindDoctors /></ProtectedRoute>} />
                    
                    {/* YOUR ML MODEL (Existing) */}
                    <Route path="/patient/report-analysis" element={<ProtectedRoute role="patient"><ReportAnalysis /></ProtectedRoute>} />
                    
                    {/* NEW AI DECODER (Generative AI) - ADDED THIS LINE */}
                    <Route path="/patient/report-decoder" element={<ProtectedRoute role="patient"><MedicalReportDecoder /></ProtectedRoute>} />

                    <Route path="/patient/map" element={<ProtectedRoute role="patient"><MapPage /></ProtectedRoute>} />
                    <Route path="/patient/chat/:doctorId" element={<ProtectedRoute role="patient"><Chat /></ProtectedRoute>} />
                    
                    {/* --- NEW ROUTES FOR MEDICAL HISTORY & PHARMACY CATALOG & AI --- */}
                    <Route path="/patient/medical-history" element={<ProtectedRoute role="patient"><MedicalHistory /></ProtectedRoute>} />
                    <Route path="/patient/pharmacy-catalog" element={<ProtectedRoute role="patient"><PharmacyCatalog /></ProtectedRoute>} />
                    
                    {/* --- ADDED AI ASSISTANT ROUTE --- */}
                    <Route path="/patient/ai-assistant" element={<ProtectedRoute role="patient"><AIHealthAssistant /></ProtectedRoute>} />
                    
                    {/* Pharmacy Routes */}
                    <Route path="/pharmacy/login" element={<PharmacyLogin />} />
                    <Route path="/pharmacy/register" element={<PharmacyRegister />} />
                    <Route path="/pharmacy/dashboard" element={<ProtectedRoute role="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />

                    {/* Hospital Routes */}
                    <Route path="/hospital/login" element={<HospitalLogin />} />
                    <Route path="/hospital/register" element={<HospitalRegister />} />
                    <Route path="/hospital/dashboard" element={<ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>} />

                    <Route path="*" element={<h1 className='text-4xl text-center pt-20 font-bold text-red-500'>404 | Page Not Found</h1>} />
                </Routes>
            </SocketProvider>
        </Router>
    );
};

export default App;