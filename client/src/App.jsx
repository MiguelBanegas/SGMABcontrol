import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { ShoppingCart, Package, Users, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Stock from './components/Stock';
import Sales from './components/Sales';
import Admin from './components/Admin';
import { Toaster, toast } from 'react-hot-toast';
import socket from './socket';

const APP_VERSION = '1.1.2';

const Home = () => <div className="mt-4"><h2>Bienvenido al SGM</h2><p>Seleccione una opción del menú para comenzar.</p></div>;

function AppContent() {
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    socket.on('version_check', (serverVersion) => {
      if (serverVersion !== APP_VERSION) {
        toast((t) => (
          <span>
            <b>¡Nueva actualización!</b> ✨<br/>
            Haga clic para aplicar los cambios.
            <Button 
              size="sm" 
              variant="primary" 
              className="ms-3 rounded-pill"
              onClick={() => {
                toast.dismiss(t.id);
                window.location.reload();
              }}
            >
              Actualizar
            </Button>
          </span>
        ), {
          duration: Infinity,
          position: 'top-center',
          style: {
            background: '#333',
            color: '#fff',
            minWidth: '350px'
          }
        });
      }
    });

    return () => socket.off('version_check');
  }, []);

  if (loading) return <div className="d-flex justify-content-center mt-5">Cargando...</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/">
            SGM Comercio <span style={{ fontSize: '0.6em', opacity: 0.6 }}>v{APP_VERSION}</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto flex-nowrap align-items-center">
              <Nav.Link as={Link} to="/sales" className="px-3">
                <ShoppingCart className="me-1" size={18} /> Ventas
              </Nav.Link>
              <Nav.Link as={Link} to="/stock" className="px-3">
                <Package className="me-1" size={18} /> Stock
              </Nav.Link>
              {user.role === 'admin' && (
                <Nav.Link as={Link} to="/admin" className="px-3">
                  <Users className="me-1" size={18} /> Admin
                </Nav.Link>
              )}
              <div className="ms-lg-3 border-start border-secondary ps-3 d-flex align-items-center">
                <span className="text-light me-3 small d-none d-md-inline">{user.username} ({user.role})</span>
                <Button variant="outline-danger" size="sm" onClick={logout} className="rounded-pill px-3">
                  <LogOut size={16} />
                </Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={
            user.role === 'admin' ? <Navigate to="/admin" replace /> : 
            user.role === 'vendedor' ? <Navigate to="/sales" replace /> : <Home />
          } />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/admin" element={
            user.role === 'admin' ? <Admin /> : <Navigate to="/" replace />
          } />
        </Routes>
      </Container>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  );
}

export default App;
