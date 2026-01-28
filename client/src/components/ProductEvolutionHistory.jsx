import { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, DollarSign, Package, ShoppingCart, Calendar } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProductEvolutionHistory = ({ show, onHide, product }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(90);
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    if (show && product) {
      fetchEvolutionData();
    }
  }, [show, product, days, period]);

  const fetchEvolutionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/sales/product-evolution/${product.id}`,
        {
          params: { days, period },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Evolution data:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error al obtener historial de evolución:', error);
      setError(error.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (period === 'month') {
        return format(date, 'MMM yyyy', { locale: es });
      } else if (period === 'week') {
        return format(date, 'dd MMM', { locale: es });
      } else {
        return format(date, 'dd/MM', { locale: es });
      }
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'growing':
        return <TrendingUp className="text-success" size={20} />;
      case 'declining':
        return <TrendingDown className="text-danger" size={20} />;
      default:
        return <Minus className="text-warning" size={20} />;
    }
  };

  const getTrendBadge = (direction) => {
    switch (direction) {
      case 'growing':
        return <Badge bg="success">En Crecimiento</Badge>;
      case 'declining':
        return <Badge bg="danger">En Declive</Badge>;
      default:
        return <Badge bg="warning">Estable</Badge>;
    }
  };

  // Preparar datos para los gráficos
  const chartData = data?.salesEvolution?.map(item => ({
    period: formatDate(item.period),
    quantity: parseFloat(item.quantity || 0),
    revenue: parseFloat(item.revenue || 0),
    avgPrice: parseFloat(item.avg_price || 0),
    salesCount: parseInt(item.sales_count || 0)
  })) || [];

  const priceChartData = data?.priceChanges?.map(item => ({
    date: formatDate(item.date),
    priceSell: parseFloat(item.price_sell || 0),
    priceCost: parseFloat(item.price_cost || 0),
    sellChange: parseFloat(item.sell_change || 0),
    costChange: parseFloat(item.cost_change || 0)
  })) || [];

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Historial de Evolución - {product?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando historial...</p>
          </div>
        ) : data ? (
          <>
            {/* Filtros */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Período de Tiempo</Form.Label>
                  <Form.Select value={days} onChange={(e) => setDays(e.target.value)}>
                    <option value={7}>Últimos 7 días</option>
                    <option value={30}>Últimos 30 días</option>
                    <option value={90}>Últimos 90 días</option>
                    <option value={180}>Últimos 6 meses</option>
                    <option value={365}>Último año</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Agrupación</Form.Label>
                  <Form.Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                    <option value="day">Diaria</option>
                    <option value="week">Semanal</option>
                    <option value="month">Mensual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Tarjetas de Estadísticas */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="text-center h-100">
                  <Card.Body>
                    <Package className="text-primary mb-2" size={32} />
                    <h6 className="text-muted mb-1">Total Vendido</h6>
                    <h4 className="mb-0">{data.stats.totalQuantity.toFixed(2)}</h4>
                    <small className="text-muted">
                      Promedio: {data.stats.averageDaily.toFixed(2)}/día
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center h-100">
                  <Card.Body>
                    <DollarSign className="text-success mb-2" size={32} />
                    <h6 className="text-muted mb-1">Ingresos Totales</h6>
                    <h4 className="mb-0">{formatCurrency(data.stats.totalRevenue)}</h4>
                    <small className="text-muted">
                      Precio Prom: {formatCurrency(data.stats.weightedAvgPrice)}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center h-100">
                  <Card.Body>
                    <ShoppingCart className="text-info mb-2" size={32} />
                    <h6 className="text-muted mb-1">Ventas Realizadas</h6>
                    <h4 className="mb-0">{data.stats.totalSales}</h4>
                    <small className="text-muted">
                      {data.stats.totalSales > 0 
                        ? (data.stats.totalQuantity / data.stats.totalSales).toFixed(2) 
                        : 0} unid/venta
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center h-100">
                  <Card.Body>
                    <Calendar className="text-warning mb-2" size={32} />
                    <h6 className="text-muted mb-1">Tendencia</h6>
                    <div className="d-flex justify-content-center align-items-center mb-2">
                      {getTrendIcon(data.trends.trendDirection)}
                      <span className="ms-2 h4 mb-0">
                        {Math.abs(data.trends.salesTrend).toFixed(1)}%
                      </span>
                    </div>
                    {getTrendBadge(data.trends.trendDirection)}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Estadísticas de Precio */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Evolución de Precios</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <small className="text-muted">Precio Venta Actual</small>
                      <h5 className="text-primary">{formatCurrency(data.priceStats.currentPrice)}</h5>
                      <small className="text-muted">Precio Costo Actual</small>
                      <h6 className="text-secondary">{formatCurrency(data.priceStats.currentCost)}</h6>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <small className="text-muted">Rango Histórico Venta</small>
                      <h6>
                        {formatCurrency(data.priceStats.minHistoricalPriceSell)} - {formatCurrency(data.priceStats.maxHistoricalPriceSell)}
                      </h6>
                      <small className="text-muted">Rango Histórico Costo</small>
                      <h6 className="text-secondary">
                        {formatCurrency(data.priceStats.minHistoricalPriceCost)} - {formatCurrency(data.priceStats.maxHistoricalPriceCost)}
                      </h6>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <small className="text-muted">Incremento Total</small>
                      <h5 className={data.priceStats.priceIncrease >= 0 ? 'text-success' : 'text-danger'}>
                        {data.priceStats.priceIncrease >= 0 ? '+' : ''}{data.priceStats.priceIncrease.toFixed(2)}%
                      </h5>
                      <small className="text-muted">{data.priceStats.priceChangesCount} cambios</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Gráfico de Evolución de Ventas */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Evolución de Ventas (Cantidad)</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#0d6efd" name="Cantidad Vendida" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Gráfico de Ingresos */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Evolución de Ingresos</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#198754" 
                      strokeWidth={2}
                      name="Ingresos"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Gráfico de Evolución de Precios */}
            {priceChartData.length >= 1 && (
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Historial de Cambios de Precio</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={priceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="stepAfter" 
                        dataKey="priceSell" 
                        stroke="#fd7e14" 
                        strokeWidth={2}
                        name="Precio de Venta"
                        dot={{ r: 5 }}
                      />
                      <Line 
                        type="stepAfter" 
                        dataKey="priceCost" 
                        stroke="#0d6efd" 
                        strokeWidth={2}
                        name="Precio de Costo"
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            )}
          </>
        ) : error ? (
          <div className="text-center py-5">
            <div className="text-danger mb-3">
              <h5>Error al cargar datos</h5>
              <p>{error}</p>
            </div>
            <Button variant="primary" onClick={fetchEvolutionData}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-muted">No hay datos disponibles para este producto en el período seleccionado.</p>
            <small className="text-muted">Este producto puede no tener ventas registradas.</small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductEvolutionHistory;
