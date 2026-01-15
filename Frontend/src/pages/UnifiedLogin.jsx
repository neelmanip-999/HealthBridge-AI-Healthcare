import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Heart, Pill, Building2 } from 'lucide-react';

const UnifiedLogin = () => {
  const [userType, setUserType] = useState('patient'); // Default selection
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Define user types with their properties
  const userTypes = {
    doctor: {
      title: 'Doctor Portal',
      description: 'Access your professional dashboard and manage patient consultations',
      icon: Stethoscope,
      color: 'indigo',
      endpoint: '/doctor/login',
      redirectPath: '/doctor/dashboard',
      dataKey: 'doctor',
      bgGradient: 'from-indigo-50 via-blue-50 to-purple-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
    patient: {
      title: 'Patient Portal',
      description: 'Find specialists, view real-time status, and start secure consultations',
      icon: Heart,
      color: 'green',
      endpoint: '/patient/login',
      redirectPath: '/patient/dashboard',
      dataKey: 'patient',
      bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    pharmacy: {
      title: 'Pharmacy Portal',
      description: 'Manage drug inventory, stock levels, pricing, and expiry dates',
      icon: Pill,
      color: 'yellow',
      endpoint: '/pharmacy/login',
      redirectPath: '/pharmacy/dashboard',
      dataKey: 'pharmacy',
      bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    hospital: {
      title: 'Hospital Portal',
      description: 'Register your hospital, manage details, and reach patients on the map',
      icon: Building2,
      color: 'blue',
      endpoint: '/hospital-auth/login',
      redirectPath: '/hospital/dashboard',
      dataKey: 'hospital',
      bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const currentType = userTypes[userType];
  const CurrentIcon = currentType.icon;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post(currentType.endpoint, formData);
      
      // Use the dataKey from userTypes to get the correct user object
      const userObj = { ...res.data[currentType.dataKey], role: userType };

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userObj));

      alert('Login Successful!');
      navigate(currentType.redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentType.bgGradient} flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative z-10 animate-fadeInUp">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${currentType.iconBg} rounded-2xl mb-4 animate-bounce transition-all duration-300`}>
            <CurrentIcon className={`h-8 w-8 ${currentType.iconColor} transition-all duration-300`} />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-800 mb-2">{currentType.title}</h2>
          <p className="text-gray-500 text-center text-sm">{currentType.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="userType">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Login As
              </span>
            </label>
            <div className="relative">
              <select
                id="userType"
                value={userType}
                onChange={handleUserTypeChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 appearance-none pr-10 cursor-pointer font-bold text-white shadow-lg
                  ${userType === 'doctor' && 'bg-blue-500 border-blue-600 focus:border-blue-700 hover:bg-blue-600'}
                  ${userType === 'patient' && 'bg-green-500 border-green-600 focus:border-green-700 hover:bg-green-600'}
                  ${userType === 'pharmacy' && 'bg-amber-400 border-amber-500 focus:border-amber-600 hover:bg-amber-500 text-black'}
                  ${userType === 'hospital' && 'bg-red-500 border-red-600 focus:border-red-700 hover:bg-red-600'}
                  hover:shadow-xl transform hover:scale-[1.01]`}
              >
                <option value="patient" className="bg-white text-black font-semibold">👤 Patient</option>
                <option value="doctor" className="bg-white text-black font-semibold">👨‍⚕️ Doctor</option>
                <option value="pharmacy" className="bg-white text-black font-semibold">💊 Pharmacy</option>
                <option value="hospital" className="bg-white text-black font-semibold">🏥 Hospital</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-center border border-red-200 animate-slideInRight">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-all duration-300 form-focus"
              placeholder="Enter your email address"
              required
            />
          </div>
          
          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-all duration-300 form-focus"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${currentType.buttonColor} text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              <>
                Login
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link
                to={`/${userType}/register`}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200"
              >
                Register here
              </Link>
            </p>
          </div>

          {/* Back to Home Link */}
          <div className="text-center">
            <Link
              to="/"
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedLogin;
