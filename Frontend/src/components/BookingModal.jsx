import React, { useState, useEffect } from 'react';
import { 
    X, 
    Calendar, 
    Clock, 
    CreditCard, 
    CheckCircle, 
    AlertCircle,
    Loader2 
} from 'lucide-react';
import api, { bookAppointment, confirmPayment } from '../services/api'; // Ensure 'api' is imported for the custom GET call

const BookingModal = ({ doctor, onClose }) => {
    const [step, setStep] = useState(1); // 1: Select Time, 2: Payment, 3: Success
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appointmentData, setAppointmentData] = useState(null); // Stores booking ID from backend

    // --- NEW: AVAILABILITY STATE ---
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Standard Time Slots
    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", 
        "12:00 PM", "02:00 PM", "03:00 PM", 
        "04:00 PM", "05:00 PM", "06:00 PM"
    ];

    // --- 1. FETCH BOOKED SLOTS WHEN DATE CHANGES ---
    useEffect(() => {
        if (selectedDate && doctor._id) {
            const fetchBookedSlots = async () => {
                setLoadingSlots(true);
                try {
                    // Call the new backend route we created
                    const res = await api.get('/appointments/booked-slots', {
                        params: { doctorId: doctor._id, date: selectedDate }
                    });
                    setBookedSlots(res.data); // Expecting array e.g., ["10:00 AM", "02:00 PM"]
                } catch (err) {
                    console.error("Error fetching slots", err);
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchBookedSlots();
        } else {
            setBookedSlots([]); // Reset if no date
        }
    }, [selectedDate, doctor._id]);

    // STEP 1: Create Initial Appointment (Pending Payment)
    const handleProceedToPay = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Please select both a date and time.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Call backend to initialize appointment
            const res = await bookAppointment({
                doctorId: doctor._id,
                date: selectedDate,
                timeSlot: selectedTime
            });

            setAppointmentData(res.data.appointment); // Save the ID for the next step
            setStep(2); // Move to Payment Screen
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book slot');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Simulate Payment & Confirm
    const handlePayment = async () => {
        try {
            setLoading(true);
            
            // Simulate a delay like a real payment gateway
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Call backend to confirm payment
            await confirmPayment({
                appointmentId: appointmentData._id,
                paymentId: `PAY_${Math.floor(Math.random() * 1000000)}` // Mock Payment ID
            });

            setStep(3); // Move to Success Screen
        } catch (err) {
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Book Appointment</h2>
                        <p className="text-green-100 text-sm">with Dr. {doctor.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* --- STEP 1: SELECT DATE & TIME --- */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Date Picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-green-600" />
                                    Select Date
                                </label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime(''); // Reset time if date changes
                                    }}
                                />
                            </div>

                            {/* Time Slots */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    Select Time Slot
                                    {loadingSlots && <Loader2 className="h-3 w-3 animate-spin ml-2 text-green-500"/>}
                                </label>
                                
                                {!selectedDate ? (
                                    <p className="text-sm text-gray-400 italic">Please select a date first to check availability.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {timeSlots.map((slot) => {
                                            // --- LOCK LOGIC ---
                                            const isTaken = bookedSlots.includes(slot);
                                            const isSelected = selectedTime === slot;

                                            return (
                                                <button
                                                    key={slot}
                                                    disabled={isTaken} // Disable logic
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`
                                                        py-2 px-3 text-sm rounded-lg border transition-all
                                                        ${isTaken 
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through opacity-60' // Taken Style
                                                            : isSelected 
                                                                ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' // Selected Style
                                                                : 'border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50' // Default Style
                                                        }
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {selectedDate && bookedSlots.length > 0 && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3"/> Some slots are already booked.
                                    </p>
                                )}
                            </div>

                            {/* Footer Price */}
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Consultation Fee</p>
                                    <p className="text-xl font-bold text-gray-900">${doctor.fees}</p>
                                </div>
                                <button 
                                    onClick={handleProceedToPay}
                                    disabled={loading || !selectedTime}
                                    className="bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : 'Proceed to Pay'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: PAYMENT SUMMARY --- */}
                    {step === 2 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <h3 className="text-gray-900 font-bold text-lg mb-1">Confirm Booking</h3>
                                <p className="text-gray-500 text-sm">Review your appointment details</p>
                                
                                <div className="mt-4 space-y-3 text-left">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Doctor</span>
                                        <span className="font-semibold text-gray-900">Dr. {doctor.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Date</span>
                                        <span className="font-semibold text-gray-900">{selectedDate}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Time</span>
                                        <span className="font-semibold text-gray-900">{selectedTime}</span>
                                    </div>
                                    <div className="h-px bg-green-200 my-2"></div>
                                    <div className="flex justify-between text-lg font-bold text-green-700">
                                        <span>Total</span>
                                        <span>${doctor.fees}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span>Processing Payment...</span>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Pay Securely
                                    </>
                                )}
                            </button>
                            
                            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800 underline">
                                Back to Selection
                            </button>
                        </div>
                    )}

                    {/* --- STEP 3: SUCCESS --- */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                            <p className="text-gray-500 mb-8">
                                You have successfully booked an appointment with Dr. {doctor.name} on {selectedDate} at {selectedTime}.
                            </p>
                            
                            <button 
                                onClick={onClose}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BookingModal;