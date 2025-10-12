import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatWindow from '../chat/ChatWindow';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchAvailableDoctors();
  }, []);

  const fetchAvailableDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/conversations');
      setDoctors(response.data);
    } catch (error) {
      setError('Failed to fetch doctors');
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchAvailableDoctors}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (selectedDoctor) {
    return (
      <ChatWindow
        currentUser={user}
        selectedUser={selectedDoctor}
        onBack={handleBackToDoctors}
        userType="patient"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.name}
              </h1>
              <p className="text-sm text-gray-600">Patient Dashboard</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Available Doctors
            </h2>
            <p className="text-sm text-gray-600">
              Select a doctor to start a conversation
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {doctors.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">👨‍⚕️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-600">
                  You haven't started any conversations with doctors yet.
                </p>
              </div>
            ) : (
              doctors.map((doctor) => (
                <div
                  key={doctor.userId}
                  onClick={() => handleDoctorSelect(doctor)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-primary-600">
                            {doctor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            Dr. {doctor.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                doctor.isOnline ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-xs text-gray-500">
                              {doctor.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {doctor.email}
                        </p>
                        {doctor.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {doctor.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {doctor.lastTimestamp && (
                        <p className="text-xs text-gray-500">
                          {new Date(doctor.lastTimestamp).toLocaleDateString()}
                        </p>
                      )}
                      {doctor.unreadCount > 0 && (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                          {doctor.unreadCount} new
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

