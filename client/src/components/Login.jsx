import React, { useState } from 'react';
import { Card, Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getServerUrl, setServerUrl } from '../utils/config';
import { Settings } from 'lucide-react';
import { Modal } from 'react-bootstrap';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrlInput] = useState(getServerUrl());
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', {
        username,
        password
      });
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setServerUrl(serverUrl);
    setShowConfig(false);
    window.location.reload();
  };

  return (
    <Container className="d-flex align-items-center justify-content-center fade-in" style={{ minHeight: '90vh' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <Card className="glass-card">
          <Card.Body className="p-5">
            <div className="text-center mb-5">
               <h1 className="display-6 fw-bold mb-1" style={{ 
                 background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 letterSpacing: '-1px'
               }}>SGM Acceso</h1>
               <p className="text-muted small">Gestión Inteligente de Comercio</p>
            </div>

            {error && <Alert variant="danger" className="rounded-3 border-0 shadow-sm">{error}</Alert>}
            
            <Form onSubmit={handleSubmit} autoComplete="off">
              <Form.Group id="username" className="mb-4">
                <Form.Label className="small fw-bold text-muted px-2">Usuario</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  className="rounded-pill px-4 py-2 premium-input"
                  placeholder="Tu usuario..."
                  autoComplete="username"
                />
              </Form.Group>
              
              <Form.Group id="password" className="mb-5">
                <Form.Label className="small fw-bold text-muted px-2">Contraseña</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="rounded-pill px-4 py-2 premium-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Form.Group>

              <Button disabled={loading} className="w-100 rounded-pill premium-btn py-3 mb-2" type="submit">
                {loading ? 'Validando Acceso...' : 'Ingresar al Sistema'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <div className="text-center mt-4">
          <Button 
            variant="link" 
            size="sm" 
            className="text-muted text-decoration-none fw-medium d-flex align-items-center justify-content-center gap-1 mx-auto"
            onClick={() => setShowConfig(true)}
          >
            <Settings size={14} /> Configurar Servidor
          </Button>
        </div>

        <Modal show={showConfig} onHide={() => setShowConfig(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Configuración del Servidor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>URL del Servidor</Form.Label>
              <Form.Control
                type="text"
                placeholder="http://192.168.1.50:5051"
                value={serverUrl}
                onChange={(e) => setServerUrlInput(e.target.value)}
              />
              <Form.Text className="text-muted">
                Ejemplo: http://192.168.1.50:5051 (Local) o https://mi-vps.com (Remoto)
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowConfig(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveConfig}>Guardar y Reiniciar</Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </Container>
  );
};

export default Login;
