import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { 
    Pill, LogOut, Package, Plus, Edit, Trash2, AlertTriangle, 
    Search, X, Save, Loader2, Calendar, DollarSign, RefreshCw,
    ClipboardList, CheckCircle, Clock, MapPin, FileText, User, 
    Truck // --- NEW: Added Truck Icon
} from 'lucide-react';

const PharmacyDashboard = () => {
    const navigate = useNavigate();
    const [pharmacy] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    
    // Tabs & Data State
    const [activeTab, setActiveTab] = useState('inventory');
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    
    // Prescription Modal State
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [formData, setFormData] = useState({
        medicineName: '',
        stock: '',
        price: '',
        expiryDate: ''
    });

    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000/api/pharmacy';

    useEffect(() => {
        if (!token) {
            navigate('/pharmacy/login');
        } else {
            fetchMedicines();
            fetchOrders();
        }
    }, [token]);

    // --- API FUNCTIONS ---

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/inventory`, { headers: { 'auth-token': token } });
            setMedicines(Array.isArray(res.data) ? res.data : res.data.medicines || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const addMedicineCall = async (data) => {
        return await axios.post(`${API_URL}/add`, data, { headers: { 'auth-token': token } });
    };

    const updateMedicineCall = async (id, data) => {
        return await axios.put(`${API_URL}/update/${id}`, data, { headers: { 'auth-token': token } });
    };

    const deleteMedicineCall = async (id) => {
        return await axios.delete(`${API_URL}/delete/${id}`, { headers: { 'auth-token': token } });
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders`, { headers: { 'auth-token': token } });
            setOrders(res.data);
        } catch (err) {
            console.error("Order Fetch Error:", err);
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await axios.put(`${API_URL}/orders/${orderId}/status`, { status }, { headers: { 'auth-token': token } });
            fetchOrders(); 
        } catch (err) {
            setError('Failed to update order status');
        }
    };

    // --- HANDLERS ---

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleAddClick = (e) => {
        e?.preventDefault?.();
        setFormData({ medicineName: '', stock: '', price: '', expiryDate: '' });
        setShowAddModal(true);
        setShowEditModal(false);
        setError('');
    };

    const handleEditClick = (medicine) => {
        if (medicine.pharmacyId && medicine.pharmacyId !== pharmacy.id) {
             if(medicine.pharmacistName !== pharmacy.name) { setError('You can only edit your own medicines.'); return; }
        }
        setSelectedMedicine(medicine);
        setFormData({
            medicineName: medicine.medicineName || medicine.name || '',
            stock: medicine.stock || '',
            price: medicine.price || '',
            expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (medicine) => {
        setSelectedMedicine(medicine);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const data = {
            medicineName: formData.medicineName,
            stock: parseInt(formData.stock),
            price: parseFloat(formData.price),
            expiryDate: new Date(formData.expiryDate)
        };

        try {
            if (showEditModal && selectedMedicine) {
                await updateMedicineCall(selectedMedicine._id, data);
            } else {
                await addMedicineCall(data);
            }
            await fetchMedicines();
            setShowAddModal(false);
            setShowEditModal(false);
        } catch (err) {
            console.error("Submit Error:", err);
            setError('Failed to save medicine.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMedicine) return;
        setSubmitting(true);
        try {
            await deleteMedicineCall(selectedMedicine._id);
            await fetchMedicines();
            setShowDeleteModal(false);
        } catch (err) {
            setError('Failed to delete medicine');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper functions
    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { status: 'expired', color: 'text-red-600 bg-red-100 border-red-200' };
        if (diffDays <= 30) return { status: 'expiring', color: 'text-yellow-600 bg-yellow-100 border-yellow-200' };
        return { status: 'good', color: 'text-green-600 bg-green-100 border-green-200' };
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-100 border-red-200' };
        if (stock <= 10) return { status: 'low', color: 'text-yellow-600 bg-yellow-100 border-yellow-200' };
        return { status: 'good', color: 'text-green-600 bg-green-100 border-green-200' };
    };

    const filteredMedicines = medicines.filter(medicine => {
        const searchLower = searchTerm.toLowerCase();
        const name = medicine.medicineName || medicine.name || '';
        return name.toLowerCase().includes(searchLower);
    });

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
        <div className="min-h-screen bg-linear-to-br from-yellow-50 via-amber-50 to-orange-50 p-6 md:p-10 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
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
                
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-white text-yellow-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                        Orders 
                        {orders.filter(o => o.status === 'Pending').length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{orders.filter(o => o.status === 'Pending').length}</span>
                        )}
                    </button>
                </div>

                <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">{pharmacy?.name || 'Pharmacy'}</span>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="relative z-10">
                {error && <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5"/><span>{error}</span></div><button onClick={() => setError('')} className="text-red-600 hover:text-red-800"><X className="w-5 h-5"/></button></div>}

                {/* --- VIEW: INVENTORY --- */}
                {activeTab === 'inventory' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100">
                                <p className="text-sm text-gray-600">Total Medicines</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.total}</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100">
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-3xl font-bold text-red-600">{stats.lowStock}</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100">
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-yellow-100">
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-3xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-yellow-100">
                            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-xl"><Package className="w-5 h-5 text-yellow-600" /></div>
                                    Inventory
                                </h2>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                                    </div>
                                    <button onClick={handleAddClick} className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2 font-semibold">
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMedicines.map((medicine) => {
                                            const isOwn = (medicine.pharmacyId === pharmacy.id) || (medicine.pharmacistName === pharmacy.name);
                                            return (
                                                <tr key={medicine._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-4 px-4 font-medium">
                                                        {medicine.medicineName || medicine.name}
                                                        {isOwn && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Mine</span>}
                                                    </td>
                                                    <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStockStatus(medicine.stock).color}`}>{medicine.stock}</span></td>
                                                    <td className="py-4 px-4">${medicine.price?.toFixed(2)}</td>
                                                    <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs ${getExpiryStatus(medicine.expiryDate).color}`}>{new Date(medicine.expiryDate).toLocaleDateString()}</span></td>
                                                    <td className="py-4 px-4 flex gap-2">
                                                        <button onClick={() => handleEditClick(medicine)} className={`p-2 rounded ${isOwn ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300'}`}><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteClick(medicine)} className={`p-2 rounded ${isOwn ? 'text-red-600 hover:bg-red-50' : 'text-gray-300'}`}><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- VIEW: ORDERS --- */}
                {activeTab === 'orders' && (
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-yellow-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl"><ClipboardList className="w-5 h-5 text-orange-600" /></div>
                                Patient Reservations
                            </h2>
                            <button onClick={fetchOrders} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-20">
                                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No active orders found.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {orders.map(order => (
                                    <div key={order._id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-start gap-4 w-full">
                                            <div className="p-3 bg-blue-50 rounded-full text-blue-600 font-bold text-lg">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{order.medicineName}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 mb-2">
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Patient: {order.patientId?.name || 'Unknown'}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.orderDate).toLocaleDateString()}</span>
                                                </div>

                                                {/* --- NEW: DELIVERY ADDRESS BADGE --- */}
                                                {order.fulfillmentType === 'Delivery' && (
                                                    <div className="bg-orange-50 text-orange-800 p-2 rounded-lg border border-orange-100 flex items-start gap-2 max-w-sm">
                                                        <Truck className="w-5 h-5 mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-bold text-xs uppercase block">Deliver To:</span>
                                                            <span className="text-sm">{order.deliveryAddress || 'Address not provided'}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Prescription Button */}
                                                {order.prescription && order.prescription !== 'No prescription attached' && (
                                                    <button 
                                                        onClick={() => { setSelectedOrder(order); setShowPrescriptionModal(true); }}
                                                        className="mt-2 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 flex items-center gap-1 hover:bg-blue-100 transition"
                                                    >
                                                        <FileText className="w-3 h-3" /> View Prescription
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
                                                <p className="text-xl font-bold text-green-600">${order.price}</p>
                                            </div>
                                            
                                            {order.status === 'Pending' && (
                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'Ready')} className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2">
                                                    Mark Ready
                                                </button>
                                            )}
                                            {order.status === 'Ready' && (
                                                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Ready for Pickup
                                                </span>
                                            )}
                                            {order.status === 'Completed' && (
                                                <span className="text-gray-400 font-medium">Completed</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- Prescription Viewing Modal --- */}
            {showPrescriptionModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in duration-200">
                        <button onClick={() => setShowPrescriptionModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="text-blue-600"/> Patient Prescription</h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap font-mono text-sm max-h-[60vh] overflow-y-auto">
                            {selectedOrder.prescription}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowPrescriptionModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
             {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); }}}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between mb-6">
                            <h3 className="text-2xl font-bold">{showEditModal ? 'Edit' : 'Add'} Medicine</h3>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Medicine Name</label><input type="text" placeholder="e.g. Paracetamol" required value={formData.medicineName} onChange={e => setFormData({...formData, medicineName: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" placeholder="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Price</label><input type="number" step="0.01" placeholder="0.00" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Expiry Date</label><input type="date" required value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                            <button type="submit" disabled={submitting} className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold">{submitting ? <Loader2 className="animate-spin mx-auto"/> : 'Save Medicine'}</button>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-2">Delete Medicine?</h3>
                        <p className="text-gray-600 mb-6">This cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyDashboard;