import React, { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [cashDiscount, setCashDiscount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('auto_print') === 'true');
  const [printMethod, setPrintMethod] = useState(() => localStorage.getItem('print_method') || 'server');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setCashDiscount(response.data.cash_discount_percent || '0');
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar configuración');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings', {
        key: 'cash_discount_percent',
        value: cashDiscount
      });
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar configuración');
    } finally {
      localStorage.setItem('auto_print', autoPrint);
      localStorage.setItem('print_method', printMethod);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex align-items-center mb-4">
        <SettingsIcon size={32} className="me-3 text-primary" />
        <h2 className="mb-0">Configuración del Sistema</h2>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Descuentos y Promociones</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <strong>💡 Información:</strong> El descuento por efectivo se aplicará automáticamente 
            cuando el cliente seleccione "Efectivo" como método de pago en el punto de venta.
          </Alert>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              Descuento por Pago en Efectivo (%)
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={cashDiscount}
                onChange={(e) => setCashDiscount(e.target.value)}
                placeholder="Ej: 10"
              />
              <InputGroup.Text>%</InputGroup.Text>
            </InputGroup>
            <Form.Text className="text-muted">
              Ingrese el porcentaje de descuento que se aplicará automáticamente 
              al pagar en efectivo. Ejemplo: 10 = 10% de descuento.
            </Form.Text>
          </Form.Group>

          {cashDiscount > 0 && (
            <Alert variant="success">
              <strong>Vista Previa:</strong> Con un descuento del {cashDiscount}%, 
              una compra de $1,000 en efectivo quedaría en ${(1000 - (1000 * parseFloat(cashDiscount) / 100)).toFixed(2)}
            </Alert>
          )}

          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} className="me-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={loadSettings}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">Impresión (Este Dispositivo)</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <strong>🖨️ Nota:</strong> Estas configuraciones solo afectan a este dispositivo/navegador.
          </Alert>

          <Form.Group className="mb-4">
            <Form.Check 
              type="switch"
              id="auto-print-switch"
              label="Impresión automática al finalizar venta"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Método de Impresión</Form.Label>
            <div>
              <Form.Check
                inline
                label="Servidor (Recomendado para PC Servidor)"
                name="printMethod"
                type="radio"
                id="print-server"
                checked={printMethod === 'server'}
                onChange={() => setPrintMethod('server')}
              />
              <Form.Check
                inline
                label="Navegador (Para Celulares o VPS)"
                name="printMethod"
                type="radio"
                id="print-browser"
                checked={printMethod === 'browser'}
                onChange={() => setPrintMethod('browser')}
              />
            </div>
            <Form.Text className="text-muted">
              Use "Servidor" si este dispositivo tiene una impresora térmica conectada al PC donde corre el servidor local.
              Use "Navegador" en celulares, tablets o si accede al sistema vía remota (VPS).
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">Información Adicional</h5>
        </Card.Header>
        <Card.Body>
          <h6 className="fw-bold mb-3">Cómo funcionan las promociones:</h6>
          <ul className="mb-0">
            <li className="mb-2">
              <strong>Promociones XxY:</strong> Configura promociones tipo "2×1" o "3×2" 
              directamente en cada producto desde el inventario.
            </li>
            <li className="mb-2">
              <strong>Precio Oferta:</strong> Establece un precio especial de oferta 
              para productos individuales.
            </li>
            <li className="mb-2">
              <strong>Descuento Efectivo:</strong> Se aplica sobre el total de la venta 
              después de aplicar todas las promociones de productos.
            </li>
            <li>
              <strong>Prioridad:</strong> Primero se aplican las promociones XxY o precios 
              de oferta, luego el descuento por efectivo.
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Settings;
