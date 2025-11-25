import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ShoppingBag, Filter, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PharmacyCatalog = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Reservation State
    const [reserving, setReserving] = useState(null); // ID of medicine being reserved
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchMedicines();
    }, []);

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

    const handleReserve = async (medicine) => {
        try {
            setReserving(medicine._id);
            setErrorMsg('');
            
            await axios.post('http://localhost:5000/api/patient/reserve-medicine', {
                pharmacyId: medicine.pharmacyId._id || medicine.pharmacyId, // Handle populated or unpopulated ID
                medicineId: medicine._id,
                medicineName: medicine.medicineName || medicine.name,
                price: medicine.price
            }, {
                headers: { 'auth-token': token }
            });

            setSuccessMsg(`Successfully reserved ${medicine.medicineName || medicine.name}! Check your dashboard.`);
            setTimeout(() => setSuccessMsg(''), 4000); // Clear message after 4s
            
        } catch (err) {
            setErrorMsg('Failed to reserve medicine. Please try again.');
        } finally {
            setReserving(null);
        }
    };

    // Filter Logic
    const filteredMedicines = medicines.filter(med => {
        const nameMatch = (med.medicineName || med.name).toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'All' || med.category === selectedCategory;
        return nameMatch && categoryMatch;
    });

    const categories = ['All', 'General', 'Painkillers', 'Antibiotics', 'Supplements'];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header Section */}
            <div className="bg-navy-900 text-white p-8 pb-16 relative overflow-hidden" style={{ backgroundColor: '#1a365d' }}>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Pharmacy Catalog</h1>
                    <p className="text-blue-100 text-lg">Find medicines near you and reserve for pickup.</p>
                    
                    {/* Search Bar */}
                    <div className="mt-8 flex gap-2 max-w-2xl bg-white p-2 rounded-xl shadow-lg">
                        <Search className="text-gray-400 w-6 h-6 ml-2 self-center" />
                        <input 
                            type="text" 
                            placeholder="Search for medicines (e.g. Paracetamol)..." 
                            className="flex-1 p-2 outline-none text-gray-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition">
                            Search
                        </button>
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-800 rounded-full opacity-50 mix-blend-multiply filter blur-xl"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
                {/* Success/Error Toast */}
                {successMsg && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center shadow-lg animate-bounce">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center shadow-lg">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {errorMsg}
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                selectedCategory === cat 
                                ? 'bg-orange-500 text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    /* Medicine Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredMedicines.length > 0 ? filteredMedicines.map((med) => (
                            <div key={med._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                                {/* Image Placeholder */}
                                <div className="h-40 bg-gray-100 flex items-center justify-center relative group-hover:bg-blue-50 transition-colors">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-600">
                                        {med.stock > 0 ? `${med.stock} in stock` : 'Out of Stock'}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{med.medicineName || med.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {med.pharmacyId?.name || 'Local Pharmacy'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-2xl font-bold text-navy-900">₹{med.price}</span>
                                        <button 
                                            onClick={() => handleReserve(med)}
                                            disabled={reserving === med._id || med.stock === 0}
                                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                                                med.stock === 0 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : reserving === med._id
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                            }`}
                                        >
                                            {reserving === med._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                med.stock === 0 ? 'Unavailable' : 'Reserve'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-20">
                                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">No medicines found</h3>
                                <p className="text-gray-500">Try adjusting your search terms</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacyCatalog;