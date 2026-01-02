import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { Package, Camera, Upload, X, Check, Search, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl, getServerUrl } from '../utils/config';

const AddProductModal = ({ show, handleClose, initialSku = '', refreshProducts }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price_buy: '',
    price_sell: '',
    stock: '',
    category_id: '',
    sell_by_weight: false
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show) {
      setFormData({
        name: '',
        description: '',
        sku: initialSku || '',
        price_buy: '',
        price_sell: '',
        stock: '',
        category_id: '',
        sell_by_weight: false
      });
      setImage(null);
      setPreview(null);
      setShowCamera(false);
      fetchCategories();
    }
  }, [show, initialSku]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/products/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddCategory = async (name) => {
    try {
      const res = await axios.post(`${getApiUrl()}/products/categories`, { name });
      toast.success('Categoría creada');
      await fetchCategories();
      setFormData(prev => ({ ...prev, category_id: res.data.id }));
    } catch (err) {
      toast.error('Error al crear categoría');
    }
  };

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'name') {
      newValue = capitalizeWords(value);
    }

    if (['stock', 'price_buy', 'price_sell'].includes(name)) {
      if (parseFloat(value) < 0) {
        toast.error('No se permiten valores negativos');
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Sugerencia de precio
    if (name === 'price_buy' && value) {
      const buy = parseFloat(value);
      if (!isNaN(buy)) {
        const suggestion = (buy * 1.20).toFixed(2);
        // Solo sugerimos si el precio de venta está vacío o es menor al costo
        if (!formData.price_sell || parseFloat(formData.price_sell) <= buy) {
          setFormData(prev => ({ ...prev, price_sell: suggestion }));
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setShowCamera(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('No se pudo acceder a la cámara');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "product.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price_sell) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (image) {
      data.append('image', image);
    }

    try {
      await axios.post(`${getApiUrl()}/products`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Producto creado con éxito');
      refreshProducts();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear producto';
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="md" className="mobile-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Nuevo Producto</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <Form onSubmit={handleSubmit}>
          {/* Cámara / Vista previa */}
          <div className="mb-3 text-center" style={{ minHeight: '160px', backgroundColor: '#f8f9fa', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            {showCamera ? (
              <div className="position-relative w-100" style={{ height: '240px' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
                  <Button variant="primary" className="rounded-pill px-4" onClick={takePhoto}>Capturar</Button>
                  <Button variant="light" className="rounded-pill" onClick={stopCamera}>Cancelar</Button>
                </div>
              </div>
            ) : preview ? (
              <div className="position-relative" style={{ height: '160px' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="position-absolute top-0 end-0 m-2 rounded-circle p-1"
                  onClick={() => { setImage(null); setPreview(null); }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50 py-4">
                <Package size={48} />
                <div className="mt-2 small">Imagen del Producto</div>
                <div className="mt-3 d-flex gap-2">
                   <Button variant="outline-primary" size="sm" onClick={() => document.getElementById('add-product-image').click()}>
                     <Upload size={14} className="me-1" /> Galería
                   </Button>
                   <Button variant="primary" size="sm" onClick={startCamera}>
                     <Camera size={14} className="me-1" /> Cámara
                   </Button>
                   <input type="file" id="add-product-image" hidden onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <Row className="g-2">
            <Col xs={12}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Nombre *</Form.Label>
                <Form.Control 
                  name="name"
                  placeholder="Ej: Jugo De Naranja"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col xs={12}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">SKU / Código *</Form.Label>
                <Form.Control 
                  name="sku"
                  placeholder="Código de barras"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">P. Compra</Form.Label>
                <Form.Control 
                  type="number"
                  name="price_buy"
                  placeholder="0.00"
                  value={formData.price_buy}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </Form.Group>
            </Col>
            
            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">P. Venta *</Form.Label>
                <Form.Control 
                  type="number"
                  name="price_sell"
                  placeholder="0.00"
                  value={formData.price_sell}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
                {formData.price_buy && (
                  <div className="extra-small text-muted mt-1">
                    Sugerido (+20%): ${(parseFloat(formData.price_buy) * 1.20).toFixed(2)}
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Categoría</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select 
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="flex-grow-1"
                  >
                    <option value="">Sin Categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      const name = prompt('Nombre de la nueva categoría:');
                      if (name) handleAddCategory(name);
                    }}
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Stock Inicial</Form.Label>
                <Form.Control 
                  type="number"
                  name="stock"
                  placeholder="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  step="0.001"
                />
              </Form.Group>
            </Col>

            <Col xs={6} className="d-flex align-items-center">
              <Form.Check 
                type="switch"
                id="add-sell-by-weight"
                label="Venta Peso"
                name="sell_by_weight"
                className="small fw-bold text-primary mt-3"
                checked={formData.sell_by_weight}
                onChange={handleInputChange}
              />
            </Col>

            <Col xs={12} className="mt-3">
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 fw-bold"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddProductModal;
