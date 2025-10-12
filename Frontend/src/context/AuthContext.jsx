import React, { createContext, useState, useEffect } from 'react';
import { getProfile } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hb_user')) || null);

  useEffect(() => {
    const token = localStorage.getItem('hb_token');
    if (token && !user) {
      getProfile().then(profile => { setUser(profile); localStorage.setItem('hb_user', JSON.stringify(profile)); }).catch(() => { localStorage.removeItem('hb_token'); localStorage.removeItem('hb_user'); setUser(null); });
    }
  }, []);

  const loginLocal = (userData, token) => { localStorage.setItem('hb_token', token); localStorage.setItem('hb_user', JSON.stringify(userData)); setUser(userData); };
  const logout = () => { localStorage.removeItem('hb_token'); localStorage.removeItem('hb_user'); setUser(null); window.location.href='/login'; };

  return <AuthContext.Provider value={{ user, setUser, loginLocal, logout }}>{children}</AuthContext.Provider>;
};
