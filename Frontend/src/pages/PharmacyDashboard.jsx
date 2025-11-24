import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Pill, LogOut, Package, Plus, Edit, Trash2, AlertTriangle, 
  Search, X, Save, Loader2, Calendar, DollarSign, TrendingUp,
  Filter, RefreshCw
} from 'lucide-react';
import { getMedicines, addMedicine, updateMedicine, deleteMedicine } from '../services/api';

const PharmacyDashboard = () => {
    const navigate = useNavigate();
    const [pharmacy] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [formData, setFormData] = useState({
        medicineName: '',
        stock: '',
        price: '',
        expiryDate: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch medicines from API
    const fetchMedicines = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getMedicines();
            // Response now contains { medicines, currentPharmacyName }
            if (response.data.medicines) {
                setMedicines(response.data.medicines);
            } else {
                // Fallback for old format
                setMedicines(response.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load medicines');
            console.error('Error fetching medicines:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleAddClick = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        console.log('Add button clicked');
        setFormData({
            medicineName: '',
            stock: '',
            price: '',
            expiryDate: ''
        });
        setShowAddModal(true);
        setShowEditModal(false);
        setError('');
    };

    const handleEditClick = (medicine) => {
        // Only allow editing own medicines
        if (medicine.pharmacistName !== pharmacy?.name) {
            setError('You can only edit your own medicines.');
            return;
        }
        setSelectedMedicine(medicine);
        setFormData({
            medicineName: medicine.medicineName || '',
            stock: medicine.stock || '',
            price: medicine.price || '',
            expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (medicine) => {
        // Only allow deleting own medicines
        if (medicine.pharmacistName !== pharmacy?.name) {
            setError('You can only delete your own medicines.');
            return;
        }
        setSelectedMedicine(medicine);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = {
                medicineName: formData.medicineName,
                stock: parseInt(formData.stock),
                price: parseFloat(formData.price),
                expiryDate: formData.expiryDate // Send as string (YYYY-MM-DD format)
                // pharmacistName is automatically set by backend
            };

            if (showEditModal && selectedMedicine) {
                await updateMedicine(selectedMedicine._id, data);
            } else {
                await addMedicine(data);
            }

            await fetchMedicines();
            setShowAddModal(false);
            setShowEditModal(false);
            setFormData({
                medicineName: '',
                stock: '',
                price: '',
                expiryDate: ''
            });
        } catch (err) {
            console.error('Error saving medicine:', err);
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error || 
                                err.message || 
                                'Failed to save medicine. Please check all fields are filled correctly.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMedicine) return;
        
        setSubmitting(true);
        try {
            await deleteMedicine(selectedMedicine._id);
            await fetchMedicines();
            setShowDeleteModal(false);
            setSelectedMedicine(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete medicine');
        } finally {
            setSubmitting(false);
        }
    };

    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { status: 'expired', color: 'text-red-600 bg-red-100 border-red-200' };
        if (diffDays <= 30) return { status: 'expiring', color: 'text-yellow-600 bg-yellow-100 border-yellow-200' };
        return { status: 'good', color: 'text-green-600 bg-green-100 border-green-200' };
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-100 border-red-200' };
        if (stock <= 10) return { status: 'low', color: 'text-yellow-600 bg-yellow-100 border-yellow-200' };
        return { status: 'good', color: 'text-green-600 bg-green-100 border-green-200' };
    };

    // Filter medicines based on search
    const filteredMedicines = medicines.filter(medicine => {
        const searchLower = searchTerm.toLowerCase();
        return (
            medicine.medicineName?.toLowerCase().includes(searchLower) ||
            medicine.pharmacistName?.toLowerCase().includes(searchLower)
        );
    });

    // Calculate statistics
    const stats = {
        total: medicines.length,
        lowStock: medicines.filter(m => m.stock <= 10).length,
        expiringSoon: medicines.filter(m => {
            const expiry = new Date(m.expiryDate);
            const today = new Date();
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays > 0;
        }).length,
        totalValue: medicines.reduce((sum, m) => sum + (m.stock * m.price), 0)
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-3xl mb-10 border-t-4 border-yellow-600 relative z-10">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl">
                        <Pill className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Pharmacy Dashboard</h1>
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
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="relative z-10">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Medicines</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.total}</p>
                            </div>
                            <Package className="h-8 w-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-3xl font-bold text-red-600">{stats.lowStock}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-3xl font-bold text-green-600">
                                    ${stats.totalValue.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Medicine Inventory */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-yellow-100">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl">
                                <Package className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span>Medicine Inventory</span>
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-initial">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-full md:w-64"
                                />
                            </div>
                            <button
                                onClick={fetchMedicines}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleAddClick}
                                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2 font-semibold"
                            >
                                <Plus className="w-4 h-4" />
                                Add Medicine
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
                        </div>
                    ) : filteredMedicines.length === 0 ? (
                        <div className="text-center py-20">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">
                                {searchTerm ? 'No medicines found matching your search' : 'No medicines in inventory'}
                            </p>
                            {!searchTerm && (
                                <button
                                    type="button"
                                    onClick={handleAddClick}
                                    className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                >
                                    Add Your First Medicine
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Pharmacist</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMedicines.map((medicine) => {
                                        const stockStatus = getStockStatus(medicine.stock);
                                        const expiryStatus = getExpiryStatus(medicine.expiryDate);
                                        const isOwnMedicine = medicine.pharmacistName === pharmacy?.name;
                                        
                                        return (
                                            <tr key={medicine._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!isOwnMedicine ? 'bg-gray-50/50' : ''}`}>
                                                <td className="py-4 px-4">
                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                        {medicine.medicineName}
                                                        {isOwnMedicine && (
                                                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                                                Mine
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.color}`}>
                                                        {medicine.stock} units
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-900 font-medium">
                                                    ${medicine.price?.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${expiryStatus.color}`}>
                                                        {new Date(medicine.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">
                                                    {medicine.pharmacistName}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEditClick(medicine)}
                                                            disabled={!isOwnMedicine}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                isOwnMedicine 
                                                                    ? 'text-blue-600 hover:bg-blue-100 cursor-pointer' 
                                                                    : 'text-gray-400 cursor-not-allowed opacity-50'
                                                            }`}
                                                            title={isOwnMedicine ? "Edit" : "You can only edit your own medicines"}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(medicine)}
                                                            disabled={!isOwnMedicine}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                isOwnMedicine 
                                                                    ? 'text-red-600 hover:bg-red-100 cursor-pointer' 
                                                                    : 'text-gray-400 cursor-not-allowed opacity-50'
                                                            }`}
                                                            title={isOwnMedicine ? "Delete" : "You can only delete your own medicines"}
                                                        >
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
                    )}
                </div>
            </main>

            {/* Add/Edit Medicine Modal */}
            {(showAddModal || showEditModal) && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAddModal(false);
                            setShowEditModal(false);
                            setError('');
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">
                                {showEditModal ? 'Edit Medicine' : 'Add New Medicine'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowEditModal(false);
                                    setError('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medicine Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.medicineName}
                                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="e.g., Paracetamol 500mg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {showEditModal ? 'Update' : 'Add'} Medicine
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedMedicine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Delete Medicine</h3>
                                <p className="text-gray-600 text-sm">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete <strong>{selectedMedicine.medicineName}</strong>?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedMedicine(null);
                                }}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyDashboard;
