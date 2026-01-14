import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, Modal } from 'react-bootstrap';
import { Calendar, Package, DollarSign, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PurchasesReport = () => {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0
  });

  // Calcular fechas según el período seleccionado
  const calculateDates = (selectedPeriod) => {
    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setDate(start.getDate() - 30);
        break;
      case 'custom':
        // No calcular, usar las fechas del estado
        return;
      default:
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Cargar reporte cuando cambian las fechas
  useEffect(() => {
    if (period !== 'custom') {
      calculateDates(period);
    }
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Crear fechas con hora para el rango completo
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const response = await axios.get('/api/purchases/report', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      setReportData(response.data);

      // Calcular estadísticas
      const totalPurchases = response.data.length;
      const totalSpent = response.data.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);

      setStats({ totalPurchases, totalSpent });
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      calculateDates(newPeriod);
    }
  };

  const handleViewDetail = async (purchaseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/purchases/${purchaseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedPurchase(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching purchase detail:', error);
      toast.error('Error al cargar detalle');
    }
  };

  return (
    <div className="py-3">
      <h4 className="mb-4">🛒 Reporte de Compras</h4>

      {/* Selector de período */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form.Label className="d-flex align-items-center gap-2">
            <Calendar size={18} />
            Período
          </Form.Label>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Button
              variant={period === 'today' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handlePeriodChange('today')}
            >
              Hoy
            </Button>
            <Button
              variant={period === 'week' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handlePeriodChange('week')}
            >
              Última Semana
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handlePeriodChange('month')}
            >
              Último Mes
            </Button>
            <Button
              variant={period === 'custom' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handlePeriodChange('custom')}
            >
              Personalizado
            </Button>
          </div>

          {period === 'custom' && (
            <Row>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button 
                  variant="primary" 
                  onClick={fetchReport}
                  disabled={!startDate || !endDate}
                >
                  Buscar
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Tarjetas de resumen */}
      {reportData.length > 0 && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm border-0 bg-primary text-white">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="opacity-75">Total de Compras</small>
                    <h3 className="mb-0">{stats.totalPurchases}</h3>
                  </div>
                  <Package size={40} className="opacity-50" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm border-0 bg-danger text-white">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="opacity-75">Total Gastado</small>
                    <h3 className="mb-0">${stats.totalSpent.toFixed(2)}</h3>
                  </div>
                  <DollarSign size={40} className="opacity-50" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de compras */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-3 border-0">
          <h5 className="mb-0">Compras Registradas</h5>
          {startDate && endDate && (
            <small className="text-muted">
              Del {new Date(startDate).toLocaleDateString('es-AR')} al {new Date(endDate).toLocaleDateString('es-AR')}
            </small>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando reporte...</p>
            </div>
          ) : reportData.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">Fecha</th>
                  <th>Usuario</th>
                  <th className="text-center">Items</th>
                  <th className="text-end">Total</th>
                  <th>Notas</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-4">
                      {new Date(purchase.created_at).toLocaleDateString('es-AR')}
                      <br />
                      <small className="text-muted">
                        {new Date(purchase.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>{purchase.user_name || 'N/A'}</td>
                    <td className="text-center">
                      <Badge bg="info" className="px-3">
                        {purchase.items_count}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold text-danger">
                      ${parseFloat(purchase.total).toFixed(2)}
                    </td>
                    <td>
                      <small className="text-muted">
                        {purchase.notes || '-'}
                      </small>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetail(purchase.id)}
                      >
                        <Eye size={16} className="me-1" />
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <Package size={48} className="text-muted mb-3 opacity-25" />
              <h5 className="text-muted">No hay compras en este período</h5>
              <p className="text-muted small">
                Selecciona un período diferente o verifica que haya compras registradas
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalle */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle de Compra</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPurchase && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Fecha:</strong> {new Date(selectedPurchase.created_at).toLocaleString('es-AR')}
                </Col>
                <Col md={6}>
                  <strong>Usuario:</strong> {selectedPurchase.user_name || 'N/A'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Notas:</strong> {selectedPurchase.notes || 'Sin notas'}
                </Col>
              </Row>
              <hr />
              <h6 className="mb-3">Productos Comprados:</h6>
              <Table responsive bordered>
                <thead className="bg-light">
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th className="text-end">Cantidad</th>
                    <th className="text-end">Precio Compra</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items && selectedPurchase.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td className="text-muted small">{item.sku}</td>
                      <td className="text-end">{parseFloat(item.quantity).toFixed(2)}</td>
                      <td className="text-end">${parseFloat(item.price_buy).toFixed(2)}</td>
                      <td className="text-end fw-bold">${parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">TOTAL:</td>
                    <td className="text-end fw-bold text-danger">
                      ${parseFloat(selectedPurchase.total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PurchasesReport;
