import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { Camera, Upload, X, Plus, Trash2 } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductModal = ({ show, handleClose, refreshProducts, refreshCategories, categories, editProduct, allProducts = [] }) => {
  const [nameMatches, setNameMatches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [skuMatch, setSkuMatch] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);
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
  const skuRef = useRef(null);

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
    setNameMatches([]);
    setSelectedIndex(0);
    setSkuMatch(null);
  }, [editProduct, show]);

  React.useEffect(() => {
    if (show && editProduct && nameRef.current) {
      setTimeout(() => nameRef.current.focus(), 200);
    }
  }, [show, editProduct]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'name') {
      // Solo capitalizar si se está agregando texto al final (no editando en el medio)
      const cursorPos = e.target.selectionStart;
      const isAddingAtEnd = cursorPos === value.length;
      
      if (isAddingAtEnd && value.length > formData.name.length) {
        // Solo capitalizar la última palabra agregada
        const words = value.split(' ');
        const lastWord = words[words.length - 1];
        if (lastWord.length === 1) {
          words[words.length - 1] = lastWord.toUpperCase();
          value = words.join(' ');
        }
      }
      
      // Buscar coincidencias de nombre
      if (value.length >= 3) {
        const searchTerms = value.toLowerCase().split(' ').filter(t => t.length > 0);
        const matches = allProducts.filter(p => {
          if (p.id === editProduct?.id) return false;
          const productName = p.name.toLowerCase();
          // Debe contener todos los términos de búsqueda
          return searchTerms.every(term => productName.includes(term));
        }).slice(0, 5);
        setNameMatches(matches);
        setSelectedIndex(0);
      } else {
        setNameMatches([]);
        setSelectedIndex(0);
      }
    }
    
    if (name === 'sku') {
      const match = allProducts.find(p => p.sku === value && p.id !== editProduct?.id);
      setSkuMatch(match || null);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleKeyDown = (e) => {
    if (nameMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % nameMatches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + nameMatches.length) % nameMatches.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectSimilarProduct(nameMatches[selectedIndex]);
      } else if (e.key === 'Escape') {
        setNameMatches([]);
        setSelectedIndex(0);
      }
    }
  };

  const selectSimilarProduct = (product) => {
    setFormData({
      ...formData,
      name: product.name,
      description: product.description || '',
      price_buy: product.price_buy || '',
      price_sell: product.price_sell || '',
      category_id: product.category_id || ''
    });
    setNameMatches([]); // Ocultar sugerencias
    toast.success('Datos base cargados de ' + product.name);
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
      
      if (editProduct) {
        // Si es edición, cerrar el modal
        handleClose();
      } else {
        // Si es nuevo, limpiar el formulario y mantener abierto
        setFormData({ name: '', description: '', sku: '', price_buy: '', price_sell: '', stock: '', category_id: '' });
        setImage(null);
        setPreview(null);
        setError('');
        // Enfocar el campo SKU para el siguiente producto
        setTimeout(() => skuRef.current?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await axios.post('/api/products/categories', { name: newCatName });
      setNewCatName('');
      refreshCategories();
      toast.success('Categoría creada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear categoría');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`/api/products/categories/${id}`);
      refreshCategories();
      toast.success('Categoría eliminada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar categoría');
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
                <Form.Label className="fw-bold">1. SKU / Código de Barras</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control 
                    name="sku" 
                    value={formData.sku} 
                    onChange={handleInputChange} 
                    ref={skuRef}
                    required 
                    isInvalid={!!skuMatch}
                    placeholder="Escanee o escriba el código..."
                    autoFocus={!editProduct}
                  />
                  <Button variant="outline-secondary" onClick={() => setShowScanner(true)}>
                    <Camera size={18} />
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {skuMatch && `Ya existe: ${skuMatch.name}`}
                  </Form.Control.Feedback>
                </InputGroup>
                {skuMatch && (
                  <Alert variant="warning" className="pt-1 pb-1 mt-1 mb-0 small border-0 bg-transparent text-danger p-0 fw-bold">
                    ⚠️ Este código ya pertenece a "{skuMatch.name}"
                  </Alert>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">2. Nombre del Producto</Form.Label>
                <Form.Control 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  onKeyDown={handleKeyDown}
                  ref={nameRef} 
                  required 
                  placeholder="Ej: Jugo Clight Limonada"
                />
                {nameMatches.length > 0 && (
                  <div className="position-relative">
                    <ListGroup className="position-absolute w-100 shadow-sm z-index-1000 mt-1" style={{ zIndex: 1050 }}>
                      {nameMatches.map((m, idx) => (
                        <ListGroup.Item 
                          key={m.id} 
                          action 
                          active={idx === selectedIndex}
                          onClick={() => selectSimilarProduct(m)}
                          className="d-flex justify-content-between align-items-center py-2"
                        >
                          <div>
                            <div className="fw-bold small">{m.name}</div>
                            <small className={idx === selectedIndex ? "text-white" : "text-muted"}>Precio: ${m.price_sell}</small>
                          </div>
                          <Badge bg={idx === selectedIndex ? "light" : "info"} text={idx === selectedIndex ? "dark" : "white"} pill className="small">Usar Base</Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0 fw-bold">3. Categoría</Form.Label>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 text-decoration-none" 
                    onClick={() => setShowCatManager(!showCatManager)}
                  >
                    {showCatManager ? 'Cerrar Gestor' : 'Gestionar Categorías'}
                  </Button>
                </div>
                {showCatManager ? (
                  <div className="bg-light p-2 rounded border mb-2">
                    <InputGroup size="sm" className="mb-2">
                      <Form.Control 
                        placeholder="Nueva categoría..." 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      />
                      <Button variant="success" onClick={handleAddCategory}>
                        <Plus size={16} />
                      </Button>
                    </InputGroup>
                    <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                      {categories.map(cat => (
                        <Badge 
                          key={cat.id} 
                          bg="secondary" 
                          className="d-flex align-items-center gap-1"
                          style={{ cursor: 'default' }}
                        >
                          {cat.name}
                          <X 
                            size={12} 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => handleDeleteCategory(cat.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Form.Select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                    <option value="">Sin Categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                )}
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
