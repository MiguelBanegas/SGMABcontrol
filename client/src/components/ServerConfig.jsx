import { useState } from 'react';
import { autoDiscoverServer, verifyServer } from '../utils/serverDiscovery';
import { setServerUrl, getServerUrl } from '../utils/config';

const ServerConfig = ({ onServerFound }) => {
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [status, setStatus] = useState('');
  const [currentServer, setCurrentServer] = useState(getServerUrl());

  const handleAutoDiscover = async () => {
    setScanning(true);
    setStatus('🔍 Escaneando la red local...');

    try {
      const serverInfo = await autoDiscoverServer();
      
      if (serverInfo) {
        const serverUrl = `http://${serverInfo.discoveredIp}:${serverInfo.port}`;
        setServerUrl(serverUrl);
        setCurrentServer(serverUrl);
        setStatus(`✅ Servidor encontrado: ${serverUrl}`);
        
        if (onServerFound) {
          onServerFound(serverUrl);
        }
      } else {
        setStatus('❌ No se encontró el servidor. Intenta configurarlo manualmente.');
      }
    } catch (error) {
      setStatus('❌ Error durante el escaneo: ' + error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleManualConfig = async () => {
    if (!manualUrl) {
      setStatus('⚠️ Por favor ingresa una URL');
      return;
    }

    setStatus('🔍 Verificando servidor...');
    
    const isValid = await verifyServer(manualUrl);
    
    if (isValid) {
      setServerUrl(manualUrl);
      setCurrentServer(manualUrl);
      setStatus(`✅ Servidor configurado: ${manualUrl}`);
      
      if (onServerFound) {
        onServerFound(manualUrl);
      }
    } else {
      setStatus('❌ No se pudo conectar con el servidor en esa dirección');
    }
  };

  const handleReset = () => {
    setServerUrl(null);
    setCurrentServer(getServerUrl());
    setStatus('🔄 Configuración reiniciada');
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
    }}>
      <h2>⚙️ Configuración del Servidor</h2>
      
      {currentServer && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          borderRadius: '4px',
          marginBottom: '15px',
        }}>
          <strong>Servidor actual:</strong> {currentServer}
          <button
            onClick={handleReset}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cambiar
          </button>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Descubrimiento Automático</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Escanea la red local para encontrar el servidor SGM automáticamente.
        </p>
        <button
          onClick={handleAutoDiscover}
          disabled={scanning}
          style={{
            padding: '10px 20px',
            backgroundColor: scanning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: scanning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {scanning ? '⏳ Escaneando...' : '🔍 Buscar Servidor'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Configuración Manual</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Ingresa la dirección IP del servidor manualmente.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="http://192.168.1.100:5051"
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleManualConfig}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Conectar
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          padding: '10px',
          backgroundColor: status.includes('✅') ? '#d4edda' : 
                          status.includes('❌') ? '#f8d7da' : '#fff3cd',
          borderRadius: '4px',
          marginTop: '15px',
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default ServerConfig;
