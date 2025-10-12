import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatWindow from '../chat/ChatWindow';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/conversations');
      setPatients(response.data);
    } catch (error) {
      setError('Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToPatients = () => {
    setSelectedPatient(null);
  };

  const toggleAvailability = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll just update the local state
      console.log('Toggle availability - to be implemented');
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
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
            onClick={fetchPatients}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (selectedPatient) {
    return (
      <ChatWindow
        currentUser={user}
        selectedUser={selectedPatient}
        onBack={handleBackToPatients}
        userType="doctor"
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
                Dr. {user.name}
              </h1>
              <p className="text-sm text-gray-600">
                {user.specialization} • Patient Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <button
                  onClick={toggleAvailability}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.available ? 'Available' : 'Busy'}
                </button>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Your Patients
            </h2>
            <p className="text-sm text-gray-600">
              Select a patient to view conversation
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {patients.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No patients yet
                </h3>
                <p className="text-gray-600">
                  You don't have any conversations with patients yet.
                </p>
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.userId}
                  onClick={() => handlePatientSelect(patient)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-secondary-600">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {patient.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                patient.isOnline ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-xs text-gray-500">
                              {patient.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {patient.email}
                        </p>
                        {patient.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {patient.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {patient.lastTimestamp && (
                        <p className="text-xs text-gray-500">
                          {new Date(patient.lastTimestamp).toLocaleDateString()}
                        </p>
                      )}
                      {patient.unreadCount > 0 && (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                          {patient.unreadCount} new
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

export default DoctorDashboard;

