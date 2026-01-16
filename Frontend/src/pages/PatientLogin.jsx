import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react'; // Icon for patient portal

const PatientLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 🛑 Calls the correct Patient API endpoint 🛑
      const res = await api.post('/patient/login', formData); 
      
      // Save token and user data
      localStorage.setItem('token', res.data.token);
      
      // Ensure the role is explicitly set for ProtectedRoute
      const userData = { ...res.data.patient, role: 'patient' };
      localStorage.setItem('user', JSON.stringify(userData));

      alert('Patient Login Successful!');
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials or server error.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:shadow-3xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg">
            <HeartPulse className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-3 text-center text-red-600">Patient Login</h2>
        <p className="text-center text-gray-500 mb-8">Access your records and connect with a doctor.</p>

        <form onSubmit={handleSubmit}>
          {error && <p className="bg-red-100 text-red-700 text-center py-2 px-4 rounded-xl mb-4 border border-red-200">{error}</p>}
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full input-field form-focus"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full input-field form-focus"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 btn-danger btn-ripple font-bold text-lg"
          >
            Sign In
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
            Need an account? 
            <Link to="/patient/register" className="text-red-600 hover:text-red-800 font-bold ml-1 transition duration-200">
                Register Here
            </Link>
        </p>
      </div>
    </div>
  );
};

export default PatientLogin;
