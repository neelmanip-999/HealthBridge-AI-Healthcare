import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, LogOut, Package, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

const PharmacyDashboard = () => {
    const navigate = useNavigate();
    const [pharmacy] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [medicines, setMedicines] = useState([
        { id: 1, name: 'Paracetamol 500mg', stock: 150, price: 2.50, expiry: '2025-12-31' },
        { id: 2, name: 'Ibuprofen 400mg', stock: 80, price: 3.20, expiry: '2025-08-15' },
        { id: 3, name: 'Amoxicillin 250mg', stock: 45, price: 8.75, expiry: '2024-11-30' },
    ]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { status: 'expired', color: 'text-red-600 bg-red-100' };
        if (diffDays <= 30) return { status: 'expiring', color: 'text-yellow-600 bg-yellow-100' };
        return { status: 'good', color: 'text-green-600 bg-green-100' };
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-100' };
        if (stock <= 10) return { status: 'low', color: 'text-yellow-600 bg-yellow-100' };
        return { status: 'good', color: 'text-green-600 bg-green-100' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-3xl mb-10 border-t-4 border-yellow-600 relative z-10 animate-fadeInUp">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl">
                        <Pill className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 gradient-text">Pharmacy Dashboard</h1>
                        <p className="text-gray-500 mt-1">Inventory Management & Patient Services</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">Welcome, {pharmacy?.name || 'Pharmacy'}!</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="btn-danger btn-ripple"
                    >
                        <span className="flex items-center">
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </span>
                    </button>
                </div>
            </header>

            <main className="relative z-10">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover-lift">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Medicines</p>
                                <p className="text-3xl font-bold text-yellow-600">{medicines.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover-lift">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {medicines.filter(m => m.stock <= 10).length}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover-lift">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {medicines.filter(m => {
                                        const expiry = new Date(m.expiry);
                                        const today = new Date();
                                        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                                        return diffDays <= 30 && diffDays > 0;
                                    }).length}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover-lift">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-3xl font-bold text-green-600">
                                    ${medicines.reduce((sum, m) => sum + (m.stock * m.price), 0).toFixed(2)}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Medicine Inventory */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-yellow-100 hover-lift">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl">
                                <Package className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span>Medicine Inventory</span>
                        </h2>
                        <button className="btn-primary btn-ripple">
                            <span className="flex items-center">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Medicine
                            </span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.map((medicine) => {
                                    const stockStatus = getStockStatus(medicine.stock);
                                    const expiryStatus = getExpiryStatus(medicine.expiry);
                                    
                                    return (
                                        <tr key={medicine.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900">{medicine.name}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                                                    {medicine.stock} units
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-gray-900 font-medium">
                                                ${medicine.price}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${expiryStatus.color}`}>
                                                    {medicine.expiry}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex space-x-2">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PharmacyDashboard;