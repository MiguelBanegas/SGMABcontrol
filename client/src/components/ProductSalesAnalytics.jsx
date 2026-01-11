import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Row, Col, InputGroup, ListGroup, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Search, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductSalesAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Auto-scroll para mantener visible el item seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && searchResultsRef.current) {
      const selectedItem = searchResultsRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const searchProducts = async (term) => {
    if (term.length < 3) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/products/search?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const results = response.data.slice(0, 100);
      setSearchResults(results);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const fetchStats = async (productId, period) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sales/product-stats/${productId}?days=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setSearchResults([]);
    fetchStats(product.id, days);
  };

  const handlePeriodChange = (newDays) => {
    setDays(newDays);
    if (selectedProduct) {
      fetchStats(selectedProduct.id, newDays);
    }
  };

  const handleKeyDown = (e) => {
    if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectProduct(searchResults[selectedIndex]);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="py-3">
      <h4 className="mb-4">📊 Análisis de Ventas por Producto</h4>

      {/* Búsqueda de producto */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form.Label>Buscar Producto</Form.Label>
          <div className="position-relative">
            <InputGroup>
              <InputGroup.Text>
                <Search size={18} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                ref={searchInputRef}
                autoFocus
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchProducts(e.target.value);
                }}
                onKeyDown={handleKeyDown}
              />
            </InputGroup>

            {searchResults.length > 0 && (
              <ListGroup 
                ref={searchResultsRef}
                className="position-absolute w-100 shadow-lg mt-1 custom-scrollbar" 
                style={{ 
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {searchResults.map((product, idx) => (
                  <ListGroup.Item
                    key={product.id}
                    action
                    active={idx === selectedIndex}
                    onClick={() => handleSelectProduct(product)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <br />
                      <small className="text-muted">SKU: {product.sku}</small>
                    </div>
                    <Badge bg="primary">${product.price_sell}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Selector de período */}
      {selectedProduct && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Form.Label className="d-flex align-items-center gap-2">
              <Calendar size={18} />
              Período de análisis
            </Form.Label>
            <div className="d-flex gap-2">
              {[7, 15, 30, 60, 90].map((period) => (
                <Button
                  key={period}
                  variant={days === period ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handlePeriodChange(period)}
                >
                  {period} días
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Métricas */}
      {data && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="shadow-sm border-0 bg-primary text-white">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <small className="opacity-75">Total Vendido</small>
                      <h3 className="mb-0">{data.stats.totalQuantity.toFixed(2)}</h3>
                      <small>unidades</small>
                    </div>
                    <Package size={40} className="opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 bg-success text-white">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <small className="opacity-75">Ingresos Totales</small>
                      <h3 className="mb-0">${data.stats.totalRevenue.toFixed(2)}</h3>
                      <small>en {days} días</small>
                    </div>
                    <DollarSign size={40} className="opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 bg-info text-white">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <small className="opacity-75">Promedio Diario</small>
                      <h3 className="mb-0">{data.stats.averageDaily.toFixed(2)}</h3>
                      <small>unidades/día</small>
                    </div>
                    <TrendingUp size={40} className="opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Gráfico */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-4">📈 Evolución de Ventas - {data.product.name}</h5>
              {data.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label).toLocaleDateString('es-AR')}
                      formatter={(value, name) => {
                        if (name === 'Cantidad') return [value.toFixed(2), 'Unidades'];
                        if (name === 'Ingresos') return [`$${value.toFixed(2)}`, 'Ingresos'];
                        return value;
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="#0d6efd" 
                      strokeWidth={2}
                      name="Cantidad"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#198754" 
                      strokeWidth={2}
                      name="Ingresos"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <Package size={48} className="mb-3 opacity-25" />
                  <p>No hay datos de ventas en este período</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Estado inicial */}
      {!selectedProduct && (
        <Card className="shadow-sm border-0 bg-light">
          <Card.Body className="text-center py-5">
            <Search size={48} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">Busca un producto para ver sus estadísticas</h5>
            <p className="text-muted small">Escribe al menos 3 caracteres para buscar</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ProductSalesAnalytics;
