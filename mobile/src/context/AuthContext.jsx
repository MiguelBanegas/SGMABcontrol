import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/config';
import { NativeBiometric } from 'capacitor-native-biometric';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    // Si ya tenemos usuario de localStorage, no hace falta "cargar" (aunque podemos validar token)
    if (localStorage.getItem('user')) {
      const token = localStorage.getItem('token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setLoading(false);
    }
    
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
    
    // Guardar credenciales para login offline
    if (credentials) {
      localStorage.setItem('last_auth', JSON.stringify({
        username: credentials.username,
        password: credentials.password, // En ambiente real esto debería ir cifrado
        userData: userData
      }));

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

  const offlineLogin = (username, password) => {
    const lastAuthStr = localStorage.getItem('last_auth');
    if (!lastAuthStr) return { success: false, message: 'No hay datos de sesión guardados para modo offline.' };
    
    try {
      const lastAuth = JSON.parse(lastAuthStr);
      if (lastAuth.username === username && lastAuth.password === password) {
        setUser(lastAuth.userData);
        localStorage.setItem('user', JSON.stringify(lastAuth.userData));
        // Nota: en offline el token no sirve para la API, pero permite navegar por la App
        return { success: true };
      }
      return { success: false, message: 'Usuario o contraseña incorrectos (Modo Offline).' };
    } catch (e) {
      return { success: false, message: 'Error al validar datos locales.' };
    }
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
    <AuthContext.Provider value={{ user, login, logout, offlineLogin, loading, isBiometricAvailable, attemptBiometricLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
