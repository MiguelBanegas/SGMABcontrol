import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { User, Phone, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CustomerModal = ({ show, handleClose, refreshCustomers, editCustomer }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editCustomer) {
      setFormData({
        name: editCustomer.name || '',
        email: editCustomer.email || '',
        phone: editCustomer.phone || '',
        notes: editCustomer.notes || '',
        is_active: editCustomer.is_active === undefined ? true : !!editCustomer.is_active
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        notes: '',
        is_active: true
      });
    }
  }, [editCustomer, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editCustomer) {
        await axios.put(`/api/customers/${editCustomer.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cliente actualizado');
      } else {
        await axios.post('/api/customers', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cliente creado');
      }
      refreshCustomers();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <User className="me-2 text-primary" />
          {editCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Nombre Completo *</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <User size={18} className="text-muted" />
              </span>
              <Form.Control
                type="text"
                className="border-start-0"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Email</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <Mail size={18} className="text-muted" />
                  </span>
                  <Form.Control
                    type="email"
                    className="border-start-0"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Teléfono</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <Phone size={18} className="text-muted" />
                  </span>
                  <Form.Control
                    type="text"
                    className="border-start-0"
                    placeholder="11 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Notas</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 align-items-start pt-2">
                <FileText size={18} className="text-muted" />
              </span>
              <Form.Control
                as="textarea"
                rows={2}
                className="border-start-0"
                placeholder="Información adicional..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-0 mt-3 d-flex align-items-center">
            <Form.Check 
              type="switch"
              id="customer-active-switch"
              label={formData.is_active ? 'Cliente Activo' : 'Cliente Inactivo'}
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className={formData.is_active ? 'text-success fw-bold' : 'text-danger fw-bold'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="px-4 rounded-pill">
            {loading ? 'Guardando...' : (editCustomer ? 'Actualizar' : 'Crear Cliente')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CustomerModal;
