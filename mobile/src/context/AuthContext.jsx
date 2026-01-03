import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/config';
import { NativeBiometric } from 'capacitor-native-biometric';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    attemptBiometricLogin();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      setIsBiometricAvailable(result.isAvailable);
    } catch (e) {
      setIsBiometricAvailable(false);
    }
  };

  const attemptBiometricLogin = async () => {
    const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
    if (!biometricEnabled) {
      setLoading(false);
      return;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: 'sgmabcontrol.ar',
      });

      if (credentials) {
        const res = await axios.post(`${getApiUrl()}/auth/login`, {
          username: credentials.username,
          password: credentials.password
        });
        login(res.data.user, res.data.token);
        toast.success('Acceso biométrico exitoso');
      }
    } catch (error) {
      console.log('Biometric login skipped or failed');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token, credentials = null) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    if (credentials) {
      NativeBiometric.setCredentials({
        username: credentials.username,
        password: credentials.password,
        server: 'sgmabcontrol.ar',
      }).then(() => {
        localStorage.setItem('biometric_enabled', 'true');
      });
    }

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
    <AuthContext.Provider value={{ user, login, logout, loading, isBiometricAvailable, attemptBiometricLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
