import React, { useState } from 'react';
import { Card, Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Fingerprint } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isBiometricAvailable, attemptBiometricLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${getApiUrl()}/auth/login`, {
        username,
        password
      });
      
      const credentials = useBiometric ? { username, password } : null;
      login(res.data.user, res.data.token, credentials);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique la URL del servidor.');
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
        <div className="text-end mb-4 pt-4">
            <Link to="/settings" className="text-secondary p-2">
                <Settings size={28} />
            </Link>
        </div>
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
                <h1 className="fw-bold mb-1" style={{ color: '#2563eb' }}>SGM</h1>
                <p className="text-muted small">Control de Comercio</p>
            </div>

            {error && <Alert variant="danger" className="small">{error}</Alert>}
            
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
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
