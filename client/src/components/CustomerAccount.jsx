import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button, Badge, InputGroup, Table, Alert } from 'react-bootstrap';
import { CreditCard, Search, DollarSign, TrendingUp, TrendingDown, Calendar, Printer, X, CheckCircle, Package, History, RefreshCcw } from 'lucide-react';
import { Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

const CustomerAccount = () => {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalDebt: 0, customersWithDebt: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [targetSaleId, setTargetSaleId] = useState(null);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [selectedDebts, setSelectedDebts] = useState([]); // Array of sale_ids
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [activeTab, setActiveTab] = useState('account');
  const [containerBalances, setContainerBalances] = useState([]);
  const [containerHistory, setContainerHistory] = useState([]);
  const [returnAmount, setReturnAmount] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/customer-accounts/balances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.customers);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    }
  };

  const fetchTransactions = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/customer-accounts/${customerId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
      setBalance(response.data.balance);
      setSelectedCustomer(response.data.customer);
      setSelectedDebts([]); // Reset selection when changing customer
      fetchContainerData(customerId);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      toast.error('Error al cargar transacciones');
    }
  };

  const fetchContainerData = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const [balancesRes, historyRes] = await Promise.all([
        axios.get(`/api/containers/customer/${customerId}/balances`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/containers/customer/${customerId}/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setContainerBalances(balancesRes.data);
      setContainerHistory(historyRes.data);
    } catch (error) {
      console.error('Error al cargar datos de envases:', error);
    }
  };

  const handleRecordReturn = async (e) => {
    e.preventDefault();
    if (!selectedContainer || !returnAmount || parseFloat(returnAmount) <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/containers/return/${selectedCustomer.id}`, {
        productId: selectedContainer.product_id,
        amount: parseFloat(returnAmount),
        description: 'Devolución manual en mostrador'
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Devolución registrada');
      setReturnAmount('');
      setSelectedContainer(null);
      fetchContainerData(selectedCustomer.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar devolución');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setPaymentAmount('');
    setPaymentDescription('');
    setSelectedTransactionForPayment(null);
    setSelectedDebts([]);
  };

  const handleSelectDebtToPay = (transaction, amount) => {
    setSelectedTransactionForPayment(transaction);
    setPaymentAmount(Number(amount).toFixed(2));
    setPaymentDescription(`Pago de deuda del ${formatDate(transaction.created_at)}`);
    
    // Scroll to form
    const formElement = document.getElementById('payment-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBatchPayment = () => {
    const totalToPay = transactions
      .filter(t => selectedDebts.includes(t.sale_id) && t.type === 'debt')
      .reduce((sum, t) => sum + Number(t.revalued_amount), 0);
    
    setPaymentAmount(totalToPay.toFixed(2));
    setPaymentDescription('Pago de deudas seleccionadas');
    setSelectedTransactionForPayment(null);

    // Scroll to form
    const formElement = document.getElementById('payment-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleDebtSelection = (saleId) => {
    setSelectedDebts(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const toggleSelectAll = () => {
    const pendings = transactions
      .filter(t => t.type === 'debt' && Number(t.revalued_amount) > 0)
      .map(t => t.sale_id);
    
    if (selectedDebts.length === pendings.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(pendings);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let payload = {
        amount: parseFloat(paymentAmount),
        description: paymentDescription
      };

      // Si hay deudas seleccionadas, enviamos el lote
      if (selectedDebts.length > 0) {
        const batchPayments = transactions
          .filter(t => selectedDebts.includes(t.sale_id) && t.type === 'debt')
          .map(t => ({
            sale_id: t.sale_id,
            amount: t.revalued_amount,
            description: `Pago deuda revalorizada (Venta ${t.sale_id.substring(0,8)})`
          }));
        
        payload.batchPayments = batchPayments;
      } else if (selectedTransactionForPayment) {
        payload.sale_id = selectedTransactionForPayment.sale_id;
      }

      payload.payment_method = paymentMethod;

      await axios.post(`/api/customer-accounts/${selectedCustomer.id}/payments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Pago registrado exitosamente');
      setPaymentAmount('');
      setPaymentDescription('');
      setSelectedTransactionForPayment(null);
      setSelectedDebts([]);
      fetchTransactions(selectedCustomer.id);
      fetchCustomers();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      toast.error('Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAccount = async () => {
    if (!selectedCustomer) return;
    
    setIsPrinting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/print/account', {
        customer: selectedCustomer,
        balance: balance,
        transactions: transactions.slice(0, 20) // Imprimir solo las últimas 20 para no gastar tanto papel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Estado de cuenta enviado a imprimir');
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al enviar a la impresora');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleReprintTicket = async (transaction) => {
    if (!transaction.sale_id) return;
    try {
      const token = localStorage.getItem('token');
      // Re-fetch sale data to match ticket format
      const response = await axios.get(`/api/sales/${transaction.sale_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await axios.post('/api/print', { sale: response.data }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket enviado a la impresora');
    } catch (error) {
      console.error('Error al re-imprimir:', error);
      toast.error('Error al enviar a la impresora');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container fluid className="py-4" style={{ marginBottom: selectedDebts.length > 0 ? '100px' : '0' }}>
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <h2 className="mb-0"><CreditCard className="me-2" />Cuenta Corriente</h2>
        </Col>
        <Col md={8}>
          <div className="d-flex justify-content-end gap-3">
            <Card className="shadow-sm border-0 bg-danger text-white py-1 px-3" style={{ minWidth: '200px' }}>
              <div className="small opacity-75">Deuda Total Clientes</div>
              <h4 className="mb-0 fw-bold">${Number(summary.totalDebt).toFixed(2)}</h4>
            </Card>
            <Card className="shadow-sm border-0 bg-primary text-white py-1 px-3" style={{ minWidth: '150px' }}>
              <div className="small opacity-75">Clientes deudores</div>
              <h4 className="mb-0 fw-bold">{summary.customersWithDebt}</h4>
            </Card>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Lista de clientes */}
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Clientes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3">
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <ListGroup variant="flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filteredCustomers.map((customer) => (
                  <ListGroup.Item
                    key={customer.id}
                    action
                    active={selectedCustomer?.id === customer.id}
                    onClick={() => fetchTransactions(customer.id)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-bold">{customer.name}</div>
                      {customer.phone && (
                        <small className="text-muted">{customer.phone}</small>
                      )}
                    </div>
                    <Badge bg={customer.balance > 0 ? 'danger' : 'success'}>
                      ${Number(customer.balance).toFixed(2)}
                    </Badge>
                  </ListGroup.Item>
                ))}
                {filteredCustomers.length === 0 && (
                  <ListGroup.Item className="text-center text-muted">
                    No se encontraron clientes
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Detalle de cuenta */}
        <Col lg={8}>
          {selectedCustomer ? (
            <>
              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <h4>{selectedCustomer.name}</h4>
                      {selectedCustomer.email && <p className="text-muted mb-0">{selectedCustomer.email}</p>}
                      {selectedCustomer.phone && <p className="text-muted mb-0">{selectedCustomer.phone}</p>}
                    </Col>
                    <Col md={4} className="text-end">
                      <div className="text-muted small">Saldo Actual</div>
                      <h2 className={balance > 0 ? 'text-danger' : 'text-success'}>
                        ${Number(balance).toFixed(2)}
                      </h2>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3 custom-tabs"
                justify
              >
                <Tab eventKey="account" title={<span><DollarSign size={18} className="me-1"/>Cuenta Pesos</span>}>
                  <Card id="payment-form-card" className="shadow-sm mb-3">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">
                    <DollarSign size={20} className="me-2" />
                    {selectedDebts.length > 0 ? `Pagar ${selectedDebts.length} Deudas` : 'Registrar Pago'}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {(paymentDescription.startsWith('Pago de deuda') || selectedDebts.length > 0) && (
                    <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
                      <span>
                        {selectedDebts.length > 0 
                          ? `Registrando pago por ${selectedDebts.length} deudas seleccionadas.` 
                          : 'Registrando pago para una deuda específica.'}
                      </span>
                      <Button variant="link" size="sm" onClick={handleClearSelection}>Limpiar selección</Button>
                    </Alert>
                  )}
                  <Form onSubmit={handleRecordPayment}>
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Monto</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              required
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Método de Pago</Form.Label>
                          <Form.Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="MP">Mercado Pago</option>
                            <option value="Débito">Débito</option>
                            <option value="Crédito">Crédito</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Descripción (opcional)</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Pago parcial"
                            value={paymentDescription}
                            onChange={(e) => setPaymentDescription(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button type="submit" variant="success" className="w-100 mb-3" disabled={loading}>
                          {loading ? 'Guardando...' : 'Registrar'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>

              {/* Historial de transacciones */}
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><Calendar size={20} className="me-2" />Historial de Transacciones</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={handlePrintAccount}
                    disabled={isPrinting || transactions.length === 0}
                  >
                    <Printer size={16} className="me-1" /> 
                    {isPrinting ? 'Imprimiendo...' : 'Imprimir Resumen'}
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {transactions.length > 0 ? (
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Descripción</th>
                          <th className="text-center">Medio</th>
                          <th className="text-end">Monto Histórico</th>
                          <th className="text-end">Pagar HOY</th>
                          <th className="text-center">Acciones</th>
                          <th style={{ width: '50px' }} className="text-center">
                            <Form.Check 
                              type="checkbox"
                              style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                              checked={transactions.filter(t => t.type === 'debt' && Number(t.revalued_amount) > 0).length > 0 && selectedDebts.length === transactions.filter(t => t.type === 'debt' && Number(t.revalued_amount) > 0).length}
                              onChange={toggleSelectAll}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <React.Fragment key={transaction.id}>
                            <tr key={transaction.id} className={transaction.type === 'debt' && Number(transaction.revalued_amount) === 0 ? 'table-success opacity-75' : ''}>
                              <td>{formatDate(transaction.created_at)}</td>
                              <td style={{ whiteSpace: 'pre-line' }}>
                                {transaction.description && transaction.description.split(',').map((line, i) => (
                                  <div key={i}>{line.trim()}</div>
                                  ))}
                              </td>
                              <td className="text-center small">
                                {transaction.type === 'payment' && (
                                  <Badge bg="light" text="dark" className="border">
                                    {transaction.payment_method || 'Efectivo'}
                                  </Badge>
                                )}
                              </td>
                              <td className="text-end">
                                <Badge bg={transaction.type === 'debt' ? 'danger' : 'success'}>
                                  {transaction.type === 'debt' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                                </Badge>
                              </td>
                              <td className="text-end fw-bold">
                                {transaction.type === 'debt' && (
                                  <span className={Number(transaction.revalued_amount) > 0 ? 'text-danger' : 'text-success'}>
                                    ${Number(transaction.revalued_amount).toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {transaction.type === 'debt' && transaction.sale_id && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => setExpandedTransaction(expandedTransaction === transaction.id ? null : transaction.id)}
                                  >
                                    {expandedTransaction === transaction.id ? 'Cerrar' : 'Detalle'}
                                  </Button>
                                )}
                                {transaction.type === 'debt' && Number(transaction.revalued_amount) > 0 && (
                                  <Button 
                                    variant="success" 
                                    size="sm" 
                                    className="ms-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectDebtToPay(transaction, transaction.revalued_amount);
                                    }}
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </td>
                              <td className="text-center">
                                {transaction.type === 'debt' && Number(transaction.revalued_amount) > 0 && (
                                  <Form.Check 
                                    type="checkbox"
                                    style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                                    checked={selectedDebts.includes(transaction.sale_id)}
                                    onChange={() => toggleDebtSelection(transaction.sale_id)}
                                  />
                                )}
                              </td>
                            </tr>
                             {expandedTransaction === transaction.id && transaction.type === 'debt' && transaction.items && (
                               <tr className="table-secondary">
                                 <td colSpan={6} className="p-3">
                                  <div className="bg-white rounded p-3 shadow-sm border">
                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                                      <h6 className="mb-0">Detalle de la Venta (Precios Actualizados)</h6>
                                      <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        onClick={() => handleReprintTicket(transaction)}
                                      >
                                        <Printer size={14} className="me-1" /> Re-imprimir Original
                                      </Button>
                                    </div>
                                    <Table size="sm" responsive hover className="mb-3">
                                      <thead>
                                        <tr className="text-muted small border-bottom">
                                          <th>Producto</th>
                                          <th className="text-center">Cant.</th>
                                          <th className="text-end">P. Venta</th>
                                          <th className="text-end">P. Actual</th>
                                          <th className="text-end">Total Act.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transaction.items.map((item, idx) => (
                                          <tr key={idx} className="small align-middle">
                                            <td>{item.product_name}</td>
                                            <td className="text-center">{Number(item.quantity).toFixed(item.sell_by_weight ? 3 : 0)}</td>
                                            <td className="text-end text-muted small">${Number(item.price_unit).toFixed(2)}</td>
                                            <td className="text-end fw-bold text-primary">${Number(item.current_price_sell).toFixed(2)}</td>
                                            <td className="text-end fw-bold">${(Number(item.quantity) * Number(item.current_price_sell)).toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                    
                                    <div className="bg-light p-3 rounded border">
                                      <Row>
                                        <Col md={6}>
                                          <div className="small text-muted mb-1">Resumen Original:</div>
                                          <div className="d-flex justify-content-between mb-1">
                                            <span>Subtotal Original:</span>
                                            <span>${Number(transaction.original_sale?.subtotal || 0).toFixed(2)}</span>
                                          </div>
                                           <div className="d-flex justify-content-between mb-1">
                                             <span>Pagado al momento:</span>
                                             <span className="text-success">-${Number(transaction.original_sale?.amount_paid || 0).toFixed(2)}</span>
                                           </div>
                                           {transaction.original_sale?.credit_applied > 0 && (
                                             <div className="d-flex justify-content-between mb-1">
                                               <span>Crédito aplicado:</span>
                                               <span className="text-success">-${Number(transaction.original_sale.credit_applied).toFixed(2)}</span>
                                             </div>
                                           )}
                                          {transaction.linked_payments_sum > 0 && (
                                            <div className="d-flex justify-content-between mb-1">
                                              <span>Pagos posteriores:</span>
                                              <span className="text-success">-${Number(transaction.linked_payments_sum).toFixed(2)}</span>
                                            </div>
                                          )}
                                          <div className="d-flex justify-content-between fw-bold border-top pt-1">
                                            <span>Deuda Inicial:</span>
                                            <span className="text-danger">${Number(transaction.amount).toFixed(2)}</span>
                                          </div>
                                        </Col>
                                        <Col md={6} className="border-start">
                                          <div className="small text-muted mb-1">Valorización Actual:</div>
                                          <div className="d-flex justify-content-between mb-1">
                                            <span>Nuevo Total (Precios HOY):</span>
                                            <span className="fw-bold">${transaction.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.current_price_sell)), 0).toFixed(2)}</span>
                                          </div>
                                           <div className="d-flex justify-content-between mb-1">
                                             <span>Pagado inicial:</span>
                                             <span className="text-success">-${Number(transaction.original_sale?.amount_paid || 0).toFixed(2)}</span>
                                           </div>
                                           {transaction.original_sale?.credit_applied > 0 && (
                                             <div className="d-flex justify-content-between mb-1">
                                               <span>Crédito usado:</span>
                                               <span className="text-success">-${Number(transaction.original_sale.credit_applied).toFixed(2)}</span>
                                             </div>
                                           )}
                                          {transaction.linked_payments_sum > 0 && (
                                            <div className="d-flex justify-content-between mb-1">
                                              <span>Pagos posteriores:</span>
                                              <span className="text-success">-${Number(transaction.linked_payments_sum).toFixed(2)}</span>
                                            </div>
                                          )}
                                          <div className="d-flex justify-content-between fw-bold border-top pt-1 bg-warning px-2 rounded">
                                            <span>Deuda ACTUALIZADA:</span>
                                            <span className="text-danger" style={{ fontSize: '1.1rem' }}>
                                              ${Number(transaction.revalued_amount || 0).toFixed(2)}
                                            </span>
                                          </div>
                                           <div className="text-end mt-2">
                                             {Number(transaction.revalued_amount) > 0.01 && (
                                               <Button 
                                                 variant="success" 
                                                 size="sm"
                                                 onClick={() => handleSelectDebtToPay(transaction, transaction.revalued_amount)}
                                               >
                                                 Pagar Deuda Actualizada
                                               </Button>
                                             )}
                                           </div>
                                           {transaction.original_sale?.settled_at && (
                                             <div className="mt-3 p-2 bg-light border-start border-success border-4 rounded small d-flex align-items-center">
                                               <CheckCircle size={16} className="text-success me-2" />
                                               <div>
                                                 <strong>Deuda Saldada el:</strong> <br />
                                                 {new Date(transaction.original_sale.settled_at).toLocaleString('es-AR', {
                                                   day: '2-digit',
                                                   month: '2-digit',
                                                   year: 'numeric',
                                                   hour: '2-digit',
                                                   minute: '2-digit'
                                                 })}
                                               </div>
                                             </div>
                                           )}
                                         </Col>
                                      </Row>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted py-5">
                      <Calendar size={48} className="mb-3 opacity-25" />
                      <p>No hay transacciones registradas</p>
                    </div>
                  )}
                </Card.Body>
                  </Card>
                </Tab>

                <Tab eventKey="containers" title={<span><Package size={18} className="me-1"/>Envases</span>}>
                  <Row>
                    <Col md={4}>
                      <Card className="shadow-sm mb-3">
                        <Card.Header className="bg-success text-white">
                          <h5 className="mb-0"><RefreshCcw size={18} className="me-2"/>Saldar Devolución</h5>
                        </Card.Header>
                        <Card.Body>
                          <Form onSubmit={handleRecordReturn}>
                            <Form.Group className="mb-3">
                              <Form.Label>Envase a devolver</Form.Label>
                              <Form.Select 
                                value={selectedContainer?.product_id || ''} 
                                onChange={(e) => {
                                  const balance = containerBalances.find(b => b.product_id == e.target.value);
                                  setSelectedContainer(balance);
                                }}
                                required
                              >
                                <option value="">Seleccione un envase...</option>
                                {containerBalances.map(b => (
                                  <option key={b.product_id} value={b.product_id}>
                                    {b.product_name} (Deuda: {b.balance})
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Cantidad</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="Cant. a devolver"
                                value={returnAmount}
                                onChange={(e) => setReturnAmount(e.target.value)}
                                max={selectedContainer?.balance}
                                min="1"
                                required
                              />
                            </Form.Group>
                            <Button type="submit" variant="success" className="w-100" disabled={loading || !selectedContainer}>
                              {loading ? 'Procesando...' : 'Registrar Devolución'}
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>

                      <Card className="shadow-sm">
                        <Card.Header>
                          <h5 className="mb-0"><Package size={18} className="me-2"/>Saldos Pendientes</h5>
                        </Card.Header>
                        <ListGroup variant="flush">
                          {containerBalances.length > 0 ? containerBalances.map(b => (
                            <ListGroup.Item key={b.product_id} className="d-flex justify-content-between align-items-center">
                              <span>{b.product_name}</span>
                              <Badge bg="danger" pill className="fs-6">{b.balance} u.</Badge>
                            </ListGroup.Item>
                          )) : (
                            <ListGroup.Item className="text-center text-muted py-4">No debe envases</ListGroup.Item>
                          )}
                        </ListGroup>
                      </Card>
                    </Col>
                    <Col md={8}>
                      <Card className="shadow-sm">
                        <Card.Header>
                          <h5 className="mb-0"><History size={18} className="me-2"/>Historial de Envases</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                          {containerHistory.length > 0 ? (
                            <Table hover responsive className="mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Fecha</th>
                                  <th>Envase</th>
                                  <th>Tipo</th>
                                  <th className="text-center">Cant.</th>
                                  <th className="text-center">Balance</th>
                                  <th>Nota</th>
                                </tr>
                              </thead>
                              <tbody>
                                {containerHistory.map((h) => (
                                  <tr key={h.id}>
                                    <td className="small">{formatDate(h.created_at)}</td>
                                    <td className="fw-bold">{h.product_name}</td>
                                    <td>
                                      <Badge bg={h.type === 'loan' ? 'danger' : 'success'}>
                                        {h.type === 'loan' ? 'Préstamo' : 'Devolución'}
                                      </Badge>
                                    </td>
                                    <td className="text-center fw-bold">{h.type === 'loan' ? '+' : '-'}{h.amount}</td>
                                    <td className="text-center text-muted small">{h.balance_after}</td>
                                    <td className="small text-truncate" style={{ maxWidth: '150px' }}>{h.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <div className="text-center py-5 text-muted">No hay movimientos de envases</div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </>
          ) : (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <CreditCard size={64} className="mb-3 opacity-25" />
                <h5 className="text-muted">Seleccione un cliente para ver su cuenta</h5>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
        {/* Barra de acción flotante para pagos múltiples */}
        {selectedDebts.length > 0 && (
          <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow-lg p-3 bg-dark text-white rounded-pill d-flex align-items-center gap-4" style={{ zIndex: 1000, border: '2px solid #0d6efd' }}>
            <div className="ms-3">
              <span className="opacity-75 small">Seleccionados:</span>
              <span className="ms-2 fw-bold">{selectedDebts.length}</span>
            </div>
            <div className="vr"></div>
            <div>
              <span className="opacity-75 small">Total a Pagar:</span>
              <span className="ms-2 h5 mb-0 text-info fw-bold">
                ${transactions
                  .filter(t => selectedDebts.includes(t.sale_id))
                  .reduce((sum, t) => sum + Number(t.revalued_amount), 0)
                  .toFixed(2)}
              </span>
            </div>
            <Button variant="primary" className="rounded-pill px-4" onClick={handleBatchPayment}>
              Pagar Seleccionados
            </Button>
            <Button variant="link" className="text-white p-0 me-3" onClick={() => setSelectedDebts([])}>
              <X size={20} />
            </Button>
          </div>
        )}
      </Container>
  );
};

export default CustomerAccount;
