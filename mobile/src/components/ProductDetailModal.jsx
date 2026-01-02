import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Row, Col, Badge, Form, InputGroup } from 'react-bootstrap';
import { Package, Info, Plus, Minus, Check, Edit3, Camera, Upload, X } from 'lucide-react';
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
  
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [prices, setPrices] = useState({
    price_buy: product?.price_buy || '',
    price_sell: product?.price_sell || '',
    category_id: product?.category_id || ''
  });

  const [categories, setCategories] = useState([]);
  
  // Image editing states
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (product) {
      setPrices({
        price_buy: product.price_buy || '',
        price_sell: product.price_sell || '',
        category_id: product.category_id || ''
      });
      setPreview(null);
      setImage(null);
      setIsEditingImage(false);
      setShowCamera(false);
      if (isAdmin) fetchCategories();
    }
  }, [product, isAdmin]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/products/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  if (!product) return null;

  const handleAdjust = async (value) => {
    if (!product?.id) return;
    
    // Validar que el stock resultante no sea negativo
    const currentStock = parseFloat(product.stock);
    if (currentStock + value < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    try {
      setIsAdjusting(true);
      await axios.post(`${getApiUrl()}/products/${product.id}/adjust-stock`, {
        adjustment: value
      });
      toast.success('Stock actualizado');
    } catch (err) {
      toast.error('Error al ajustar stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleUpdatePrices = async () => {
    if (!product?.id) return;
    try {
      setIsAdjusting(true);
      const updateData = {
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        price_buy: prices.price_buy === '' ? null : parseFloat(prices.price_buy),
        price_sell: parseFloat(prices.price_sell),
        stock: parseFloat(product.stock),
        category_id: prices.category_id || null,
        sell_by_weight: product.sell_by_weight ? true : false
      };

      await axios.put(`${getApiUrl()}/products/${product.id}`, updateData);
      toast.success('Producto actualizado');
      setIsEditingPrices(false);
    } catch (err) {
      toast.error('Error al guardar cambios');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!image || !product?.id) return;
    try {
      setIsAdjusting(true);
      const data = new FormData();
      data.append('image', image);
      // Backend expects other fields as well for PUT /products/:id
      data.append('name', product.name);
      data.append('sku', product.sku);
      data.append('price_sell', product.price_sell);
      data.append('stock', product.stock);

      await axios.put(`${getApiUrl()}/products/${product.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Imagen actualizada');
      setIsEditingImage(false);
    } catch (err) {
      toast.error('Error al subir imagen');
    } finally {
      setIsAdjusting(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error('Error cámara');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], "prod.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleManualEntry = async () => {
    const newVal = parseFloat(manualStock);
    if (isNaN(newVal) || newVal < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }
    await handleAdjust(newVal - parseFloat(product.stock));
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
        {/* Imagen Section */}
        <div className="mb-3 text-center position-relative" style={{ height: '200px', backgroundColor: '#f8f9fa', borderRadius: '12px', overflow: 'hidden' }}>
          {showCamera ? (
            <div className="w-100 h-100 bg-black">
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex gap-2">
                <Button variant="primary" size="sm" onClick={takePhoto}>Capturar</Button>
                <Button variant="light" size="sm" onClick={stopCamera}>X</Button>
              </div>
            </div>
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div className="position-absolute bottom-0 end-0 m-2 d-flex gap-2">
                <Button variant="success" size="sm" onClick={handleUpdateImage} disabled={isAdjusting}><Check size={16} /></Button>
                <Button variant="danger" size="sm" onClick={() => { setPreview(null); setImage(null); }}><X size={16} /></Button>
              </div>
            </>
          ) : (
            <>
              {product.image_url ? (
                <img src={`${getServerUrl()}${product.image_url}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-25">
                  <Package size={48} />
                </div>
              )}
              {isAdmin && (
                <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                   <Button variant="light" size="sm" className="rounded-circle shadow-sm" onClick={() => document.getElementById('edit-img-input').click()}><Upload size={14} /></Button>
                   <Button variant="light" size="sm" className="rounded-circle shadow-sm" onClick={startCamera}><Camera size={14} /></Button>
                   <input type="file" id="edit-img-input" hidden accept="image/*" onChange={e => {
                     const file = e.target.files[0];
                     if(file) { setImage(file); setPreview(URL.createObjectURL(file)); }
                   }} />
                </div>
              )}
            </>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Row className="g-2 mb-3 text-center">
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 border">
              <label className="text-muted extra-small d-block mb-0">SKU</label>
              <span className="fw-bold small">{product.sku}</span>
            </div>
          </Col>
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 border">
              <label className="text-muted extra-small d-block mb-0">Unidad</label>
              <span className="fw-bold small">{product.sell_by_weight ? 'Kilogramos' : 'Unidades'}</span>
            </div>
          </Col>
        </Row>

        {/* Panel de Stock */}
        <div className="p-3 bg-white rounded-3 border mb-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <label className="text-muted small d-block mb-0">Stock Actualmente</label>
              <span className="fs-2 fw-bold text-dark">{displayStock}<small className="ms-1 text-muted fs-6">{product.sell_by_weight ? 'kg' : 'unid.'}</small></span>
            </div>
            <div className="text-end">
              <label className="text-primary small d-block mb-0 fw-bold">Venta</label>
              <span className="fs-3 fw-bold text-primary">${product.price_sell}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-danger" className="flex-grow-1" onClick={() => handleAdjust(-1)} disabled={isAdjusting}><Minus size={18} /></Button>
            <Button variant="outline-success" className="flex-grow-1" onClick={() => handleAdjust(1)} disabled={isAdjusting}><Plus size={18} /></Button>
            <Button variant="outline-primary" onClick={() => setShowManual(!showManual)} disabled={isAdjusting}><Edit3 size={18} /></Button>
          </div>
        </div>

        {showManual && (
          <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning mb-3">
            <InputGroup size="sm">
              <Form.Control type="number" placeholder="Stock real" value={manualStock} onChange={e => setManualStock(e.target.value)} />
              <Button variant="warning" onClick={handleManualEntry} disabled={isAdjusting}><Check size={18} /></Button>
            </InputGroup>
          </div>
        )}

        {/* Sección de Precios y Categoría para Admin */}
        {isAdmin && (
          <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="text-primary small fw-bold">Edición Administrador</label>
              <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setIsEditingPrices(!isEditingPrices)}>
                {isEditingPrices ? 'Cancelar' : 'Editar'}
              </Button>
            </div>
            
            {isEditingPrices ? (
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="extra-small mb-0">Compra</Form.Label>
                    <Form.Control size="sm" type="number" value={prices.price_buy} onChange={e => {
                      if (parseFloat(e.target.value) < 0) return;
                      setPrices({...prices, price_buy: e.target.value});
                    }} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="extra-small mb-0">Venta</Form.Label>
                    <Form.Control size="sm" type="number" value={prices.price_sell} onChange={e => {
                      if (parseFloat(e.target.value) < 0) return;
                      setPrices({...prices, price_sell: e.target.value});
                    }} />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="extra-small mb-0">Categoría</Form.Label>
                    <Form.Select size="sm" value={prices.category_id} onChange={e => setPrices({...prices, category_id: e.target.value})}>
                      <option value="">Sin Categoría</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Button variant="primary" size="sm" className="w-100 mt-2" onClick={handleUpdatePrices} disabled={isAdjusting}>Guardar Cambios</Button>
                </Col>
              </Row>
            ) : (
              <div className="d-flex justify-content-between small">
                <div><span className="text-muted">Costo: </span><span className="fw-bold">${product.price_buy || '0.00'}</span></div>
                <div><span className="text-muted">Categoría: </span><span className="fw-bold text-dark">{product.category_name || 'N/A'}</span></div>
              </div>
            )}
          </div>
        )}

        {product.description && (
          <div className="mb-2 small border-top pt-2">
            <label className="text-muted d-flex align-items-center mb-1"><Info size={14} className="me-1" /> Descripción</label>
            <p className="text-dark mb-0">{product.description}</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={handleClose} className="w-100 rounded-3 py-2">Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductDetailModal;
