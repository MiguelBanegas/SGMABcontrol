import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Table, ListGroup, Badge, Modal } from 'react-bootstrap';
import { MessageSquare, Search, Barcode, Trash2, Plus, Minus, ShoppingCart, Wifi, WifiOff } from 'lucide-react';
import { db, syncCatalog, syncCustomers } from '../db/localDb';
import { syncOfflineSales } from '../db/syncManager';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import socket from '../socket';
import CustomerModal from './CustomerModal';
import { User, UserPlus } from 'lucide-react';

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
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSelectedIndex, setCustomerSelectedIndex] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const customerInputRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [currentWeightProduct, setCurrentWeightProduct] = useState(null);
  const [inputWeight, setInputWeight] = useState('');
  const weightInputRef = useRef(null);

  // Refs para evitar clausuras obsoletas en el listener global de F10
  const cartRef = useRef(cart);
  const selectedCustomerRef = useRef(selectedCustomer);
  const paymentMethodRef = useRef(paymentMethod);
  const customersRef = useRef(customers);

  useEffect(() => {
    cartRef.current = cart;
    selectedCustomerRef.current = selectedCustomer;
    paymentMethodRef.current = paymentMethod;
    customersRef.current = customers;
  }, [cart, selectedCustomer, paymentMethod, customers]);

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
      syncOfflineSales();
      axios.get('/api/products')
        .then(res => syncCatalog(res.data))
        .catch(err => console.error('Error al sincronizar catálogo', err));
      
      const token = localStorage.getItem('token');
      axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setCustomers(res.data);
          syncCustomers(res.data);
          
          // Setear Consumidor Final por defecto si no hay uno seleccionado
          if (!selectedCustomerRef.current) {
            const defaultCustomer = res.data.find(c => c.name.toLowerCase().includes('cons. final'));
            if (defaultCustomer) {
              setSelectedCustomer(defaultCustomer);
            }
          }
        })
        .catch(err => console.error('Error al sincronizar clientes', err));
    }

    // Escuchar actualizaciones en tiempo real
    socket.on('catalog_updated', () => {
      console.log('Recibida notificación de catálogo actualizado');
      axios.get('/api/products')
        .then(res => syncCatalog(res.data))
        .catch(err => console.error('Error al re-sincronizar catálogo', err));
    });

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('keydown', handleGlobalKeyDown);
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
    if (product.sell_by_weight) {
      setCurrentWeightProduct(product);
      setInputWeight('');
      setShowWeightModal(true);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedIndex(-1);
      // El foco se hará en el modal mediante useEffect o onEntered
      return;
    }

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

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Ingrese un peso válido');
      return;
    }

    const product = currentWeightProduct;
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + weight } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: weight }]);
    }

    setShowWeightModal(false);
    setCurrentWeightProduct(null);
    setInputWeight('');
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

  const handleCustomerSearch = async (term) => {
    setCustomerSearch(term);
    if (term.length > 0) {
      const results = await db.customers
        .filter(c => c.name.toLowerCase().includes(term.toLowerCase()))
        .limit(5)
        .toArray();
      setCustomerResults(results);
      setCustomerSelectedIndex(results.length > 0 ? 0 : -1);
    } else {
      setCustomerResults([]);
      setCustomerSelectedIndex(-1);
    }
  };

  const handleCustomerKeyDown = (e) => {
    if (customerResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCustomerSelectedIndex(prev => (prev < customerResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomerSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && customerSelectedIndex >= 0) {
        e.preventDefault();
        selectCustomer(customerResults[customerSelectedIndex]);
      }
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleCheckout = async () => {
    // Usar valores de los refs para asegurar que el listener de F10 (que es una clausura) tenga los datos actuales
    const currentCart = cartRef.current;
    const currentCustomer = selectedCustomerRef.current;
    const currentPaymentMethod = paymentMethodRef.current;
    const currentTotal = currentCart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);

    if (currentCart.length === 0) return;

    if (currentPaymentMethod === 'Cta Cte' && !currentCustomer) {
      toast.error('Debe seleccionar un cliente para Cuenta Corriente');
      customerInputRef.current?.focus();
      return;
    }

    // Si no hay cliente y no es Cta Cte, avisar una vez si el foco no está en el buscador de clientes
    if (!currentCustomer && document.activeElement !== customerInputRef.current) {
      customerInputRef.current?.focus();
      toast('¿Desea agregar un cliente? Presione F10 de nuevo para vender como Anónimo', { icon: '👤', duration: 4000 });
      return;
    }

    const saleData = {
      id: uuidv4(),
      items: currentCart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_unit: item.price_sell,
        subtotal: item.price_sell * item.quantity
      })),
      total: currentTotal,
      customer_id: currentCustomer?.id || null,
      payment_method: currentPaymentMethod,
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline) {
        const token = localStorage.getItem('token');
        await axios.post('/api/sales', saleData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      await db.offlineSales.add({ ...saleData, status: isOnline ? 'synced' : 'pending' });
      
      setCart([]);
      
      // Intentar resetear al cliente Cons. Final por defecto usando el ref más actualizado
      const defaultCustomer = customersRef.current.find(c => c.name.toLowerCase().includes('cons. final'));
      setSelectedCustomer(defaultCustomer || null);
      
      setPaymentMethod('Efectivo');
      localStorage.removeItem('pending_sale');
      
      // Hacer foco de nuevo en el buscador de productos para la siguiente venta
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }

      toast.success('Venta realizada con éxito' + (isOnline ? '' : ' (Modo Offline)'), {
        duration: 4000,
        icon: '💰',
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la venta');
    }
  };

  const handleSendNote = async () => {
    if (!noteMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/notifications', { message: noteMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Nota enviada al administrador');
      setNoteMessage('');
      setShowNoteModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la nota');
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
                            {!item.sell_by_weight && (
                              <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></Button>
                            )}
                            <span className="fw-bold" style={{ width: item.sell_by_weight ? 'auto' : '30px' }}>
                              {item.sell_by_weight ? `${parseFloat(item.quantity).toFixed(3)} Kg` : item.quantity}
                            </span>
                            {!item.sell_by_weight && (
                              <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></Button>
                            )}
                            {item.sell_by_weight && (
                                <Button variant="light" size="sm" onClick={() => {
                                    setCurrentWeightProduct(item);
                                    setInputWeight('');
                                    setShowWeightModal(true);
                                }}><Plus size={14} /></Button>
                            )}
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

            {/* Selector de Cliente */}
            <div className="mb-4">
              <Form.Label className="small opacity-75">Cliente</Form.Label>
              {selectedCustomer ? (
                <div className="d-flex align-items-center justify-content-between bg-dark bg-opacity-50 p-2 rounded border border-secondary">
                  <div className="d-flex align-items-center">
                    <User size={18} className="me-2 text-info" />
                    <span>{selectedCustomer.name}</span>
                  </div>
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={() => setSelectedCustomer(null)}>Cambiar</Button>
                </div>
              ) : (
                <div className="position-relative">
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-dark border-secondary text-white">
                      <User size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      ref={customerInputRef}
                      placeholder="Buscar cliente..."
                      className="bg-dark border-secondary text-white"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onKeyDown={handleCustomerKeyDown}
                    />
                    <Button variant="outline-info" onClick={() => setShowCustomerModal(true)}>
                      <UserPlus size={16} />
                    </Button>
                  </InputGroup>
                  {customerResults.length > 0 && (
                    <ListGroup className="position-absolute w-100 shadow-lg mt-1 border-secondary" style={{ zIndex: 1050, opacity: 1 }}>
                      {customerResults.map((c, idx) => (
                        <ListGroup.Item 
                          key={c.id} 
                          action 
                          size="sm"
                          className={`text-white border-secondary py-2 ${customerSelectedIndex === idx ? 'bg-primary' : 'bg-dark'}`}
                          style={{ backgroundColor: customerSelectedIndex === idx ? '#0d6efd' : '#212529' }}
                          onClick={() => selectCustomer(c)}
                        >
                          {c.name}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {customerSearch.length > 0 && customerResults.length === 0 && !showCustomerModal && (
                    <div className="x-small text-muted mt-1 text-center">Sin resultados.</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="d-flex justify-content-between h3 mb-4">
              <span>TOTAL</span>
              <span className="text-info">${total.toFixed(2)}</span>
            </div>

            <div className="mb-4">
              <Form.Label className="small opacity-75">Forma de Pago</Form.Label>
              <Form.Select 
                className="bg-dark border-secondary text-white border-2"
                value={paymentMethod}
                onChange={(e) => {
                  const newMethod = e.target.value;
                  if (newMethod === 'Cta Cte' && selectedCustomer?.name?.toLowerCase().includes('cons. final')) {
                    toast.error('No se permite Cuenta Corriente para Consumidor Final');
                    return;
                  }
                  setPaymentMethod(newMethod);
                }}
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="MP">📱 Mercado Pago</option>
                <option value="Cta Cte">💳 Cta. Cte.</option>
              </Form.Select>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-100 py-3 fw-bold shadow"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              FINALIZAR VENTA (F10)
            </Button>

            <Button 
              variant="outline-warning" 
              className="w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
              onClick={() => setShowNoteModal(true)}
            >
              <MessageSquare size={18} /> Dejar Nota / Aviso
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title>Enviar Nota al Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form.Group>
            <Form.Label>Mensaje / Faltante / Aviso</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              className="bg-dark border-secondary text-white"
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              placeholder="Ej: Faltan rollos de ticket, El producto X no tiene stock..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
          <Button variant="warning" onClick={handleSendNote}>Enviar Aviso</Button>
        </Modal.Footer>
      </Modal>

      <CustomerModal 
        show={showCustomerModal} 
        handleClose={() => setShowCustomerModal(false)}
        onCustomerCreated={(c) => {
          selectCustomer(c);
          setCustomers([...customers, c]);
          syncCustomers([...customers, c]);
        }}
      />

      <Modal 
        show={showWeightModal} 
        onHide={() => setShowWeightModal(false)} 
        centered
        onEntered={() => weightInputRef.current?.focus()}
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Ingresar Peso</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleWeightSubmit}>
          <Modal.Body>
            <div className="text-center mb-4">
               <h4 className="text-dark">{currentWeightProduct?.name}</h4>
               <div className="text-muted">Precio por Kg: ${currentWeightProduct?.price_sell}</div>
            </div>
            <Form.Group>
              <Form.Label className="fw-bold">Peso (Kg)</Form.Label>
              <InputGroup size="lg">
                <Form.Control 
                  ref={weightInputRef}
                  type="number" 
                  step="0.001"
                  placeholder="0.000"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  required
                />
                <InputGroup.Text>Kg</InputGroup.Text>
              </InputGroup>
              {inputWeight && !isNaN(parseFloat(inputWeight)) && (
                <div className="mt-3 text-center h3 text-primary">
                  Total: ${(parseFloat(inputWeight) * parseFloat(currentWeightProduct?.price_sell || 0)).toFixed(2)}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWeightModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Agregar al Carrito</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Sales;
