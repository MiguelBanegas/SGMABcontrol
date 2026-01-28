import React, { useState } from 'react';
import { Card, Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, getServerUrl } from '../utils/config';
import { Settings, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnectivity } from '../context/ConnectivityContext';
import toast from 'react-hot-toast';
import { isVpsConnection } from '../utils/config';
import { Badge } from 'react-bootstrap';

import { Fingerprint } from 'lucide-react';

import { version } from '../../package.json';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout, offlineLogin, isBiometricAvailable, attemptBiometricLogin } = useAuth();
  const { isOffline } = useConnectivity();
  const [testStatus, setTestStatus] = useState(null); // { type: 'success'|'error', msg: '' }

  const handleTestConnection = async () => {
    setTestStatus(null);
    setLoading(true);
    const apiBase = getApiUrl();
    try {
      const start = Date.now();
      const res = await axios.get(`${apiBase}/health`, { timeout: 5000 });
      const duration = Date.now() - start;
      setTestStatus({ 
        type: 'success', 
        msg: `Conexión exitosa (${res.status} OK) en ${duration}ms. El servidor responde correctamente.` 
      });
    } catch (err) {
      let msg = 'Error de conexión. ';
      if (err.code === 'ECONNABORTED') msg += 'Tiempo de espera agotado (Timeout).';
      else if (!err.response) msg += 'No se pudo alcanzar el servidor. Verifica que estés en el mismo WiFi y que la IP/Puerto sean correctos.';
      else msg += `Error del servidor: ${err.response.status}`;
      
      setTestStatus({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${getApiUrl()}/auth/login`, {
        username,
        password
      }, { timeout: 8000 });
      
      const credentials = { username, password };
      login(res.data.user, res.data.token, credentials);
      toast.success('Sesión iniciada correctamente');
    } catch (err) {
      console.log('Login online falló, probando offline...', err.code);
      
      // Si el error es de red o timeout, intentamos offline
      if (!err.response || err.code === 'ECONNABORTED' || isOffline) {
        const offlineResult = offlineLogin(username, password);
        if (offlineResult.success) {
          toast.success('Sesión iniciada en Modo Offline');
          return;
        }
        setError(offlineResult.message || 'Error de conexión y no se hallaron datos locales.');
      } else {
        setError(err.response?.data?.message || 'Usuario o contraseña incorrectos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricClick = async () => {
    setError('');
    await attemptBiometricLogin();
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', paddingBottom: '10vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 pt-4">
            <span className="text-muted small ps-2">v{version}</span>
            <div className="d-flex align-items-center gap-2">
                {isVpsConnection() && (
                  <Badge bg="warning" text="dark" className="small fw-normal py-1 px-2 opacity-75">
                    Modo Nube/VPS
                  </Badge>
                )}
                <Link to="/settings" className="text-secondary p-2">
                    <Settings size={28} />
                </Link>
            </div>
        </div>
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
                <h1 className="fw-bold mb-1" style={{ color: '#2563eb' }}>MAR FRANK</h1>
                <p className="text-muted small">Proveeduria MAR FRANK</p>
            </div>

            {error && <Alert variant="danger" className="p-2 small mb-3">{error}</Alert>}
            
            {testStatus && (
              <Alert variant={testStatus.type === 'success' ? 'success' : 'danger'} className="p-2 small mb-3 d-flex align-items-center">
                {testStatus.type === 'success' ? <CheckCircle size={16} className="me-2" /> : <AlertTriangle size={16} className="me-2" />}
                <span>{testStatus.msg}</span>
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group id="username" className="mb-3">
                <Form.Label className="small fw-semibold">Usuario</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  className="rounded-3 px-3 py-2"
                  placeholder="Ingrese su usuario"
                />
              </Form.Group>
              <Form.Group id="password" className="mb-4">
                <Form.Label className="small fw-semibold">Contraseña</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="rounded-3 px-3 py-2"
                  placeholder="Ingrese su contraseña"
                />
              </Form.Group>

              {isBiometricAvailable && (
                <Form.Group className="mb-4">
                  <Form.Check 
                    type="switch"
                    id="biometric-switch"
                    label="Habilitar acceso con huella/rostro"
                    checked={useBiometric}
                    onChange={(e) => setUseBiometric(e.target.checked)}
                    className="small text-muted"
                  />
                </Form.Group>
              )}

              <Button disabled={loading} className="w-100 rounded-3 btn-primary py-2 fw-bold" type="submit">
                {loading ? 'Entrando...' : 'Ingresar'}
              </Button>

              {isBiometricAvailable && localStorage.getItem('biometric_enabled') === 'true' && (
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-primary" 
                    className="rounded-circle p-3"
                    onClick={handleBiometricClick}
                    disabled={loading}
                  >
                    <Fingerprint size={32} />
                  </Button>
                </div>
              )}
              <div className="mt-4 pt-2 border-top">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="w-100 d-flex align-items-center justify-content-center border-0 text-muted"
                  onClick={handleTestConnection}
                  disabled={loading}
                >
                  <Globe size={16} className="me-2" /> Probar Conexión con Servidor
                </Button>
                <div className="text-center mt-2">
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>URL actual: {getServerUrl()}</span>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
