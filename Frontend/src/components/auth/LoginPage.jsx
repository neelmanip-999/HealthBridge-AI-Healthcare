import React, { useState, useContext } from 'react';
import { login as apiLogin, register as apiRegister } from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';

const initialReg = { name:'', email:'', password:'', phone:'', role:'patient' };

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ email:'', password:'', role:'patient' });
  const [regData, setRegData] = useState(initialReg);
  const { loginLocal } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiLogin(loginData);
      loginLocal({ _id: res._id, name: res.name, email: res.email, role: res.role }, res.token);
      window.location.href = '/';
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRegister(regData);
      loginLocal({ _id: res._id, name: res.name, email: res.email, role: res.role }, res.token);
      window.location.href = '/';
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 rounded shadow">
        <div className="flex space-x-4 mb-4">
          <button className={`px-4 py-2 ${tab==='login'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('login')}>Login</button>
          <button className={`px-4 py-2 ${tab==='register'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('register')}>Register</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="mb-2">
              <label className="block">Role</label>
              <select value={loginData.role} onChange={(e)=>setLoginData({...loginData, role: e.target.value})} className="w-full p-2 border rounded">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block">Email</label>
              <input required value={loginData.email} onChange={(e)=>setLoginData({...loginData, email: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div className="mb-2">
              <label className="block">Password</label>
              <input type="password" required value={loginData.password} onChange={(e)=>setLoginData({...loginData, password: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-2">
              <label className="block">Role</label>
              <select value={regData.role} onChange={(e)=>setRegData({...regData, role: e.target.value})} className="w-full p-2 border rounded">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block">Name</label>
              <input required value={regData.name} onChange={(e)=>setRegData({...regData, name: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div className="mb-2">
              <label className="block">Email</label>
              <input required value={regData.email} onChange={(e)=>setRegData({...regData, email: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div className="mb-2">
              <label className="block">Phone</label>
              <input required value={regData.phone} onChange={(e)=>setRegData({...regData, phone: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div className="mb-2">
              <label className="block">Password</label>
              <input required type="password" value={regData.password} onChange={(e)=>setRegData({...regData, password: e.target.value})} className="w-full p-2 border rounded"/>
            </div>

            {regData.role === 'doctor' && (
              <>
                <div className="mb-2">
                  <label>Specialization</label>
                  <input onChange={(e)=>setRegData({...regData, specialization: e.target.value})} className="w-full p-2 border rounded"/>
                </div>
                <div className="mb-2">
                  <label>Consultation Fee (INR)</label>
                  <input type="number" onChange={(e)=>setRegData({...regData, consultationFee: e.target.value})} className="w-full p-2 border rounded"/>
                </div>
              </>
            )}

            {regData.role === 'pharmacy' && (
              <>
                <div className="mb-2">
                  <label>Pharmacy Name</label>
                  <input onChange={(e)=>setRegData({...regData, pharmacyName: e.target.value})} className="w-full p-2 border rounded"/>
                </div>
                <div className="mb-2">
                  <label>City</label>
                  <input onChange={(e)=>setRegData({...regData, city: e.target.value})} className="w-full p-2 border rounded"/>
                </div>
              </>
            )}

            <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Register</button>
          </form>
        )}
      </div>
    </div>
  );
}
