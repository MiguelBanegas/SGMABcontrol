import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, Modal } from 'react-bootstrap';
import { Calendar, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CashRegisterHistory = () => {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registers, setRegisters] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
        return;
      default:
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (period !== 'custom') {
      calculateDates(period);
    }
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchHistory();
    }
  }, [startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const response = await axios.get('/api/cash-registers/history', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      setRegisters(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (registerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cash-registers/${registerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRegister(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching detail:', error);
      toast.error('Error al cargar detalle');
    }
  };

  const stats = {
    totalRegisters: registers.length,
    totalClosed: registers.filter(r => r.status === 'closed').length,
    totalOpen: registers.filter(r => r.status === 'open').length
  };

  return (
    <div className="py-3">
      <h4 className="mb-4">💰 Historial de Arqueos de Caja</h4>

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
              onClick={() => setPeriod('today')}
            >
              Hoy
            </Button>
            <Button
              variant={period === 'week' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              Última Semana
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              Último Mes
            </Button>
            <Button
              variant={period === 'custom' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setPeriod('custom')}
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
                  onClick={fetchHistory}
                  disabled={!startDate || !endDate}
                >
                  Buscar
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Resumen */}
      {registers.length > 0 && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-primary text-white">
              <Card.Body>
                <small className="opacity-75">Total Arqueos</small>
                <h4 className="mb-0">{stats.totalRegisters}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-success text-white">
              <Card.Body>
                <small className="opacity-75">Cerrados</small>
                <h4 className="mb-0">{stats.totalClosed}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-warning text-white">
              <Card.Body>
                <small className="opacity-75">Abiertos</small>
                <h4 className="mb-0">{stats.totalOpen}</h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de arqueos */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-3 border-0">
          <h5 className="mb-0">Arqueos Registrados</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando historial...</p>
            </div>
          ) : registers.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">Usuario</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th className="text-end">Inicial</th>
                  <th className="text-end">Final</th>
                  <th className="text-end">Diferencia</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registers.map((register) => (
                  <tr key={register.id}>
                    <td className="px-4">{register.user_name || 'N/A'}</td>
                    <td>
                      {new Date(register.opened_at).toLocaleDateString('es-AR')}
                      <br />
                      <small className="text-muted">
                        {new Date(register.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      {register.closed_at ? (
                        <>
                          {new Date(register.closed_at).toLocaleDateString('es-AR')}
                          <br />
                          <small className="text-muted">
                            {new Date(register.closed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-end">${parseFloat(register.opening_amount).toFixed(2)}</td>
                    <td className="text-end">
                      {register.closing_amount ? `$${parseFloat(register.closing_amount).toFixed(2)}` : '-'}
                    </td>
                    <td className="text-end">
                      {register.difference !== null ? (
                        <Badge bg={
                          parseFloat(register.difference) === 0 ? 'success' :
                          parseFloat(register.difference) > 0 ? 'warning' : 'danger'
                        } className="px-3">
                          {parseFloat(register.difference) > 0 && '+'}
                          ${parseFloat(register.difference).toFixed(2)}
                        </Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Badge bg={register.status === 'open' ? 'success' : 'secondary'}>
                        {register.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetail(register.id)}
                      >
                        <Eye size={16} className="me-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <DollarSign size={48} className="text-muted mb-3 opacity-25" />
              <h5 className="text-muted">No hay arqueos en este período</h5>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalle */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle de Arqueo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRegister && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Usuario:</strong> {selectedRegister.user_name || 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>Estado:</strong>{' '}
                  <Badge bg={selectedRegister.status === 'open' ? 'success' : 'secondary'}>
                    {selectedRegister.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Apertura:</strong> {new Date(selectedRegister.opened_at).toLocaleString('es-AR')}
                </Col>
                <Col md={6}>
                  <strong>Cierre:</strong>{' '}
                  {selectedRegister.closed_at ? new Date(selectedRegister.closed_at).toLocaleString('es-AR') : 'Aún abierta'}
                </Col>
              </Row>

              <hr />

              <h6 className="mb-3 text-success">💵 EFECTIVO EN CAJA</h6>
              <Table bordered>
                <tbody>
                  <tr>
                    <td>Monto Inicial</td>
                    <td className="text-end">${parseFloat(selectedRegister.opening_amount).toFixed(2)}</td>
                  </tr>
                  <tr className="table-success">
                    <td>Ventas en Efectivo</td>
                    <td className="text-end">+${parseFloat(selectedRegister.cash_sales || 0).toFixed(2)}</td>
                  </tr>
                  {parseFloat(selectedRegister.account_payments || 0) > 0 && (
                    <tr className="table-success">
                      <td>Cobros de Cuenta Corriente</td>
                      <td className="text-end">+${parseFloat(selectedRegister.account_payments || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {parseFloat(selectedRegister.expenses || 0) > 0 && (
                    <tr className="table-danger">
                      <td>Gastos</td>
                      <td className="text-end">-${parseFloat(selectedRegister.expenses || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {parseFloat(selectedRegister.withdrawals || 0) > 0 && (
                    <tr className="table-warning">
                      <td>Retiros</td>
                      <td className="text-end">-${parseFloat(selectedRegister.withdrawals || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="table-primary fw-bold">
                    <td>ESPERADO EN CAJA</td>
                    <td className="text-end">${parseFloat(selectedRegister.expected_amount || 0).toFixed(2)}</td>
                  </tr>
                  {selectedRegister.closing_amount && (
                    <>
                      <tr>
                        <td>Monto Final Contado</td>
                        <td className="text-end">${parseFloat(selectedRegister.closing_amount).toFixed(2)}</td>
                      </tr>
                      <tr className={
                        parseFloat(selectedRegister.difference) === 0 ? 'table-success' :
                        parseFloat(selectedRegister.difference) > 0 ? 'table-warning' : 'table-danger'
                      }>
                        <td className="fw-bold">Diferencia</td>
                        <td className="text-end fw-bold">
                          {parseFloat(selectedRegister.difference) > 0 && '+'}
                          ${parseFloat(selectedRegister.difference).toFixed(2)}
                          {parseFloat(selectedRegister.difference) > 0 && ' (Sobrante)'}
                          {parseFloat(selectedRegister.difference) < 0 && ' (Faltante)'}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </Table>

              {(parseFloat(selectedRegister.transfer_sales || 0) > 0 || 
                parseFloat(selectedRegister.debit_sales || 0) > 0 || 
                parseFloat(selectedRegister.credit_sales || 0) > 0) && (
                <>
                  <h6 className="mb-3 text-info mt-4">💳 OTROS MEDIOS DE PAGO</h6>
                  <Table bordered>
                    <tbody>
                      {parseFloat(selectedRegister.transfer_sales || 0) > 0 && (
                        <tr>
                          <td>Transferencias</td>
                          <td className="text-end">${parseFloat(selectedRegister.transfer_sales).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedRegister.debit_sales || 0) > 0 && (
                        <tr>
                          <td>Débito</td>
                          <td className="text-end">${parseFloat(selectedRegister.debit_sales).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedRegister.credit_sales || 0) > 0 && (
                        <tr>
                          <td>Crédito</td>
                          <td className="text-end">${parseFloat(selectedRegister.credit_sales).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="table-info fw-bold">
                        <td>Total otros medios</td>
                        <td className="text-end">
                          ${(parseFloat(selectedRegister.transfer_sales || 0) + 
                             parseFloat(selectedRegister.debit_sales || 0) + 
                             parseFloat(selectedRegister.credit_sales || 0)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              )}

              {(parseFloat(selectedRegister.account_sales || 0) > 0 || 
                parseFloat(selectedRegister.account_payments || 0) > 0) && (
                <>
                  <h6 className="mb-3 text-warning mt-4">📋 CUENTA CORRIENTE</h6>
                  <Table bordered>
                    <tbody>
                      {parseFloat(selectedRegister.account_sales || 0) > 0 && (
                        <tr>
                          <td>Nuevas deudas generadas</td>
                          <td className="text-end text-warning">+${parseFloat(selectedRegister.account_sales).toFixed(2)}</td>
                        </tr>
                      )}
                      {parseFloat(selectedRegister.account_payments || 0) > 0 && (
                        <tr>
                          <td>Cobros realizados</td>
                          <td className="text-end text-success">-${parseFloat(selectedRegister.account_payments).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="table-warning fw-bold">
                        <td>Saldo neto</td>
                        <td className="text-end">
                          {(parseFloat(selectedRegister.account_sales || 0) - parseFloat(selectedRegister.account_payments || 0)) > 0 ? '+' : ''}
                          ${(parseFloat(selectedRegister.account_sales || 0) - parseFloat(selectedRegister.account_payments || 0)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              )}

              <h6 className="mb-3 text-dark mt-4">📊 RESUMEN TOTAL</h6>
              <Table bordered>
                <tbody>
                  <tr className="table-dark text-white fw-bold">
                    <td>Total Vendido en la Jornada</td>
                    <td className="text-end">${parseFloat(selectedRegister.total_sales || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>

              {selectedRegister.notes && (
                <>
                  <h6 className="mb-2">Notas:</h6>
                  <p className="text-muted">{selectedRegister.notes}</p>
                </>
              )}

              {selectedRegister.movements && selectedRegister.movements.length > 0 && (
                <>
                  <hr />
                  <h6 className="mb-3">Movimientos de Efectivo:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th className="text-end">Monto</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRegister.movements.map((mov, idx) => (
                        <tr key={idx}>
                          <td>
                            <Badge bg={
                              mov.type === 'expense' ? 'danger' : 
                              mov.type === 'withdrawal' ? 'warning' : 
                              'success'
                            }>
                              {mov.type === 'expense' ? 'Gasto' : 
                               mov.type === 'withdrawal' ? 'Retiro' : 
                               'Cobro Cta.Cte'}
                            </Badge>
                          </td>
                          <td>{mov.description}</td>
                          <td className="text-end">${parseFloat(mov.amount).toFixed(2)}</td>
                          <td>{new Date(mov.created_at).toLocaleString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              {selectedRegister.sales && selectedRegister.sales.length > 0 && (
                <>
                  <hr />
                  <h6 className="mb-3">Ventas Registradas ({selectedRegister.sales.length}):</h6>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          <th>Método</th>
                          <th className="text-end">Total</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRegister.sales.map((sale, idx) => (
                          <tr key={idx}>
                            <td>{sale.payment_method}</td>
                            <td className="text-end">${parseFloat(sale.total).toFixed(2)}</td>
                            <td>{new Date(sale.created_at).toLocaleString('es-AR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
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

export default CashRegisterHistory;
