import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PharmacyDashboard from './components/pharmacy/PharmacyDashboard';
import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { AuthContext } from './context/AuthContext';

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            user ? (
              user.role === 'patient' ? <Navigate to="/patient" /> :
              user.role === 'doctor' ? <Navigate to="/doctor" /> :
              <Navigate to="/pharmacy" />
            ) : <Navigate to="/login" />
          } />
          <Route path="/patient/*" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard/></ProtectedRoute>} />
          <Route path="/doctor/*" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard/></ProtectedRoute>} />
          <Route path="/pharmacy/*" element={<ProtectedRoute allowedRoles={['pharmacy']}><PharmacyDashboard/></ProtectedRoute>} />
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}
