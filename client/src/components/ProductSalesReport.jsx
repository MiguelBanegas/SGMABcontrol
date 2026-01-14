import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge } from 'react-bootstrap';
import { Calendar, Package, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductSalesReport = () => {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0
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

      const response = await axios.get('/api/sales/products-report', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      setReportData(response.data);

      // Calcular estadísticas
      const totalProducts = response.data.length;
      const totalRevenue = response.data.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);

      setStats({ totalProducts, totalRevenue });
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

  return (
    <div className="py-3">
      <h4 className="mb-4">📦 Reporte de Productos Vendidos</h4>

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
                    <small className="opacity-75">Productos Diferentes</small>
                    <h3 className="mb-0">{stats.totalProducts}</h3>
                  </div>
                  <Package size={40} className="opacity-50" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm border-0 bg-success text-white">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="opacity-75">Ingresos Totales</small>
                    <h3 className="mb-0">${stats.totalRevenue.toFixed(2)}</h3>
                  </div>
                  <DollarSign size={40} className="opacity-50" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de productos */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-3 border-0">
          <h5 className="mb-0">Productos Vendidos</h5>
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
                  <th className="px-4">#</th>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th className="text-end">Cantidad Vendida</th>
                  <th className="text-end">Ingresos Totales</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={item.product_id}>
                    <td className="px-4 text-muted">{index + 1}</td>
                    <td className="fw-bold">{item.product_name}</td>
                    <td className="text-muted small">{item.sku}</td>
                    <td className="text-end">
                      <Badge bg="primary" className="px-3">
                        {parseFloat(item.total_quantity).toFixed(2)}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold text-success">
                      ${parseFloat(item.total_revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <Package size={48} className="text-muted mb-3 opacity-25" />
              <h5 className="text-muted">No hay ventas en este período</h5>
              <p className="text-muted small">
                Selecciona un período diferente o verifica que haya ventas registradas
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProductSalesReport;
