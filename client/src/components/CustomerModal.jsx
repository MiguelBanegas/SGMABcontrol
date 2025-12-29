import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

const CustomerModal = ({ show, handleClose, onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/customers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newCustomer = { id: response.data.id, ...formData };
      toast.success('Cliente creado con éxito');
      onCustomerCreated(newCustomer);
      setFormData({ name: '', email: '', phone: '' });
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nuevo Cliente</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nombre Completo</Form.Label>
            <Form.Control 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
              placeholder="Ej: Juan Pérez"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email (Opcional)</Form.Label>
            <Form.Control 
              type="email"
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="juan@ejemplo.com"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Teléfono (Opcional)</Form.Label>
            <Form.Control 
              name="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
              placeholder="11 2233 4455"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Cliente'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CustomerModal;
