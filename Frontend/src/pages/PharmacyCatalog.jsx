import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, MapPin, ShoppingBag, Loader2, CheckCircle, 
    AlertCircle, FileText, ClipboardList, X, Truck, Home 
} from 'lucide-react';

const PharmacyCatalog = () => {
    // --- STATE MANAGEMENT ---
    const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'orders'
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]); 
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Delivery State
    const [deliveryMode, setDeliveryMode] = useState('Pickup'); // 'Pickup' or 'Delivery'
    const [deliveryAddress, setDeliveryAddress] = useState('');

    const token = localStorage.getItem('token');

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchMedicines();
        fetchOrders();
        fetchPrescriptions();
    }, []);

    // --- API CALLS ---
    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/patient/medicines', {
                headers: { 'auth-token': token }
            });
            setMedicines(res.data);
        } catch (err) {
            console.error("Error fetching medicines", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/patient/orders', {
                headers: { 'auth-token': token }
            });
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders", err);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/patient/medical-history', {
                headers: { 'auth-token': token }
            });
            // Only keep appointments that have a prescription
            const validPrescriptions = res.data.filter(apt => apt.prescription && apt.prescription.trim() !== '');
            setPrescriptions(validPrescriptions);
        } catch (err) {
            console.error("Error fetching prescriptions", err);
        }
    };

    // --- HANDLERS ---

    const initiateReservation = (medicine) => {
        setSelectedMedicine(medicine);
        setSelectedPrescription(null); 
        setDeliveryMode('Pickup');
        setDeliveryAddress('');
        setShowModal(true);
    };

    const handleConfirmReservation = async () => {
        if (!selectedMedicine) return;
        
        // Validation: If delivery is selected, address is required
        if (deliveryMode === 'Delivery' && !deliveryAddress.trim()) {
            alert("Please enter a delivery address.");
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            // Prepare the payload exactly as the Backend expects
            const payload = {
                pharmacyId: selectedMedicine.pharmacyId._id || selectedMedicine.pharmacyId,
                medicineId: selectedMedicine._id,
                medicineName: selectedMedicine.medicineName || selectedMedicine.name,
                price: selectedMedicine.price,
                
                // 1. Prescription Logic
                prescription: selectedPrescription ? selectedPrescription.prescription : 'No prescription attached',
                appointmentId: selectedPrescription ? selectedPrescription._id : null,
                
                // 2. Delivery Logic
                fulfillmentType: deliveryMode, // 'Pickup' or 'Delivery'
                deliveryAddress: deliveryMode === 'Delivery' ? deliveryAddress : ''
            };

            await axios.post('http://localhost:5000/api/patient/reserve-medicine', payload, {
                headers: { 'auth-token': token }
            });

            setSuccessMsg(`Success! Order placed for ${payload.medicineName}`);
            setTimeout(() => setSuccessMsg(''), 4000);
            
            fetchOrders(); 
            setShowModal(false);
            
        } catch (err) {
            setErrorMsg('Failed to place order. Please try again.');
        } finally {
            setSubmitting(false);
            setSelectedMedicine(null);
        }
    };

    // --- FILTER LOGIC ---
    const filteredMedicines = medicines.filter(med => {
        const nameMatch = (med.medicineName || med.name).toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'All' || med.category === selectedCategory;
        return nameMatch && categoryMatch;
    });

    const categories = ['All', 'General', 'Painkillers', 'Antibiotics', 'Supplements'];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header Section */}
            <div className="bg-navy-900 text-white p-8 pb-24 relative overflow-hidden" style={{ backgroundColor: '#1a365d' }}>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Pharmacy Services</h1>
                    <p className="text-blue-100 text-lg">Browse medicines, attach prescriptions, and choose Home Delivery.</p>
                    
                    {/* Search Bar */}
                    <div className="mt-8 flex gap-2 max-w-2xl bg-white p-2 rounded-xl shadow-lg">
                        <Search className="text-gray-400 w-6 h-6 ml-2 self-center" />
                        <input 
                            type="text" 
                            placeholder="Search medicines..." 
                            className="flex-1 p-2 outline-none text-gray-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
                {/* Tabs */}
                <div className="flex space-x-4 mb-6">
                    <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-lg transition-all ${activeTab === 'catalog' ? 'bg-white text-navy-900 shadow-t-lg' : 'bg-white/50 text-white hover:bg-white/80'}`}>
                        <ShoppingBag className="w-5 h-5" /> Catalog
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-lg transition-all ${activeTab === 'orders' ? 'bg-white text-navy-900 shadow-t-lg' : 'bg-white/50 text-white hover:bg-white/80'}`}>
                        <ClipboardList className="w-5 h-5" /> My Orders
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl min-h-[500px] p-6">
                    {successMsg && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center animate-bounce"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}
                    {errorMsg && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> {errorMsg}</div>}

                    {/* === TAB 1: CATALOG === */}
                    {activeTab === 'catalog' && (
                        <>
                            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
                                ))}
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredMedicines.length > 0 ? filteredMedicines.map((med) => (
                                        <div key={med._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                                            <div className="h-40 bg-gray-50 flex items-center justify-center relative">
                                                <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-600 border border-gray-200">
                                                    {med.stock > 0 ? `${med.stock} Left` : 'Out of Stock'}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-800 mb-1">{med.medicineName || med.name}</h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {med.pharmacyId?.name || 'Pharmacy'}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xl font-bold text-navy-900">₹{med.price}</span>
                                                    <button onClick={() => initiateReservation(med)} disabled={med.stock === 0} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${med.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}>
                                                        {med.stock === 0 ? 'Sold Out' : 'Order'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full text-center py-20 text-gray-400"><ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>No medicines found.</p></div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* === TAB 2: MY ORDERS === */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Orders</h2>
                            {orders.length === 0 ? (
                                <div className="text-center py-20 text-gray-400"><ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>No orders yet.</p></div>
                            ) : (
                                orders.map(order => (
                                    <div key={order._id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4 mb-4 md:mb-0 w-full">
                                            <div className="p-3 bg-blue-50 rounded-lg"><ShoppingBag className="w-6 h-6 text-blue-600" /></div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{order.medicineName}</h3>
                                                <p className="text-sm text-gray-500">From: {order.pharmacyId?.name}</p>
                                                {/* Delivery Badge in History */}
                                                {order.fulfillmentType === 'Delivery' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded mt-1 font-semibold">
                                                        <Truck className="w-3 h-3" /> Delivery
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded mt-1 font-semibold">
                                                        <ShoppingBag className="w-3 h-3" /> Pickup
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Price</p>
                                                <p className="font-bold text-lg text-navy-900">₹{order.price}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg font-bold text-sm ${order.status === 'Ready' ? 'bg-green-100 text-green-700' : order.status === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* === ORDER CONFIRMATION MODAL === */}
            {showModal && selectedMedicine && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Confirm Order</h3>
                                <p className="text-sm text-gray-500">{selectedMedicine.medicineName}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                            
                            {/* 1. Delivery Option Toggle */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">1. Delivery Method</h4>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${deliveryMode === 'Pickup' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="delivery" className="hidden" checked={deliveryMode === 'Pickup'} onChange={() => setDeliveryMode('Pickup')} />
                                        <Home className="w-6 h-6" />
                                        <span className="font-bold text-sm">Self Pickup</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${deliveryMode === 'Delivery' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="delivery" className="hidden" checked={deliveryMode === 'Delivery'} onChange={() => setDeliveryMode('Delivery')} />
                                        <Truck className="w-6 h-6" />
                                        <span className="font-bold text-sm">Home Delivery</span>
                                    </label>
                                </div>

                                {/* Address Input (Only if Delivery is selected) */}
                                {deliveryMode === 'Delivery' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                                        <textarea 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            rows="2"
                                            placeholder="Enter your full address..."
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                        ></textarea>
                                    </div>
                                )}
                            </div>

                            {/* 2. Prescription Selection */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">2. Attach Prescription (Optional)</h4>
                                {prescriptions.length === 0 ? (
                                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-dashed text-center">
                                        No prescriptions available.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        {prescriptions.map(apt => (
                                            <div key={apt._id} onClick={() => setSelectedPrescription(apt)}
                                                className={`p-3 rounded-lg border cursor-pointer text-sm transition-all ${selectedPrescription?._id === apt._id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-200'}`}>
                                                <div className="flex justify-between font-medium text-gray-700">
                                                    <span>Dr. {apt.doctorId?.name}</span>
                                                    <span className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{apt.prescription}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleConfirmReservation} disabled={submitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-navy-900 hover:bg-navy-800 shadow-lg" style={{ backgroundColor: '#1a365d' }}>
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Confirm ₹${selectedMedicine.price}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyCatalog;