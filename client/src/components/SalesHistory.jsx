import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Badge, Row, Col, Form, InputGroup, Pagination, Card, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, User, Calendar, Search, Filter, Printer, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Ticket from './Ticket';
import socket from '../socket';
import { db } from '../db/localDb';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCustomers, setAllCustomers] = useState([]);
  const componentRef = React.useRef(null);

  // Estados de Filtros
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterSeller, setFilterSeller] = useState('');
  const [filterCustomer, setFilterCustomer] = useState(''); // El filtro aplicado final
  const [customerSearch, setCustomerSearch] = useState(''); // El texto que se escribe
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSelectedIndex, setCustomerSelectedIndex] = useState(0);
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sales/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchCustomers();
    socket.on('sales_updated', fetchHistory);
    return () => socket.off('sales_updated');
  }, []);

  const fetchCustomers = async () => {
    const custs = await db.customers.toArray();
    setAllCustomers(custs);
  };

  const handleCustomerSearch = (val) => {
    setCustomerSearch(val);
    if (val.trim()) {
      const filtered = allCustomers.filter(c => 
        (c.name || '').toLowerCase().includes(val.toLowerCase()) ||
        (c.phone && c.phone.includes(val))
      ).slice(0, 5);
      setCustomerResults(filtered);
      setCustomerSelectedIndex(0);
    } else {
      setCustomerResults([]);
    }
  };

  const handleCustomerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCustomerSelectedIndex(prev => (prev + 1) % customerResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCustomerSelectedIndex(prev => (prev - 1 + customerResults.length) % customerResults.length);
    } else if (e.key === 'Enter' && customerResults.length > 0) {
      e.preventDefault();
      selectCustomer(customerResults[customerSelectedIndex]);
    } else if (e.key === 'Escape') {
      setCustomerResults([]);
    }
  };

  const selectCustomer = (customer) => {
    setFilterCustomer(customer.name);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const openDetail = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  // Lógica de Filtrado
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesDate = !filterDate || isSameDay(new Date(sale.created_at), startOfDay(new Date(filterDate + 'T00:00:00')));
      const matchesSeller = !filterSeller || (sale.seller_name || '').toLowerCase().includes(filterSeller.toLowerCase());
      const matchesCustomer = !filterCustomer || (sale.customer_name || '').toLowerCase().includes(filterCustomer.toLowerCase());
      const matchesPayment = !filterPayment || sale.payment_method === filterPayment;
      const matchesStatus = !filterStatus || (sale.status || 'completado') === filterStatus;

      return matchesDate && matchesSeller && matchesCustomer && matchesPayment && matchesStatus;
    });
  }, [sales, filterDate, filterSeller, filterCustomer, filterPayment, filterStatus]);

  // Lista única de vendedores para el select (opcional, aquí usamos input para mayor flexibilidad)
  const sellers = useMemo(() => {
    const unique = new Set(sales.map(s => s.seller_name).filter(Boolean));
    return Array.from(unique);
  }, [sales]);

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterSeller, filterCustomer, filterPayment, filterStatus]);

  if (loading) return <div className="text-center py-5">Cargando historial...</div>;

  return (
    <div className="mt-3">
      {/* Panel de Filtros */}
      <Card className="border-0 shadow-sm mb-4 bg-light">
        <Card.Body>
          <Row className="gy-3">
            <Col md={3}>
              <Form.Label className="small fw-bold"><Calendar size={14} className="me-1"/> Fecha</Form.Label>
              <Form.Control 
                type="date" 
                size="sm" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold"><User size={14} className="me-1"/> Vendedor</Form.Label>
              <Form.Select size="sm" value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)}>
                <option value="">Todos</option>
                {sellers.map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-bold"><Search size={14} className="me-1"/> Cliente</Form.Label>
              <div className="position-relative">
                <Form.Control 
                  type="text" 
                  size="sm" 
                  placeholder="Escriba para buscar..." 
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onKeyDown={handleCustomerKeyDown}
                  onBlur={() => setTimeout(() => setCustomerResults([]), 200)}
                />
                {customerResults.length > 0 && (
                  <ListGroup className="position-absolute w-100 shadow mt-1 border" style={{ zIndex: 1000 }}>
                    {customerResults.map((c, idx) => (
                      <ListGroup.Item 
                        key={idx} 
                        action 
                        className={customerSelectedIndex === idx ? 'bg-primary text-white py-1' : 'py-1'}
                        onClick={() => selectCustomer(c)}
                      >
                        <div className="small fw-bold">{c.name}</div>
                        {c.phone && <div className="x-small opacity-75">{c.phone}</div>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
                {filterCustomer && (
                  <div className="d-flex align-items-center justify-content-between mt-1 bg-white border border-info rounded-pill px-2 py-0 shadow-sm" style={{ borderStyle: 'dashed' }}>
                    <span className="x-small text-primary text-truncate">Filtrando: <b>{filterCustomer}</b></span>
                    <Button variant="link" size="sm" className="p-0 text-danger ms-1" onClick={() => setFilterCustomer('')}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                )}
              </div>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">💰 Pago</Form.Label>
              <Form.Select size="sm" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                <option value="">Cualquiera</option>
                <option value="Efectivo">Efectivo</option>
                <option value="MP">Mercado Pago</option>
                <option value="Cta Cte">Cta. Cte.</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">📌 Estado</Form.Label>
              <Form.Select size="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Ambos</option>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
              </Form.Select>
            </Col>
          </Row>
          <div className="mt-2 text-end">
            <Button variant="link" size="sm" className="text-muted p-0" onClick={() => {
              setFilterDate('');
              setFilterSeller('');
              setFilterCustomer('');
              setCustomerSearch('');
              setFilterPayment('');
              setFilterStatus('');
            }}>Limpiar Filtros</Button>
          </div>
        </Card.Body>
      </Card>

      <Table hover responsive className="align-middle border shadow-sm rounded overflow-hidden">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Vendedor</th>
            <th>Cliente</th>
            <th>Pago</th>
            <th>Estado</th>
            <th className="text-end">Total</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.map((sale) => (
            <tr key={sale.id}>
              <td>
                <div className="small">
                  {format(new Date(sale.created_at), "dd/MM/yyyy, HH:mm", { locale: es })}hs
                </div>
              </td>
              <td>
                <Badge bg="info" className="fw-normal text-dark px-2 py-1">
                  {sale.seller_name || '---'}
                </Badge>
              </td>
              <td className="fw-bold">{sale.customer_name || <span className="text-muted italic small">Anónimo</span>}</td>
              <td>
                <Badge bg={
                  sale.payment_method === 'Cta Cte' ? 'danger' : 
                  sale.payment_method === 'MP' ? 'primary' : 'success'
                }>
                  {sale.payment_method || 'Efectivo'}
                </Badge>
              </td>
              <td>
                <Badge bg={sale.status === 'pendiente' ? 'warning' : 'success'} text={sale.status === 'pendiente' ? 'dark' : 'white'}>
                  {sale.status || 'completado'}
                </Badge>
              </td>
              <td className="text-end fw-bold text-primary">${Number(sale.total || 0).toFixed(2)}</td>
              <td className="text-center">
                <Button variant="outline-primary" size="sm" onClick={() => openDetail(sale)}>
                   Ver Detalle
                </Button>
              </td>
            </tr>
          ))}
          {currentSales.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-5 text-muted">
                <Filter size={48} className="mb-3 opacity-25" />
                <p>No se encontraron ventas con los filtros seleccionados.</p>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSales.length)} de {filteredSales.length} ventas
          </div>
          <Pagination className="mb-0">
            <Pagination.Prev 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            />
            {[...Array(totalPages)].map((_, idx) => (
              <Pagination.Item 
                key={idx + 1} 
                active={idx + 1 === currentPage}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Modal Detalle */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle de Venta</Modal.Title>
          <Button 
            variant="outline-dark" 
            size="sm" 
            className="ms-auto me-3 d-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={16} /> Imprimir Ticket / PDF
          </Button>
        </Modal.Header>
        <Modal.Body>
          {selectedSale && (
            <>
              <div className="bg-light p-3 rounded mb-4">
                <Row className="gy-2">
                  <Col sm={4}>
                    <div className="text-muted small mb-1">📅 Fecha y Hora</div>
                    <div className="fw-bold">{format(new Date(selectedSale.created_at), "dd/MM/yyyy - HH:mm", { locale: es })}hs</div>
                  </Col>
                  <Col sm={4} className="text-sm-center">
                    <div className="text-muted small mb-1">👤 Vendedor</div>
                    <div className="fw-bold text-primary">{selectedSale.seller_name || 'Desconocido'}</div>
                  </Col>
                  <Col sm={4} className="text-sm-end">
                    <div className="text-muted small mb-1">💰 Pago</div>
                    <Badge bg={
                      selectedSale.payment_method === 'Cta Cte' ? 'danger' : 
                      selectedSale.payment_method === 'MP' ? 'primary' : 'success'
                    }>{selectedSale.payment_method || 'Efectivo'}</Badge>
                  </Col>
                  <Col sm={12}>
                    <hr className="my-2 opacity-10" />
                    <div className="text-muted small mb-1">🤝 Cliente</div>
                    <div className="fw-bold">{selectedSale.customer_name || 'Anónimo'}</div>
                  </Col>
                </Row>
              </div>

              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-end">P. Lista</th>
                    <th className="text-end">Desc.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.product_name}
                        {item.discount_amount > 0 && (
                          <Badge bg="success" className="ms-2 extra-small">OFERTA</Badge>
                        )}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end text-muted small">${(Number(item.price_unit) + Number(item.discount_amount)).toFixed(2)}</td>
                      <td className="text-end text-success">${Number(item.discount_amount).toFixed(2)}</td>
                      <td className="text-end fw-bold">${item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {selectedSale.items.reduce((acc, current) => acc + (Number(current.discount_amount) * Number(current.quantity)), 0) > 0 && (
                    <tr className="table-success opacity-75">
                      <th colSpan="4" className="text-end small">AHORRO TOTAL</th>
                      <th className="text-end small">-${selectedSale.items.reduce((acc, current) => acc + (Number(current.discount_amount) * Number(current.quantity)), 0).toFixed(2)}</th>
                    </tr>
                  )}
                  <tr>
                    <th colSpan="4" className="text-end">TOTAL</th>
                    <th className="text-end text-primary h5">${Number(selectedSale.total || 0).toFixed(2)}</th>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>

      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        <Ticket ref={componentRef} sale={selectedSale} />
      </div>
    </div>
  );
};

export default SalesHistory;
