import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Card, Form } from 'react-bootstrap';
import { CheckCircle, Clock, Search } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import socket from '../socket';

const CtaCteManager = () => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCtaCteSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/sales/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filtrar solo las de Cta Cte
      const ctaCteOnly = res.data.filter(s => s.payment_method === 'Cta Cte');
      setSales(ctaCteOnly);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar cuentas corrientes');
    }
  };

  useEffect(() => {
    fetchCtaCteSales();
    socket.on('sales_updated', fetchCtaCteSales);
    return () => socket.off('sales_updated');
  }, []);

  const markAsPaid = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/sales/${id}/status`, { status: 'completado' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Factura marcada como pagada');
      fetchCtaCteSales();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el pago');
    }
  };

  const filteredSales = sales.filter(s => 
    (s.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mt-3">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Form.Control 
            placeholder="Buscar por cliente o ID de factura..." 
            className="mb-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card.Body>
      </Card>

      <Table hover responsive className="align-middle border shadow-sm rounded overflow-hidden">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th className="text-end">Monto</th>
            <th className="text-center">Estado</th>
            <th className="text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map(sale => (
            <tr key={sale.id}>
              <td>{sale.created_at ? format(new Date(sale.created_at), "dd MMM yyyy", { locale: es }) : '---'}</td>
              <td className="fw-bold">{sale.customer_name || 'Desconocido'}</td>
              <td className="text-end fw-bold text-danger">${Number(sale.total || 0).toFixed(2)}</td>
              <td className="text-center">
                {sale.status === 'pendiente' ? (
                  <Badge bg="warning" text="dark" className="d-flex align-items-center justify-content-center gap-1">
                    <Clock size={12} /> Pendiente
                  </Badge>
                ) : (
                  <Badge bg="success" className="d-flex align-items-center justify-content-center gap-1">
                    <CheckCircle size={12} /> Pagado
                  </Badge>
                )}
              </td>
              <td className="text-center">
                {sale.status === 'pendiente' ? (
                  <Button variant="success" size="sm" onClick={() => markAsPaid(sale.id)}>
                    Registrar Pago
                  </Button>
                ) : (
                  <span className="text-muted small italic">Saldado</span>
                )}
              </td>
            </tr>
          ))}
          {filteredSales.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-5 text-muted">No se encontraron facturas pendientes</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default CtaCteManager;
