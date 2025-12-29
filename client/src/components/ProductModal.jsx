import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Camera, Upload, X } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductModal = ({ show, handleClose, refreshProducts, categories, editProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price_buy: '',
    price_sell: '',
    stock: '',
    category_id: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nameRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || '',
        description: editProduct.description || '',
        sku: editProduct.sku || '',
        price_buy: editProduct.price_buy || '',
        price_sell: editProduct.price_sell || '',
        stock: editProduct.stock || '',
        category_id: editProduct.category_id || ''
      });
      setPreview(editProduct.image_url ? `${editProduct.image_url}` : null);
    } else {
      setFormData({ name: '', description: '', sku: '', price_buy: '', price_sell: '', stock: '', category_id: '' });
      setPreview(null);
      setImage(null);
    }
  }, [editProduct, show]);

  React.useEffect(() => {
    if (show && editProduct && nameRef.current) {
      setTimeout(() => nameRef.current.focus(), 200);
    }
  }, [show, editProduct]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
    } catch (err) {
      setError('No se pudo acceder a la cámara');
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ajustar el canvas al tamaño real del video capturado
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.8); // 0.8 para calidad/peso balanceado
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      if (editProduct) {
        await axios.put(`/api/products/${editProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success(editProduct ? 'Producto actualizado' : 'Producto creado');
      refreshProducts();
      handleClose();
      // Reset form si es nuevo
      if (!editProduct) {
        setFormData({ name: '', description: '', sku: '', price_buy: '', price_sell: '', stock: '', category_id: '' });
        setImage(null);
        setPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control name="name" value={formData.name} onChange={handleInputChange} ref={nameRef} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                  <option value="">Sin Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>SKU / Código de Barras</Form.Label>
                <InputGroup>
                  <Form.Control name="sku" value={formData.sku} onChange={handleInputChange} required />
                  <Button variant="outline-secondary" onClick={() => setShowScanner(true)}>
                    <Camera size={18} />
                  </Button>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Detalles adicionales del producto..."
                />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>P. Compra</Form.Label>
                    <Form.Control type="number" name="price_buy" value={formData.price_buy} onChange={handleInputChange} step="0.01" />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>P. Venta</Form.Label>
                    <Form.Control 
                      type="number" 
                      name="price_sell" 
                      value={formData.price_sell}
                      onChange={handleInputChange} 
                      step="0.01" 
                      required 
                      placeholder={formData.price_buy ? (parseFloat(formData.price_buy) * 1.20).toFixed(2) : '0.00'}
                    />
                    <Form.Text className="text-muted">
                      {formData.price_buy && `Sugerencia (+20%): $${(parseFloat(formData.price_buy) * 1.20).toFixed(2)}`}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>{editProduct ? 'Stock Actual' : 'Stock Inicial'}</Form.Label>
                <Form.Control type="number" name="stock" value={formData.stock} onChange={handleInputChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="text-center">
                <Form.Label>Imagen del Producto</Form.Label>
                <div className="border rounded mb-3 d-flex align-items-center justify-content-center bg-light" style={{ height: '200px', overflow: 'hidden' }}>
                  {preview ? (
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  ) : (
                    <span className="text-muted">Sin Imagen</span>
                  )}
                </div>
                {!showCamera ? (
                  <div className="d-grid gap-2 d-md-block">
                    <Button variant="outline-primary" className="me-2" onClick={() => document.getElementById('fileInput').click()}>
                      <Upload size={18} /> Subir
                    </Button>
                    <Button variant="outline-secondary" onClick={startCamera}>
                      <Camera size={18} /> Cámara
                    </Button>
                    <input id="fileInput" type="file" hidden onChange={handleFileChange} accept="image/*" />
                  </div>
                ) : (
                  <div>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto', borderRadius: '8px' }}></video>
                    <div className="mt-2">
                      <Button variant="success" onClick={takePhoto} className="me-2">Capturar</Button>
                      <Button variant="danger" onClick={stopCamera}>Cancelar</Button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar Producto</Button>
        </Modal.Footer>
      </Form>
      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => { setFormData({...formData, sku: code}); setShowScanner(false); }} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </Modal>
  );
};

export default ProductModal;
