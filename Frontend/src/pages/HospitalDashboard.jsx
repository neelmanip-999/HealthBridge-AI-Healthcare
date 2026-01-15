import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, MapPin, Phone, Bed, AlertCircle, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [showPricingForm, setShowPricingForm] = useState(false);
    const [pricingForm, setPricingForm] = useState({
        serviceType: 'Test',
        name: '',
        description: '',
        price: '',
        category: ''
    });
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

    const handleAddPricing = async () => {
        try {
            if (!pricingForm.name || !pricingForm.price) {
                setMessage('Please fill in service name and price');
                return;
            }

            const response = await axios.post('/api/hospital-auth/pricing', pricingForm, {
                headers: { 'auth-token': token }
            });

            setHospital(prev => ({ ...prev, pricing: response.data.pricing }));
            setPricingForm({
                serviceType: 'Test',
                name: '',
                description: '',
                price: '',
                category: ''
            });
            setShowPricingForm(false);
            setMessage('Pricing added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to add pricing');
        }
    };

    const handleDeletePricing = async (pricingId) => {
        try {
            const response = await axios.delete(`/api/hospital-auth/pricing/${pricingId}`, {
                headers: { 'auth-token': token }
            });

            setHospital(prev => ({ ...prev, pricing: response.data.pricing }));
            setMessage('Pricing deleted successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to delete pricing');
        }
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

                {/* Pricing Catalog Section */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Services & Pricing Catalog</h2>
                        <button
                            onClick={() => setShowPricingForm(!showPricingForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Pricing
                        </button>
                    </div>

                    {/* Add Pricing Form */}
                    {showPricingForm && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Service/Test</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                                    <select
                                        name="serviceType"
                                        value={pricingForm.serviceType}
                                        onChange={(e) => setPricingForm(prev => ({ ...prev, serviceType: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Disease Treatment">Disease Treatment</option>
                                        <option value="Test">Test</option>
                                        <option value="Consultation">Consultation</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="Admission">Admission</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={pricingForm.price}
                                        onChange={(e) => setPricingForm(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="Enter price"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                                <input
                                    type="text"
                                    value={pricingForm.name}
                                    onChange={(e) => setPricingForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Blood Test, X-Ray, Consultation"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                                <textarea
                                    value={pricingForm.description}
                                    onChange={(e) => setPricingForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Add details about this service"
                                    rows="2"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddPricing}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors"
                                >
                                    Save Pricing
                                </button>
                                <button
                                    onClick={() => setShowPricingForm(false)}
                                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pricing List */}
                    <div className="space-y-3">
                        {hospital?.pricing && hospital.pricing.length > 0 ? (
                            hospital.pricing.map((item, idx) => (
                                <div key={idx} className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                                {item.serviceType}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                        {item.description && (
                                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">₹{item.price}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePricing(item._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No pricing added yet. Click "Add Pricing" to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
