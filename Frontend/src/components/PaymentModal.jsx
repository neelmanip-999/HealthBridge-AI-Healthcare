import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

const PaymentModal = ({ doctor, date, time, price, onClose, onConfirm }) => {
  const [step, setStep] = useState('input'); // input | processing | success
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // 1. Simulate the Payment Process
  const handlePayment = () => {
    setStep('processing');
    
    // Fake server delay (3 seconds) to make it feel real
    setTimeout(() => {
        setStep('success');
        
        // Close and Book Appointment after success message
        setTimeout(() => {
            onConfirm();
        }, 2000);
    }, 3000);
  };

  // Format helpers for realistic input
  const handleCardInput = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(val);
  };

  const handleExpiryInput = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if(val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
    setExpiry(val);
  };

  // --- RENDER SUCCESS STATE ---
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center scale-100 animate-in zoom-in duration-300">
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-14 h-14 text-green-600 animate-bounce" />
           </div>
           <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Successful!</h3>
           <p className="text-gray-500 font-medium">Transaction ID: #txn_{Math.floor(Math.random() * 1000000)}</p>
           <p className="text-sm text-gray-400 mt-6">Redirecting to booking confirmation...</p>
        </div>
      </div>
    );
  }

  // --- RENDER INPUT FORM ---
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Secure Checkout</h3>
                    <p className="text-xs text-gray-400">HealthBridge Trusted Payment</p>
                </div>
            </div>
            <button onClick={onClose} disabled={step === 'processing'} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
            {/* Amount Display */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total to Pay</p>
                    <p className="text-4xl font-extrabold text-gray-900">${price}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block mb-1">
                        TEST MODE
                    </p>
                </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Card Number</label>
                    <div className="relative group">
                        <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            value={cardNumber}
                            onChange={handleCardInput}
                            placeholder="0000 0000 0000 0000"
                            maxLength="19"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-lg text-gray-800 placeholder-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</label>
                        <input 
                            type="text" 
                            value={expiry}
                            onChange={handleExpiryInput}
                            placeholder="MM/YY"
                            maxLength="5"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-center text-lg text-gray-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CVV</label>
                        <input 
                            type="password" 
                            placeholder="123"
                            maxLength="3"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-center text-lg text-gray-800"
                        />
                    </div>
                </div>
            </div>

            {/* Pay Button */}
            <button 
                onClick={handlePayment}
                disabled={step === 'processing' || cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3}
                className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-xl font-bold text-lg shadow-xl shadow-gray-200 transform hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
            >
                {step === 'processing' ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" /> 
                        Processing Payment...
                    </>
                ) : (
                    <>
                        <Lock className="w-5 h-5" /> 
                        Pay Securely
                    </>
                )}
            </button>
            
            <p className="text-[10px] text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> 
                128-bit SSL Encrypted Connection
            </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;