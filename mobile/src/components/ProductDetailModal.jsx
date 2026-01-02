import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Form, InputGroup } from 'react-bootstrap';
import { Package, Info, Plus, Minus, Check, Edit3 } from 'lucide-react';
import { getServerUrl, getApiUrl } from '../utils/config';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProductDetailModal = ({ show, handleClose, product }) => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualStock, setManualStock] = useState('');
  
  // Estados para edición de precios
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [prices, setPrices] = useState({
    price_buy: product?.price_buy || '',
    price_sell: product?.price_sell || ''
  });

  // Actualizar estados cuando el producto cambia
  React.useEffect(() => {
    if (product) {
      setPrices({
        price_buy: product.price_buy || '',
        price_sell: product.price_sell || ''
      });
    }
  }, [product]);

  if (!product) return null;

  const handleAdjust = async (value) => {
    if (!product?.id) {
      toast.error('Error: ID de producto no encontrado');
      return;
    }
    try {
      setIsAdjusting(true);
      await axios.post(`${getApiUrl()}/products/${product.id}/adjust-stock`, {
        adjustment: value
      });
      toast.success('Stock actualizado');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error de conexión';
      toast.error(`Fallo: ${errorMsg}`);
      console.error('Error al ajustar stock:', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleUpdatePrices = async () => {
    if (!product?.id) {
      toast.error('Error: ID de producto no encontrado');
      return;
    }
    try {
      setIsAdjusting(true);
      
      // Solo enviamos los campos que la tabla 'products' realmente tiene
      const updateData = {
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        price_buy: prices.price_buy === '' ? null : parseFloat(prices.price_buy),
        price_sell: parseFloat(prices.price_sell),
        stock: parseFloat(product.stock),
        category_id: product.category_id,
        sell_by_weight: product.sell_by_weight ? true : false
      };

      await axios.put(`${getApiUrl()}/products/${product.id}`, updateData);
      toast.success('Precios actualizados');
      setIsEditingPrices(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error de conexión';
      toast.error(`Fallo al guardar precios: ${errorMsg}`);
      console.error('Error al actualizar precios:', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleManualEntry = async () => {
    const newVal = parseFloat(manualStock);
    if (isNaN(newVal) || newVal < 0) {
      toast.error('Ingrese un valor válido');
      return;
    }
    const diff = newVal - parseFloat(product.stock);
    await handleAdjust(diff);
    setShowManual(false);
    setManualStock('');
  };

  const displayStock = Number(product.stock);

  return (
    <Modal show={show} onHide={handleClose} centered size="md" className="mobile-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <div className="mb-3 text-center" style={{ height: '160px', backgroundColor: '#f8f9fa', borderRadius: '12px', overflow: 'hidden' }}>
          {product.image_url ? (
            <img 
              src={`${getServerUrl()}${product.image_url}`} 
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-25">
              <Package size={48} />
              <div className="mt-1 small">Sin Imagen</div>
            </div>
          )}
        </div>

        <Row className="g-2 mb-3">
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 border text-center">
              <label className="text-muted extra-small d-block mb-0">SKU</label>
              <span className="fw-bold small">{product.sku}</span>
            </div>
          </Col>
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 border text-center">
              <label className="text-muted extra-small d-block mb-0">Unidad</label>
              <span className="fw-bold small">{product.sell_by_weight ? 'Kilogramos' : 'Unidades'}</span>
            </div>
          </Col>
        </Row>

        {/* Panel de Stock */}
        <div className="p-3 bg-white rounded-3 border mb-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <label className="text-muted small d-block mb-0">Stock Actual</label>
              <span className="fs-2 fw-bold text-dark">
                {displayStock}
                <small className="ms-1 text-muted fs-6">{product.sell_by_weight ? 'kg' : 'unid.'}</small>
              </span>
            </div>
            
            {/* Solo Admin puede ver/editar precio de compra */}
            <div className="text-end">
              <label className="text-primary small d-block mb-0 fw-bold">Venta</label>
              <span className="fs-3 fw-bold text-primary">${product.price_sell}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button 
                variant="outline-danger" 
                className="flex-grow-1 d-flex align-items-center justify-content-center py-2"
                onClick={() => handleAdjust(-1)}
                disabled={isAdjusting}
            >
              <Minus size={18} className="me-1" /> 1
            </Button>
            <Button 
                variant="outline-success" 
                className="flex-grow-1 d-flex align-items-center justify-content-center py-2"
                onClick={() => handleAdjust(1)}
                disabled={isAdjusting}
            >
              <Plus size={18} className="me-1" /> 1
            </Button>
            <Button 
                variant="outline-primary" 
                className="d-flex align-items-center justify-content-center px-3"
                onClick={() => setShowManual(!showManual)}
                disabled={isAdjusting}
            >
              <Edit3 size={18} />
            </Button>
          </div>
        </div>

        {showManual && (
          <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25 mb-3">
            <label className="text-warning dark small d-block mb-2 fw-bold">Ajuste Manual al Valor Real</label>
            <InputGroup>
              <Form.Control 
                type="number" 
                placeholder="Ej: 50" 
                value={manualStock}
                onChange={(e) => setManualStock(e.target.value)}
              />
              <Button variant="warning" onClick={handleManualEntry} disabled={isAdjusting}>
                <Check size={18} />
              </Button>
            </InputGroup>
          </div>
        )}

        {/* Sección de Precios para Admin */}
        {isAdmin && (
          <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="text-primary small fw-bold">Gestión de Precios</label>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-decoration-none"
                onClick={() => setIsEditingPrices(!isEditingPrices)}
              >
                {isEditingPrices ? 'Cancelar' : 'Editar'}
              </Button>
            </div>
            
            {isEditingPrices ? (
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="extra-small mb-0">Compra</Form.Label>
                    <Form.Control 
                      size="sm" 
                      type="number" 
                      value={prices.price_buy}
                      onChange={(e) => setPrices({...prices, price_buy: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="extra-small mb-0">Venta</Form.Label>
                    <Form.Control 
                      size="sm" 
                      type="number" 
                      value={prices.price_sell}
                      onChange={(e) => setPrices({...prices, price_sell: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-100 mt-2"
                    onClick={handleUpdatePrices}
                    disabled={isAdjusting}
                  >
                    Guardar Precios
                  </Button>
                </Col>
              </Row>
            ) : (
              <div className="d-flex justify-content-between">
                <div className="small">
                  <span className="text-muted">Costo: </span>
                  <span className="fw-bold text-dark">${product.price_buy || '0.00'}</span>
                </div>
                <div className="small">
                  <span className="text-muted">Margen: </span>
                  <span className="fw-bold text-success">
                    {product.price_buy ? `${(((product.price_sell/product.price_buy)-1)*100).toFixed(0)}%` : '--'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {product.description && (
          <div className="mb-2">
            <label className="text-muted d-flex align-items-center mb-1 small">
                <Info size={14} className="me-1" /> Descripción
            </label>
            <p className="text-dark mb-0 small">{product.description}</p>
          </div>
        )}

      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={handleClose} className="w-100 rounded-3 py-2">
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductDetailModal;
