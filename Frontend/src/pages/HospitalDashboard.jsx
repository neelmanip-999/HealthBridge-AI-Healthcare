import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, MapPin, Phone, Bed, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchHospitalProfile();
    }, []);

    const fetchHospitalProfile = async () => {
        try {
            const response = await axios.get('/api/hospital-auth/profile', {
                headers: { 'auth-token': token }
            });
            setHospital(response.data);
            setFormData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            localStorage.clear();
            navigate('/hospital/login');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updateData = {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                beds: formData.beds,
                emergencyServices: formData.emergencyServices,
                latitude: formData.location?.coordinates[1],
                longitude: formData.location?.coordinates[0]
            };

            const response = await axios.put('/api/hospital-auth/update', updateData, {
                headers: { 'auth-token': token }
            });

            setHospital(response.data.hospital);
            setFormData(response.data.hospital);
            setEditing(false);
            setMessage('Hospital details updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update hospital details');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (loading && !hospital) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hospital Dashboard</h1>
                            <p className="text-gray-600">{hospital?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                        {message}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Hospital Details</h2>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            {editing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    value={formData.location?.coordinates[1] || 0}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        location: {
                                            ...prev.location,
                                            coordinates: [prev.location?.coordinates[0], parseFloat(e.target.value)]
                                        }
                                    }))}
                                    disabled={!editing}
                                    step="0.0001"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    value={formData.location?.coordinates[0] || 0}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        location: {
                                            ...prev.location,
                                            coordinates: [parseFloat(e.target.value), prev.location?.coordinates[1]]
                                        }
                                    }))}
                                    disabled={!editing}
                                    step="0.0001"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Beds */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Beds</label>
                            <input
                                type="number"
                                name="beds"
                                value={formData.beds || 0}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Emergency Services */}
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="emergencyServices"
                                checked={formData.emergencyServices || false}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span className="ml-3 text-sm text-gray-700">Emergency Services Available</span>
                        </label>

                        {/* Save Button */}
                        {editing && (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            Your hospital details are displayed on the patient Route Finder map. Make sure all information is accurate.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
