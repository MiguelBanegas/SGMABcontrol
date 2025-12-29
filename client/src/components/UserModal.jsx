import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserModal = ({ show, handleClose, refreshUsers, editUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'vendedor'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username,
        password: '',
        role: editUser.role
      });
    } else {
      setFormData({ username: '', password: '', role: 'vendedor' });
    }
    setError('');
  }, [editUser, show]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editUser) {
        // En edición, si el password está vacío no se actualiza
        const data = { ...formData };
        if (!data.password) delete data.password;
        await axios.put(`/api/users/${editUser.id}`, data, { headers });
      } else {
        await axios.post('/api/users', formData, { headers });
      }
      toast.success(editUser ? 'Usuario actualizado' : 'Usuario creado');
      refreshUsers();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nombre de Usuario</Form.Label>
            <Form.Control 
              name="username" 
              value={formData.username} 
              onChange={handleInputChange} 
              required 
              autoComplete="username"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña {editUser && '(Dejar en blanco para no cambiar)'}</Form.Label>
            <Form.Control 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              required={!editUser}
              autoComplete="new-password"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rol</Form.Label>
            <Form.Select name="role" value={formData.role} onChange={handleInputChange}>
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit">
            {editUser ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserModal;
