import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se elimina la carga automática de localStorage para forzar login al iniciar
    // const savedUser = localStorage.getItem('user');
    // const token = localStorage.getItem('token');
    // if (savedUser && token) {
    //   setUser(JSON.parse(savedUser));
    //   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    resetInactivityTimer();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
  };

  const resetInactivityTimer = () => {
    if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
    
    // Solo si hay usuario logueado
    const token = localStorage.getItem('token');
    if (!token) return;

    window.inactivityTimeout = setTimeout(() => {
      logout();
      toast('Sesión cerrada por inactividad', { icon: '🕒' });
    }, 10 * 60 * 1000); // 10 minutos
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handler = () => resetInactivityTimer();

    events.forEach(event => window.addEventListener(event, handler));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handler));
      if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
