import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Table, ListGroup, Badge } from 'react-bootstrap';
import { Search, Barcode, Trash2, Plus, Minus, ShoppingCart, Wifi, WifiOff } from 'lucide-react';
import { db, syncCatalog } from '../db/localDb';
import { syncOfflineSales } from '../db/syncManager';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import socket from '../socket';

const Sales = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pending_sale');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scanInputRef = useRef(null);

  useEffect(() => {
    const handleStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncOfflineSales();
      }
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    if (navigator.onLine) {
      syncOfflineSales(); // Intento inicial
      axios.get('/api/products')
        .then(res => syncCatalog(res.data))
        .catch(err => console.error('Error al sincronizar catálogo', err));
    }

    // Escuchar actualizaciones en tiempo real
    socket.on('catalog_updated', () => {
      console.log('Recibida notificación de catálogo actualizado');
      axios.get('/api/products')
        .then(res => syncCatalog(res.data))
        .catch(err => console.error('Error al re-sincronizar catálogo', err));
    });

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      socket.off('catalog_updated');
    };
  }, []);

  // Persistencia de venta parcial
  useEffect(() => {
    localStorage.setItem('pending_sale', JSON.stringify(cart));
  }, [cart]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length > 1) {
      const results = await db.products
        .filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.sku.includes(term))
        .limit(5)
        .toArray();
      setSearchResults(results);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    scanInputRef.current?.focus();
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
        addToCart(searchResults[selectedIndex]);
      }
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);

  const handleCheckout = async () => {
    const saleData = {
      id: uuidv4(),
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_unit: item.price_sell,
        subtotal: item.price_sell * item.quantity
      })),
      total,
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline) {
        await axios.post('/api/sales', saleData);
      }
      // En cualquier caso guardamos en local por seguridad/offline logic
      await db.offlineSales.add({ ...saleData, status: isOnline ? 'synced' : 'pending' });
      setCart([]);
      localStorage.removeItem('pending_sale');
      toast.success('Venta realizada con éxito' + (isOnline ? '' : ' (Modo Offline)'), {
        duration: 4000,
        icon: '💰',
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la venta');
    }
  };

  return (
    <div className="pos-container py-2">
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <InputGroup size="lg" className="mb-3">
                <InputGroup.Text className="bg-white border-end-0">
                  <Barcode size={24} className="text-primary" />
                </InputGroup.Text>
                <Form.Control
                  ref={scanInputRef}
                  placeholder="Escanee código o busque producto..."
                  className="border-start-0"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>

              {searchResults.length > 0 && (
                <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1000, marginTop: '-15px' }}>
                  {searchResults.map((p, idx) => (
                    <ListGroup.Item 
                      key={p.id} 
                      action 
                      onClick={() => addToCart(p)}
                      className={`d-flex align-items-center justify-content-between p-3 ${selectedIndex === idx ? 'bg-primary text-white shadow' : ''}`}
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          {p.image_url ? <img src={`${p.image_url}`} style={{ width: '100%' }} /> : <Search size={20} />}
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="text-muted x-small">SKU: {p.sku}</div>
                        </div>
                      </div>
                      <div className="text-primary fw-bold">${p.price_sell}</div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              <div className="table-responsive mt-4" style={{ minHeight: '400px' }}>
                <Table hover align="middle">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Cod.</th>
                      <th>Producto</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td className="text-muted small">
                          ...{item.sku ? item.sku.slice(-3) : '---'}
                        </td>
                        <td>
                          <div className="fw-bold">{item.name}</div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></Button>
                            <span className="fw-bold" style={{ width: '30px' }}>{item.quantity}</span>
                            <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></Button>
                          </div>
                        </td>
                        <td className="text-end">${item.price_sell}</td>
                        <td className="text-end fw-bold">${(item.price_sell * item.quantity).toFixed(2)}</td>
                        <td className="text-end">
                          <Button variant="link" className="text-danger p-0" onClick={() => removeFromCart(item.id)}>
                            <Trash2 size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <ShoppingCart size={48} className="mb-3 opacity-25" />
                          <p>Escanee productos para comenzar la venta</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-dark text-white p-4 sticky-top" style={{ top: '2rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Resumen</h4>
              {isOnline ? (
                <Badge bg="success"><Wifi size={14} className="me-1" /> Online</Badge>
              ) : (
                <Badge bg="danger"><WifiOff size={14} className="me-1" /> Offline</Badge>
              )}
            </div>
            
            <div className="d-flex justify-content-between mb-2 opacity-75">
              <span>Items:</span>
              <span>{cart.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-3">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            <div className="d-flex justify-content-between h3 mb-5">
              <span>TOTAL</span>
              <span className="text-info">${total.toFixed(2)}</span>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-100 py-3 fw-bold shadow"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              FINALIZAR VENTA (F12)
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Sales;
