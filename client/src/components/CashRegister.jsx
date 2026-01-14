import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Badge, Modal, Alert, Row, Col, Table } from 'react-bootstrap';
import { DollarSign, Plus, Minus, Lock, Unlock, TrendingDown, CreditCard, Smartphone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CashRegister = () => {
  const [currentRegister, setCurrentRegister] = useState(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('expense');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentRegister();
    const interval = setInterval(fetchCurrentRegister, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentRegister = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cash-registers/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentRegister(response.data);
    } catch (error) {
      console.error('Error fetching current register:', error);
    }
  };

  const handleOpenRegister = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast.error('Ingresa un monto inicial válido');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cash-registers/open', {
        opening_amount: parseFloat(openingAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Caja abierta exitosamente');
      setShowOpenModal(false);
      setOpeningAmount('');
      fetchCurrentRegister();
    } catch (error) {
      console.error('Error opening register:', error);
      toast.error(error.response?.data?.message || 'Error al abrir caja');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      toast.error('Ingresa un monto final válido');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/cash-registers/${currentRegister.id}/close`, {
        closing_amount: parseFloat(closingAmount),
        notes: notes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { difference } = response.data;
      
      if (difference === 0) {
        toast.success('¡Caja cerrada! Todo cuadra perfectamente');
      } else if (difference > 0) {
        toast.success(`Caja cerrada. Sobrante: $${difference.toFixed(2)}`);
      } else {
        toast.error(`Caja cerrada. Faltante: $${Math.abs(difference).toFixed(2)}`);
      }

      setShowCloseModal(false);
      setClosingAmount('');
      setNotes('');
      setCurrentRegister(null);
    } catch (error) {
      console.error('Error closing register:', error);
      toast.error(error.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async () => {
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!movementDescription.trim()) {
      toast.error('Ingresa una descripción');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cash-registers/movement', {
        cash_register_id: currentRegister.id,
        type: movementType,
        amount: parseFloat(movementAmount),
        description: movementDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const message = movementType === 'expense' ? 'Gasto registrado' : 'Retiro registrado';
      toast.success(message);
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementDescription('');
      fetchCurrentRegister();
    } catch (error) {
      console.error('Error adding movement:', error);
      toast.error('Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRegister) {
    return (
      <div className="py-3">
        <Card className="shadow-sm text-center">
          <Card.Body className="py-5">
            <Lock size={64} className="text-muted mb-3 opacity-25" />
            <h4 className="text-muted mb-3">Caja Cerrada</h4>
            <p className="text-muted mb-4">
              Debes abrir la caja para comenzar a registrar ventas
            </p>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setShowOpenModal(true)}
            >
              <Unlock size={20} className="me-2" />
              Abrir Caja
            </Button>
          </Card.Body>
        </Card>

        <Modal show={showOpenModal} onHide={() => setShowOpenModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Abrir Caja</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Monto Inicial en Caja</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Ingresa el dinero en efectivo con el que inicias
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOpenModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleOpenRegister}
              disabled={loading || !openingAmount}
            >
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  // Caja abierta - Calcular totales
  const expectedAmount = currentRegister.current_expected || 0;
  const cashSales = currentRegister.current_cash_sales || 0;
  const transferSales = currentRegister.current_transfer_sales || 0;
  const debitSales = currentRegister.current_debit_sales || 0;
  const creditSales = currentRegister.current_credit_sales || 0;
  const accountSales = currentRegister.current_account_sales || 0;
  const accountPayments = currentRegister.current_account_payments || 0;
  const expenses = parseFloat(currentRegister.expenses || 0);
  const withdrawals = parseFloat(currentRegister.withdrawals || 0);
  const totalSales = currentRegister.total_sales || 0;
  const otherPayments = transferSales + debitSales + creditSales;
  const accountBalance = accountSales - accountPayments;

  return (
    <div className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <Unlock size={24} className="text-success me-2" />
            Caja Abierta
          </h4>
          <small className="text-muted">
            Abierta el {new Date(currentRegister.opened_at).toLocaleString('es-AR')}
          </small>
        </div>
        <Button 
          variant="danger"
          onClick={() => setShowCloseModal(true)}
        >
          <Lock size={18} className="me-2" />
          Cerrar Caja
        </Button>
      </div>

      {/* Efectivo en Caja */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-success text-white">
          <h6 className="mb-0">💵 EFECTIVO EN CAJA</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table className="mb-0">
            <tbody>
              <tr>
                <td>Inicial</td>
                <td className="text-end">${parseFloat(currentRegister.opening_amount).toFixed(2)}</td>
              </tr>
              <tr className="table-success">
                <td>Ventas en efectivo</td>
                <td className="text-end">+${cashSales.toFixed(2)}</td>
              </tr>
              {accountPayments > 0 && (
                <tr className="table-success">
                  <td>Cobros de Cuenta Corriente</td>
                  <td className="text-end">+${accountPayments.toFixed(2)}</td>
                </tr>
              )}
              {expenses > 0 && (
                <tr className="table-danger">
                  <td>Gastos</td>
                  <td className="text-end">-${expenses.toFixed(2)}</td>
                </tr>
              )}
              {withdrawals > 0 && (
                <tr className="table-warning">
                  <td>Retiros</td>
                  <td className="text-end">-${withdrawals.toFixed(2)}</td>
                </tr>
              )}
              <tr className="table-primary fw-bold">
                <td>ESPERADO EN CAJA</td>
                <td className="text-end">${expectedAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Otros Medios de Pago */}
      {otherPayments > 0 && (
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">💳 OTROS MEDIOS DE PAGO (Informativo)</h6>
          </Card.Header>
          <Card.Body className="p-0">
            <Table className="mb-0">
              <tbody>
                {transferSales > 0 && (
                  <tr>
                    <td><Smartphone size={16} className="me-2" />Transferencias</td>
                    <td className="text-end">${transferSales.toFixed(2)}</td>
                  </tr>
                )}
                {debitSales > 0 && (
                  <tr>
                    <td><CreditCard size={16} className="me-2" />Débito</td>
                    <td className="text-end">${debitSales.toFixed(2)}</td>
                  </tr>
                )}
                {creditSales > 0 && (
                  <tr>
                    <td><CreditCard size={16} className="me-2" />Crédito</td>
                    <td className="text-end">${creditSales.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="table-info fw-bold">
                  <td>Total otros medios</td>
                  <td className="text-end">${otherPayments.toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Cuenta Corriente */}
      {(accountSales > 0 || accountPayments > 0) && (
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-warning text-dark">
            <h6 className="mb-0">📋 CUENTA CORRIENTE (Informativo)</h6>
          </Card.Header>
          <Card.Body className="p-0">
            <Table className="mb-0">
              <tbody>
                {accountSales > 0 && (
                  <tr>
                    <td>Nuevas deudas generadas</td>
                    <td className="text-end text-warning">+${accountSales.toFixed(2)}</td>
                  </tr>
                )}
                {accountPayments > 0 && (
                  <tr>
                    <td>Cobros realizados</td>
                    <td className="text-end text-success">-${accountPayments.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="table-warning fw-bold">
                  <td>Saldo neto</td>
                  <td className="text-end">
                    {accountBalance > 0 ? '+' : ''}${accountBalance.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Resumen Total */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-dark text-white">
          <h6 className="mb-0">📊 RESUMEN TOTAL DE LA JORNADA</h6>
        </Card.Header>
        <Card.Body className="text-center">
          <h3 className="mb-0">Total Vendido: ${totalSales.toFixed(2)}</h3>
          <small className="text-muted">
            Incluye todos los métodos de pago y cuenta corriente
          </small>
        </Card.Body>
      </Card>

      {/* Botones de acción */}
      <div className="d-flex gap-2 flex-wrap">
        <Button 
          variant="outline-danger" 
          onClick={() => {
            setMovementType('expense');
            setShowMovementModal(true);
          }}
        >
          <Minus size={18} className="me-2" />
          Registrar Gasto
        </Button>
        <Button 
          variant="outline-warning"
          onClick={() => {
            setMovementType('withdrawal');
            setShowMovementModal(true);
          }}
        >
          <TrendingDown size={18} className="me-2" />
          Registrar Retiro
        </Button>
      </div>

      {/* Modal Cerrar Caja */}
      <Modal show={showCloseModal} onHide={() => setShowCloseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Cerrar Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Efectivo esperado en caja:</strong> ${expectedAmount.toFixed(2)}
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label>Monto Final Contado</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </InputGroup>
            <Form.Text className="text-muted">
              Cuenta el efectivo físico en caja e ingresa el total
            </Form.Text>
          </Form.Group>

          {closingAmount && (
            <Alert variant={
              parseFloat(closingAmount) === expectedAmount ? 'success' :
              parseFloat(closingAmount) > expectedAmount ? 'warning' : 'danger'
            }>
              <strong>Diferencia:</strong> $
              {(parseFloat(closingAmount) - expectedAmount).toFixed(2)}
              {parseFloat(closingAmount) > expectedAmount && ' (Sobrante)'}
              {parseFloat(closingAmount) < expectedAmount && ' (Faltante)'}
            </Alert>
          )}

          <Form.Group>
            <Form.Label>Notas (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el cierre..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCloseRegister}
            disabled={loading || !closingAmount}
          >
            {loading ? 'Cerrando...' : 'Cerrar Caja'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Movimiento */}
      <Modal show={showMovementModal} onHide={() => setShowMovementModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {movementType === 'expense' ? 'Registrar Gasto' : 'Registrar Retiro'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Monto</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </InputGroup>
          </Form.Group>

          <Form.Group>
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              type="text"
              value={movementDescription}
              onChange={(e) => setMovementDescription(e.target.value)}
              placeholder={
                movementType === 'expense' ? 'Ej: Compra de bolsas' : 'Ej: Retiro para banco'
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMovementModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant={movementType === 'expense' ? 'danger' : 'warning'}
            onClick={handleAddMovement}
            disabled={loading || !movementAmount || !movementDescription}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CashRegister;
