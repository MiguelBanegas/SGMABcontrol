import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, InputGroup, Form, Badge, ListGroup } from 'react-bootstrap';
import { Plus, Search, Package, Image as ImageIcon, TrendingUp, Camera } from 'lucide-react';
import axios from 'axios';
import ProductModal from './ProductModal';
import BarcodeScanner from './BarcodeScanner';
import socket from '../socket';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showScanner, setShowScanner] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchResultsRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const res = await axios.get('/api/products/top-sellers');
      setTopSellers(res.data);
    } catch (err) {
      console.error('Error al cargar top sellers:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTopSellers();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      console.log('Catálogo actualizado via Socket.io');
      fetchProducts();
      fetchTopSellers();
      if (editingProduct && editingProduct.sku) {
        axios.get(`/api/products/sku/${editingProduct.sku}`)
          .then(res => {
            if (res.data) setEditingProduct(res.data);
          })
          .catch(err => {
            // Si el producto fue desactivado (404), ignorar silenciosamente
            if (err.response?.status !== 404) {
              console.error('Error refreshing editing product:', err);
            }
          });
      }
    };

    socket.on('catalog_updated', handleUpdate);
    return () => socket.off('catalog_updated', handleUpdate);
  }, [editingProduct]);

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

  const filteredProducts = searchTerm.length >= 3 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term.length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        const startTime = performance.now();
        
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/products/search?q=${encodeURIComponent(term)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const endTime = performance.now();
          const searchTime = (endTime - startTime).toFixed(2);
          console.log(`🔍 Búsqueda Stock (server): ${searchTime}ms - ${response.data.length} resultados`);
          
          setSearchResults(response.data);
          setSelectedIndex(response.data.length > 0 ? 0 : -1);
        } catch (error) {
          console.error('Error en búsqueda:', error);
          setSearchResults([]);
          setSelectedIndex(-1);
        }
      }, 100); // 100ms de debounce
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = async (e) => {
    if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleEditProduct(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Enter' && searchTerm.length > 0) {
      // Búsqueda exacta por SKU para escáner
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/products/sku/${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          handleEditProduct(response.data);
        }
      } catch (error) {
        console.log('Producto no encontrado');
      }
    }
  };

  const handleCameraScan = async (decodedText) => {
    setShowScanner(false);
    setSearchTerm(decodedText);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/products/sku/${decodedText}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        handleEditProduct(response.data);
      }
    } catch (error) {
      console.log('Producto no encontrado');
    }
  };

  return (
    <div className="py-2">
      <Row className="mb-3">
        <Col>
          <h2 className="d-flex align-items-center mb-0">
            <Package className="me-2 text-primary" /> Inventario de Productos
          </h2>
        </Col>
      </Row>

      <Row className="mb-4 align-items-center">
        <Col md={10} lg={8} className="position-relative">
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre o SKU..."
              className="border-start-0 border-end-0"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              ref={searchInputRef}
              autoFocus
            />
            <InputGroup.Text className="bg-white border-start-0">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="border-0 p-0" 
                onClick={() => setShowScanner(true)}
              >
                <Camera size={20} />
              </Button>
            </InputGroup.Text>
          </InputGroup>

          {searchResults.length > 0 && (
            <ListGroup 
              ref={searchResultsRef}
              className="position-absolute w-100 shadow-lg mt-1 custom-scrollbar" 
              style={{ 
                zIndex: 1050, 
                left: 12, 
                width: 'calc(100% - 24px)',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              {searchResults.map((p, idx) => (
                <ListGroup.Item
                  key={p.id}
                  action
                  active={idx === selectedIndex}
                  onClick={() => handleEditProduct(p)}
                  className="d-flex align-items-center"
                >
                  <div className="me-3" style={{ width: '140px', height: '140px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #eee', flexShrink: 0 }}>
                    {p.image_url ? (
                      <img src={`${p.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="bg-light w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                        <ImageIcon size={40} className="opacity-25" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold fs-4">{p.name}</div>
                    <div className={`${idx === selectedIndex ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.9rem' }}>SKU: {p.sku} | Stock: {Math.floor(p.stock)}</div>
                  </div>
                  <div className={`fw-bold h3 mb-0 ${idx === selectedIndex ? 'text-warning' : 'text-primary'}`}>${p.price_sell}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => { setEditingProduct(null); setShowModal(true); }} className="d-flex align-items-center rounded-pill px-4 shadow-sm ms-auto">
            <Plus size={20} className="me-1" /> Nuevo Producto
          </Button>
        </Col>
      </Row>

      {searchTerm.length < 3 && topSellers.length > 0 && (
        <div className="mb-5">
          <h5 className="mb-3 d-flex align-items-center text-secondary">
            <TrendingUp size={20} className="me-2 text-success" /> Los 20 Más Vendidos
          </h5>
          <div className="d-flex overflow-auto pb-3 gap-3" style={{ scrollbarWidth: 'thin' }}>
            {topSellers.map(product => (
              <Card 
                key={product.id} 
                className="border-0 shadow-sm cursor-pointer flex-shrink-0" 
                style={{ width: '160px', cursor: 'pointer' }}
                onClick={() => handleEditProduct(product)}
              >
                <div style={{ height: '120px', overflow: 'hidden' }}>
                  {product.image_url ? (
                    <img src={`${product.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="bg-light w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                      <ImageIcon size={32} className="opacity-25" />
                    </div>
                  )}
                </div>
                <Card.Body className="p-2">
                  <small className="d-block text-truncate fw-bold">{product.name}</small>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className="text-primary">${product.price_sell}</small>
                    <Badge bg="success" size="sm" style={{ fontSize: '0.65rem' }}>Top</Badge>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {searchTerm.length >= 3 && (
        <h5 className="mb-3 text-muted">Resultados de búsqueda ({filteredProducts.length})</h5>
      )}

      <Row>
        {filteredProducts.map(product => (
          <Col key={product.id} md={6} lg={4} xl={3} className="mb-4">
            <Card 
              className="h-100 border-0 product-card overflow-hidden shadow-sm cursor-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => handleEditProduct(product)}
            >
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                {product.image_url ? (
                  <img 
                    src={`${product.image_url}`} 
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="bg-light w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                    <ImageIcon size={48} className="mb-2 opacity-25" />
                    <small>Sin Imagen</small>
                  </div>
                )}
                {product.promo_type && product.promo_type !== 'none' && (
                  <div className="position-absolute top-0 start-0 m-2">
                    {product.promo_type === 'price' && (
                      <Badge bg="success">💰 Oferta</Badge>
                    )}
                    {product.promo_type === 'quantity' && product.promo_buy && product.promo_pay && (
                      <Badge bg="danger">🔥 {product.promo_buy}×{product.promo_pay}</Badge>
                    )}
                    {product.promo_type === 'both' && (
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="success" className="small">💰 ${product.price_offer}</Badge>
                        <Badge bg="danger" className="small">🔥 {product.promo_buy}×{product.promo_pay}</Badge>
                      </div>
                    )}
                  </div>
                )}
                <Badge bg="dark" className="position-absolute top-0 end-0 m-2 opacity-75">
                  SKU: {product.sku}
                </Badge>
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h6 mb-2 text-truncate" title={product.name}>{product.name}</Card.Title>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-primary font-weight-bold h5 mb-0">${product.price_sell}</div>
                  <Badge bg={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"} pill>
                    Stock: {Math.floor(product.stock)}
                  </Badge>
                </div>
                <InputGroup size="sm" className="mt-auto">
                  <InputGroup.Text className="bg-light border-end-0">
                    <Package size={14} />
                  </InputGroup.Text>
                  <Form.Control 
                    type="number" 
                    placeholder="+/- stock"
                    className="border-start-0 border-end-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        const adjustment = parseFloat(e.target.value);
                        if (!isNaN(adjustment) && adjustment !== 0) {
                          const newStock = Math.max(0, product.stock + adjustment);
                          axios.patch(`/api/products/${product.id}`, 
                            { stock: newStock },
                            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                          ).then(() => {
                            e.target.value = '';
                            fetchProducts();
                            fetchTopSellers();
                          }).catch(err => console.error('Error updating stock:', err));
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.target.closest('.input-group').querySelector('input[type="number"]');
                      const adjustment = parseFloat(input.value);
                      if (!isNaN(adjustment) && adjustment !== 0) {
                        const newStock = Math.max(0, product.stock + adjustment);
                        axios.patch(`/api/products/${product.id}`, 
                          { stock: newStock },
                          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                        ).then(() => {
                          input.value = '';
                          fetchProducts();
                          fetchTopSellers();
                        }).catch(err => console.error('Error updating stock:', err));
                      }
                    }}
                  >
                    ✓
                  </Button>
                </InputGroup>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <ProductModal 
        show={showModal} 
        handleClose={() => { 
          setShowModal(false); 
          setEditingProduct(null); // Limpiar editingProduct al cerrar
        }} 
        refreshProducts={() => { fetchProducts(); fetchTopSellers(); }}
        refreshCategories={fetchCategories}
        categories={categories}
        allProducts={products}
        editProduct={editingProduct}
      />

      {showScanner && (
        <BarcodeScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

export default Stock;
