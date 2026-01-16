import React, { useState, useEffect } from 'react';
import { 
    X, 
    Calendar, 
    Clock, 
    AlertCircle,
    Loader2 
} from 'lucide-react';
import api, { bookAppointment, confirmPayment } from '../services/api'; 
import PaymentModal from './PaymentModal'; // <--- IMPORT THE SIMULATOR

const BookingModal = ({ doctor, onClose }) => {
    const [step, setStep] = useState(1); // 1: Select, 2: Payment Simulator, 3: Success
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Stores the booking ID created in Step 1, needed for confirmation in Step 2
    const [appointmentData, setAppointmentData] = useState(null); 

    // --- AVAILABILITY STATE ---
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", 
        "12:00 PM", "02:00 PM", "03:00 PM", 
        "04:00 PM", "05:00 PM", "06:00 PM"
    ];

    // --- 1. FETCH BOOKED SLOTS ---
    useEffect(() => {
        if (selectedDate && doctor._id) {
            const fetchBookedSlots = async () => {
                setLoadingSlots(true);
                try {
                    const res = await api.get('/appointments/booked-slots', {
                        params: { doctorId: doctor._id, date: selectedDate }
                    });
                    setBookedSlots(res.data); 
                } catch (err) {
                    console.error("Error fetching slots", err);
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchBookedSlots();
        } else {
            setBookedSlots([]); 
        }
    }, [selectedDate, doctor._id]);

    // --- STEP 1: CREATE PENDING APPOINTMENT ---
    const handleProceedToPayment = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Please select both a date and time.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // 1. Create the appointment in DB with status "pending"
            const res = await bookAppointment({
                doctorId: doctor._id,
                date: selectedDate,
                timeSlot: selectedTime
            });

            // 2. Save the ID so we can confirm it after payment
            setAppointmentData(res.data.appointment); 
            
            // 3. Open the Payment Simulator
            setStep(2); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book slot');
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: HANDLE SUCCESS FROM SIMULATOR ---
    // This function is passed to PaymentModal and called when the spinner finishes
    const handlePaymentSuccess = async () => {
        try {
            setLoading(true);

            // 1. Tell Backend: "User paid, mark appointment as scheduled"
            await confirmPayment({
                appointmentId: appointmentData._id,
                paymentId: `PAY_${Math.floor(Math.random() * 1000000)}` // Mock ID
            });

            // 2. Show Final Success Screen
            setStep(3); 
        } catch (err) {
            setError('Payment confirmation failed. Please contact support.');
            setStep(1); // Go back if error
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    
    // IF STEP 2: Render the Full Screen Payment Simulator
    if (step === 2) {
        return (
            <PaymentModal 
                doctor={doctor}
                date={selectedDate}
                time={selectedTime}
                price={doctor.fees}
                onClose={() => setStep(1)} // Go back to selection if closed
                onConfirm={handlePaymentSuccess} // Trigger DB update on success
            />
        );
    }

    // NORMAL MODAL (Step 1 & 3)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-linear-to-r from-green-600 to-teal-600 p-6 flex justify-between items-center text-white shrink-0">
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
                    
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* --- STEP 1: SELECTION --- */}
                    {step === 1 && (
                        <div className="space-y-6">
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
                                        setSelectedTime('');
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    Select Time Slot
                                    {loadingSlots && <Loader2 className="h-3 w-3 animate-spin ml-2 text-green-500"/>}
                                </label>
                                
                                {!selectedDate ? (
                                    <p className="text-sm text-gray-400 italic">Please select a date first.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {timeSlots.map((slot) => {
                                            const isTaken = bookedSlots.includes(slot);
                                            const isSelected = selectedTime === slot;

                                            return (
                                                <button
                                                    key={slot}
                                                    disabled={isTaken}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`
                                                        py-2 px-3 text-sm rounded-lg border transition-all
                                                        ${isTaken 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60' 
                                                            : isSelected 
                                                                ? 'bg-green-600 text-white border-green-600 shadow-md scale-105' 
                                                                : 'border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50'
                                                        }
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Consultation Fee</p>
                                    <p className="text-xl font-bold text-gray-900">${doctor.fees}</p>
                                </div>
                                <button 
                                    onClick={handleProceedToPayment}
                                    disabled={loading || !selectedTime}
                                    className="bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Proceed to Pay
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: SUCCESS --- */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                             {/* Note: The PaymentModal handles the 'Success Tick' animation. 
                                 This is the final confirmation screen after the modal closes. */}
                             <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                             <p className="text-gray-500 mb-8">
                                 Your appointment with Dr. {doctor.name} is scheduled for {selectedDate} at {selectedTime}.
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