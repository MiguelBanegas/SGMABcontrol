import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';
import { MessageSquare, Bell } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import socket from '../socket';

const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar notificaciones');
    }
  };

  useEffect(() => {
    fetchNotifications();
    socket.on('notification_received', fetchNotifications);
    return () => socket.off('notification_received');
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notificación marcada como leída');
      fetchNotifications();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar notificación');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card className="border-0 shadow-sm mt-3">
      <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 d-flex align-items-center">
          <Bell className="me-2 text-primary" size={20} /> Notificaciones 
          {unreadCount > 0 && <Badge bg="danger" pill className="ms-2 small">{unreadCount}</Badge>}
        </h5>
        <Button variant="outline-primary" size="sm" onClick={fetchNotifications}>Actualizar</Button>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {notifications.map(n => (
            <ListGroup.Item key={n.id} className={`p-3 ${n.is_read ? 'opacity-75' : 'bg-light border-start border-4 border-warning'}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex">
                  <MessageSquare className="text-warning me-3 flex-shrink-0" size={20} />
                  <div>
                    <div className="fw-bold fs-6">De: {n.sender_name}</div>
                    <div className="text-dark small mb-1">{n.message}</div>
                    <div className="text-muted x-small">{n.created_at ? format(new Date(n.created_at), "dd MMM, HH:mm", { locale: es }) : '---'}hs</div>
                  </div>
                </div>
                {!n.is_read && (
                  <Button variant="link" size="sm" className="text-success p-0" onClick={() => markAsRead(n.id)}>
                    Leer
                  </Button>
                )}
              </div>
            </ListGroup.Item>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-5 text-muted">No hay notificaciones pendientes</div>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default NotificationsCenter;
