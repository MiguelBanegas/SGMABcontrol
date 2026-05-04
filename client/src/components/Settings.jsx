import React, { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { Settings as SettingsIcon, Save, Database, Download, Upload } from 'lucide-react';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import MigrationPanel from './MigrationPanel';

const Settings = () => {
  const [cashDiscount, setCashDiscount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('auto_print') === 'true');
  const [printMethod, setPrintMethod] = useState(() => localStorage.getItem('print_method') || 'server');
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [serverBackups, setServerBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);


  useEffect(() => {
    loadSettings();
    loadServerBackups();
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

  const loadServerBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await axios.get('/api/db/backups');
      setServerBackups(response.data);
    } catch (error) {
      console.error('Error al cargar backups del servidor:', error);
    } finally {
      setLoadingBackups(false);
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

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await axios.get('/api/db/backup');
      
      toast.success(`Respaldo generado exitosamente y guardado en: ${response.data.filePath}`, {
        duration: 5000
      });
      loadServerBackups(); // Recargar lista
    } catch (error) {
      console.error('Error al generar respaldo:', error);
      toast.error('Error al generar respaldo de la base de datos');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownload = (fileName) => {
    window.open(`/api/db/download/${fileName}`, '_blank');
  };

  const handleRestoreFromServer = async (fileName) => {
    if (!window.confirm(`¿Está seguro de que desea restaurar desde el archivo "${fileName}"? Se sobrescribirán todos los datos actuales.`)) {
      return;
    }

    setRestoring(true);
    try {
      await axios.post('/api/db/restore-server', { fileName });
      toast.success('Base de datos restaurada con éxito. El sistema se reiniciará...', {
        duration: 3000,
        icon: '🔄'
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error('Error al restaurar desde servidor:', error);
      const details = error.response?.data?.details || '';
      toast.error(`Error al restaurar: ${details || 'Error en el servidor'}`, { duration: 6000 });
    } finally {
      setRestoring(false);
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor seleccione un archivo de respaldo');
      return;
    }

    if (!window.confirm('¿Está seguro de que desea restaurar la base de datos? Esto reemplazará los datos actuales y puede tardar unos momentos.')) {
      return;
    }

    setRestoring(true);
    const formData = new FormData();
    formData.append('backup', selectedFile);

    try {
      await axios.post('/api/db/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Base de datos restaurada con éxito. El sistema se reiniciará en unos segundos...', {
        duration: 3000,
        icon: '🔄'
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      setSelectedFile(null);
      // Resetear el input de archivo
      document.getElementById('restore-file-input').value = '';
    } catch (error) {
      console.error('Error al restaurar:', error);
      const details = error.response?.data?.details || '';
      toast.error(`Error al restaurar: ${details || 'Verifique el archivo.'}`, { duration: 6000 });
    } finally {
      setRestoring(false);
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

      <Card className="shadow-sm mt-4 border-danger">
        <Card.Header className="bg-danger text-white d-flex align-items-center">
          <Database size={20} className="me-2" />
          <h5 className="mb-0">Mantenimiento de Base de Datos</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            <strong>⚠️ Atención:</strong> Estas acciones son críticas. Realice un respaldo antes de intentar restaurar.
          </Alert>

          <div className="row">
            <div className="col-md-6 mb-4">
              <h6 className="fw-bold">Generar Copia de Seguridad</h6>
              <p className="text-muted small">
                Crea una copia completa de la base de datos actual en formato .dump. 
                El archivo se guarda automáticamente en la carpeta del servidor.
              </p>
              <Button 
                variant="outline-primary" 
                onClick={handleBackup}
                disabled={backingUp}
                className="w-100 py-3 mb-3"
              >
                {backingUp ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Generando Respaldo...
                  </>
                ) : (
                  <>
                    <Database size={20} className="me-2" />
                    Generar Respaldo (.dump)
                  </>
                )}
              </Button>

              <h6 className="fw-bold mt-4 mb-3">Backups en el Servidor</h6>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loadingBackups ? (
                  <div className="text-center p-3">Cargando lista...</div>
                ) : serverBackups.length === 0 ? (
                  <div className="text-center text-muted p-3 border rounded">No hay backups guardados</div>
                ) : (
                  <div className="list-group shadow-sm">
                    {serverBackups.map((backup) => (
                      <div key={backup.name} className="list-group-item list-group-item-action d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate" style={{ maxWidth: '70%' }}>
                            <div className="fw-bold small">{backup.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {new Date(backup.createdAt).toLocaleString()} - {(backup.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              title="Descargar a PC"
                              onClick={() => handleDownload(backup.name)}
                            >
                              <Download size={14} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              title="Restaurar este backup"
                              onClick={() => handleRestoreFromServer(backup.name)}
                              disabled={restoring}
                            >
                              <Database size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <h6 className="fw-bold">Restaurar desde PC (Subir archivo)</h6>
              <p className="text-muted small">
                Sube un archivo de respaldo previamente generado (.sql o .dump) para sobrescribir la base de datos actual.
              </p>
              <Form onSubmit={handleRestore}>
                <Form.Group className="mb-3">
                  <Form.Control 
                    type="file" 
                    id="restore-file-input"
                    accept=".sql,.dump,.backup"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    disabled={restoring}
                  />
                </Form.Group>
                <Button 
                  variant="danger" 
                  type="submit"
                  disabled={restoring || !selectedFile}
                  className="w-100 py-3"
                >
                  {restoring ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Restaurando Sistema...
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="me-2" />
                      Subir y Restaurar
                    </>
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-4 border-info">
        <Card.Header className="bg-info text-white d-flex align-items-center">
          <Database size={20} className="me-2" />
          <h5 className="mb-0">🔄 Migración de Datos</h5>
        </Card.Header>
        <Card.Body>
          <MigrationPanel />
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
