import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Card, Form, Collapse, Modal } from 'react-bootstrap';
import { CheckCircle, Clock, Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import socket from '../socket';

const CtaCteManager = () => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  // Estado para el modal de confirmación
  const [confirmModal, setConfirmModal] = useState({ show: false, saleId: null });

  const fetchCtaCteSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/sales/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const handleConfirmPayment = (id) => {
    setConfirmModal({ show: true, saleId: id });
  };

  const processPayment = async () => {
    const { saleId } = confirmModal;
    setConfirmModal({ show: false, saleId: null });

    const toastId = toast.loading('Procesando pago...');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/sales/${saleId}/status`, { status: 'completado' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('¡Cuenta saldada con éxito!', { id: toastId });
      fetchCtaCteSales();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el pago', { id: toastId });
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = (s.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = showAll ? true : s.status === 'pendiente';
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mt-3">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3 d-flex gap-3 align-items-center">
          <div className="flex-grow-1">
            <Form.Control 
              placeholder="Buscar por cliente o ID de factura..." 
              className="mb-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Form.Check 
            type="switch"
            id="show-all-switch"
            label="Ver saldadas"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
        </Card.Body>
      </Card>

      <Table hover responsive className="align-middle border shadow-sm rounded overflow-hidden">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th className="text-end">Monto</th>
            <th className="text-center">Estado</th>
            <th className="text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map(sale => (
            <React.Fragment key={sale.id}>
              <tr>
                <td>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                  >
                    {expandedSale === sale.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </Button>
                </td>
                <td>{sale.created_at ? format(new Date(sale.created_at), "dd MMM yyyy", { locale: es }) : '---'}</td>
                <td className="fw-bold">{sale.customer_name || 'Desconocido'}</td>
                <td className="text-end fw-bold text-danger">${Number(sale.total || 0).toFixed(2)}</td>
                <td className="text-center">
                  {sale.status === 'pendiente' ? (
                    <Badge bg="warning" text="dark" className="d-flex align-items-center justify-content-center gap-1 mx-auto" style={{ width: 'fit-content' }}>
                      <Clock size={12} /> Pendiente
                    </Badge>
                  ) : (
                    <Badge bg="success" className="d-flex align-items-center justify-content-center gap-1 mx-auto" style={{ width: 'fit-content' }}>
                      <CheckCircle size={12} /> Pagado
                    </Badge>
                  )}
                </td>
                <td className="text-center">
                  {sale.status === 'pendiente' ? (
                    <Button variant="success" size="sm" onClick={() => handleConfirmPayment(sale.id)}>
                      Registrar Pago
                    </Button>
                  ) : (
                    <span className="text-muted small italic">Saldado</span>
                  )}
                </td>
              </tr>
              <tr>
                <td colSpan="6" className="p-0 border-0">
                  <Collapse in={expandedSale === sale.id}>
                    <div className="bg-light p-3 border-bottom shadow-inner">
                      <h6 className="mb-3 d-flex align-items-center gap-2 text-primary fw-bold">
                         <div className="bg-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                            <Badge bg="transparent" className="p-0 text-white">i</Badge>
                         </div>
                         Detalle de la cuenta:
                      </h6>
                      <Table size="sm" className="mb-0 bg-white rounded shadow-sm">
                        <thead className="table-secondary">
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Cant.</th>
                            <th className="text-end">Precio Unit.</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                {item.product_name}
                                {item.promo_type && item.promo_type !== 'none' && (
                                  <div className="text-success extra-small fw-bold">
                                    Promo aplicada
                                  </div>
                                )}
                              </td>
                              <td className="text-center">
                                {item.quantity} {item.sell_by_weight ? 'Kg' : 'un.'}
                              </td>
                              <td className="text-end">${Number(item.price_unit).toFixed(2)}</td>
                              <td className="text-end fw-bold">${Number(item.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="fw-bold">
                            <td colSpan="3" className="text-end">TOTAL:</td>
                            <td className="text-end text-danger h5 mb-0">${Number(sale.total).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </Table>
                      <div className="mt-2 d-flex justify-content-between align-items-center">
                         <small className="text-muted opacity-50">ID: {sale.id}</small>
                         <div className="small fw-bold">
                            Vendedor: <Badge bg="info" text="dark">{sale.seller_name || 'Desconocido'}</Badge>
                         </div>
                      </div>
                    </div>
                  </Collapse>
                </td>
              </tr>
            </React.Fragment>
          ))}
          {filteredSales.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-5 text-muted">No se encontraron facturas pendientes</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal de Confirmación Premium */}
      <Modal show={confirmModal.show} onHide={() => setConfirmModal({ show: false, saleId: null })} centered>
        <Modal.Body className="text-center p-4">
          <div className="mb-3 text-warning">
            <AlertCircle size={64} />
          </div>
          <h4>¿Confirmar Pago?</h4>
          <p className="text-muted">Esta acción marcará la cuenta corriente como saldada y no se puede deshacer.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="outline-secondary" className="px-4" onClick={() => setConfirmModal({ show: false, saleId: null })}>
              Cancelar
            </Button>
            <Button variant="success" className="px-4 shadow-sm" onClick={processPayment}>
              Sí, Saldar Cuenta
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CtaCteManager;
