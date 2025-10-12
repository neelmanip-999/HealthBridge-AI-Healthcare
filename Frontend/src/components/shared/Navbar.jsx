import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
export default function Navbar(){
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="bg-white shadow p-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">HealthBridge</div>
        <div className="flex items-center gap-4">
          {user ? (<><div>{user.name} ({user.role})</div><button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button></>) : (<a href="/login" className="px-3 py-1 bg-blue-600 text-white rounded">Login / Register</a>)}
        </div>
      </div>
    </nav>
  );
}
