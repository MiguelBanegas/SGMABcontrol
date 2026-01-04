import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Tabs, Tab, Button, Modal } from 'react-bootstrap';
import { BarChart3, TrendingUp, Users, Package, UserPlus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import UserModal from './UserModal';
import SalesHistory from './SalesHistory';
import CtaCteManager from './CtaCteManager';
import NotificationsCenter from './NotificationsCenter';
import socket from '../socket';
import toast from 'react-hot-toast';

const Admin = () => {
  const [stats, setStats] = useState([]);
  const [productStats, setProductStats] = useState({ total: 0, lowStock: 0, lowStockProducts: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/sales/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/products/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotificationsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchProductStats(), fetchUsers(), fetchNotificationsCount()]).finally(() => setLoading(false));

    socket.on('notification_received', fetchNotificationsCount);
    return () => {
      socket.off('notification_received', fetchNotificationsCount);
    };
  }, []);

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      toast.success('Usuario eliminado correctamente');
    } catch (err) {
      toast.error('Error al eliminar usuario');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleDeleteUser = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  return (
    <div className="py-2">
      <h2 className="mb-4 d-flex align-items-center">
        <BarChart3 className="me-2 text-primary" /> Panel de Administración
      </h2>

      <Tabs defaultActiveKey="stats" className="mb-4">
        <Tab eventKey="stats" title="Estadísticas">
          <Row className="mb-4 mt-3">
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-primary text-white p-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="opacity-75 small">Facturado Hoy</div>
                    <h3 className="mb-0">${Number(stats[0]?.total_day || 0).toFixed(2)}</h3>
                  </div>
                  <TrendingUp size={32} />
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-success text-white p-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="opacity-75 small">Ganancia Hoy</div>
                    <h3 className="mb-0">${Number(stats[0]?.profit_day || 0).toFixed(2)}</h3>
                  </div>
                  <BarChart3 size={32} />
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card 
                className={`border-0 shadow-sm p-3 h-100 cursor-pointer ${productStats.lowStock > 0 ? 'bg-warning text-dark' : ''}`}
                onClick={() => productStats.lowStock > 0 && setShowLowStockModal(true)}
              >
                <div className="d-flex justify-content-between">
                  <div>
                    <div className={`${productStats.lowStock > 0 ? 'opacity-75' : 'text-muted'} small`}>Bajo Stock</div>
                    <h3 className="mb-0">{productStats.lowStock} <span className="small fs-6">productos</span></h3>
                  </div>
                  <Package size={32} className={productStats.lowStock > 0 ? 'text-dark' : 'text-warning'} />
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="text-muted small">Usuarios</div>
                    <h3 className="mb-0">{users.length}</h3>
                  </div>
                  <Users size={32} className="text-info" />
                </div>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0">
              <h5 className="mb-0">Ventas de la Semana</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Facturado</th>
                    <th>Utilidad Est.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, idx) => (
                    <tr key={idx}>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td className="fw-bold text-primary">${Number(s.total_day).toFixed(2)}</td>
                      <td className="fw-bold text-success">${Number(s.profit_day).toFixed(2)}</td>
                      <td><Badge bg="success">Procesado</Badge></td>
                    </tr>
                  ))}
                  {stats.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No hay datos suficientes para mostrar</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="users" title="Usuarios">
          <Card className="border-0 shadow-sm mt-3">
            <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Usuarios Registrados</h5>
              <Button variant="primary" size="sm" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                <UserPlus size={18} className="me-1" /> Crear Usuario
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Fecha Reg.</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-bold">{u.username}</td>
                      <td>
                        <Badge bg={u.role === 'admin' ? 'info' : 'secondary'}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Button variant="link" size="sm" className="text-primary p-0 me-3" onClick={() => { setEditingUser(u); setShowUserModal(true); }}>
                          <Edit size={18} />
                        </Button>
                        <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="history" title="Historial Comercial">
          <SalesHistory />
        </Tab>
        <Tab eventKey="ctacte" title="Cuentas Corrientes">
          <CtaCteManager />
        </Tab>
        <Tab eventKey="notifications" title={
          <span>
            Notificaciones {unreadCount > 0 && <Badge bg="danger" pill className="ms-1">{unreadCount}</Badge>}
          </span>
        }>
          <NotificationsCenter onUpdate={fetchNotificationsCount} />
        </Tab>
      </Tabs>

      <UserModal 
        show={showUserModal} 
        handleClose={() => setShowUserModal(false)} 
        refreshUsers={fetchUsers}
        editUser={editingUser}
      />

      <Modal show={showLowStockModal} onHide={() => setShowLowStockModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title><Package className="me-2" /> Productos con Bajo Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4">Producto</th>
                <th>SKU</th>
                <th className="text-center">Stock Actual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productStats.lowStockProducts.map(p => (
                <tr key={p.id}>
                  <td className="px-4 fw-bold">{p.name}</td>
                  <td className="text-muted small">{p.sku}</td>
                  <td className="text-center">
                    <Badge bg={p.stock <= 2 ? 'danger' : 'warning'} className="px-3">
                      {p.stock} unidades
                    </Badge>
                  </td>
                  <td>
                    {p.stock === 0 ? 
                      <span className="text-danger small fw-bold">Sin Stock</span> : 
                      <span className="text-warning small fw-bold">Reponer pronto</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLowStockModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmación para Eliminar Usuario */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <Trash2 size={40} className="text-danger mb-3 opacity-75" />
          <h5 className="mb-2">¿Eliminar usuario?</h5>
          <p className="text-muted small mb-0">Esta acción no se puede deshacer.</p>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <Button variant="light" size="sm" className="px-3" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" className="px-3 shadow-sm" onClick={confirmDelete}>
              Confirmar
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Admin;
