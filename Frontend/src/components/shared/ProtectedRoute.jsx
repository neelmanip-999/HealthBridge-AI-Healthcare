import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <div className="p-4">Not authorized</div>;
  return children;
}
