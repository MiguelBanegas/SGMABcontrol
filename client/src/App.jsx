import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';

const Home = () => <div className="mt-4"><h2>Bienvenido al SGM</h2><p>Seleccione una opción del menú para comenzar.</p></div>;
const Sales = () => <div className="mt-4"><h2>Módulo de Ventas</h2></div>;
const Stock = () => <div className="mt-4"><h2>Gestión de Stock</h2></div>;
const Admin = () => <div className="mt-4"><h2>Administración</h2></div>;

function App() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/">SGM Comercio</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/sales">
                <ShoppingCart className="me-1" size={18} /> Ventas
              </Nav.Link>
              <Nav.Link as={Link} to="/stock">
                <Package className="me-1" size={18} /> Stock
              </Nav.Link>
              <Nav.Link as={Link} to="/admin">
                <Users className="me-1" size={18} /> Admin
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
