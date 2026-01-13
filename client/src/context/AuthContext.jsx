import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { autoDiscoverServer, verifyServer } from '../utils/serverDiscovery';
import { getServerUrl, setServerUrl } from '../utils/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverSearching, setServerSearching] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Verificar conectividad del servidor al cargar
  useEffect(() => {
    const checkServerConnection = async () => {
      console.log('🔍 Verificando conexión con el servidor...');
      
      const savedUrl = getServerUrl();
      
      // Si hay URL guardada, verificar si sigue funcionando
      if (savedUrl && savedUrl !== window.location.origin) {
        const isValid = await verifyServer(savedUrl);
        
        if (!isValid) {
          console.log('⚠️ Servidor guardado no responde, iniciando búsqueda automática...');
          setServerSearching(true);
          
          const serverInfo = await autoDiscoverServer();
          
          if (serverInfo) {
            const newUrl = `http://${serverInfo.discoveredIp}:${serverInfo.port}`;
            setServerUrl(newUrl);
            console.log(`✅ Nuevo servidor encontrado: ${newUrl}`);
            setServerError(null);
          } else {
            console.log('❌ No se pudo encontrar el servidor automáticamente');
            setServerError('No se pudo conectar con el servidor. Por favor, configúralo manualmente en /server-config');
          }
          
          setServerSearching(false);
        }
      }
      
      // Limpiar sesión anterior
      console.log('🔒 Cerrando sesión automáticamente...');
      
      const keysToKeep = ['theme', 'language', 'SERVER_URL'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.clear();
      delete axios.defaults.headers.common['Authorization'];
      
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
    };

    checkServerConnection();
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
    
    const keysToKeep = ['theme', 'language', 'SERVER_URL'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    sessionStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('✅ Sesión cerrada. Recargando página...');
    
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  };

  // Mostrar pantalla de búsqueda si está buscando servidor
  if (serverSearching) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 9999,
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
        <h2>Buscando servidor en la red...</h2>
        <p style={{ opacity: 0.7 }}>Esto puede tomar unos segundos</p>
      </div>
    );
  }

  // Mostrar error si no se pudo conectar
  if (serverError) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 9999,
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>No se pudo conectar con el servidor</h2>
        <p style={{ opacity: 0.7, marginBottom: '20px' }}>{serverError}</p>
        <button
          onClick={() => window.location.href = '/server-config'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Configurar Servidor
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
