import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Forzar cierre de sesión al cargar la página
    console.log('🔒 Cerrando sesión automáticamente...');
    
    // Limpiar localStorage completo excepto configuraciones del sistema
    const keysToKeep = ['theme', 'language']; // Mantener solo configuraciones básicas
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Forzar actualización del caché del navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    setUser(null);
    setLoading(false);
    
    console.log('✅ Sesión cerrada. Por favor inicie sesión nuevamente.');
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    console.log('🔒 Cerrando sesión...');
    
    setUser(null);
    
    // Limpiar localStorage completo excepto configuraciones del sistema
    const keysToKeep = ['theme', 'language'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Limpiar caché del navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('✅ Sesión cerrada. Recargando página...');
    
    // Forzar recarga completa de la página (sin caché)
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
