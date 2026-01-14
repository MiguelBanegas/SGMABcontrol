import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { Camera, Upload, X, Plus, Trash2 } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
    category_id: '',
    sell_by_weight: false,
    price_offer: '',
    is_offer: false,
    promo_buy: '',
    promo_pay: '',
    promo_type: 'none'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [estimatedPercentage, setEstimatedPercentage] = useState(20);

  React.useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || '',
        description: editProduct.description || '',
        sku: editProduct.sku || '',
        price_buy: editProduct.price_buy || '',
        price_sell: editProduct.price_sell || '',
        stock: editProduct.stock ? Math.floor(editProduct.stock) : '',
        category_id: editProduct.category_id || '',
        sell_by_weight: !!editProduct.sell_by_weight,
        price_offer: editProduct.price_offer || '',
        is_offer: !!editProduct.is_offer,
        promo_buy: editProduct.promo_buy || '',
        promo_pay: editProduct.promo_pay || '',
        promo_type: editProduct.promo_type || 'none'
      });
      setPreview(editProduct.image_url ? `${editProduct.image_url}` : null);
    } else {
      setFormData({ name: '', description: '', sku: '', price_buy: '', price_sell: '', stock: '', category_id: '', sell_by_weight: false, price_offer: '', is_offer: false });
      setPreview(null);
      setImage(null);
    }
    setNameMatches([]);
    setSelectedIndex(0);
    setSkuMatch(null);
    setShowConfirmation(false);
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

    if (e.target.type === 'checkbox') {
      value = e.target.checked;
    }

    if (['stock', 'price_buy', 'price_sell', 'price_offer'].includes(name)) {
      if (parseFloat(value) < 0) {
        toast.error('No se permiten valores negativos');
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleStockAdjustment = async (e) => {
    if (e && e.key === 'Enter') {
      e.preventDefault();
      await executeStockAdjustment();
    }
  };

  const executeStockAdjustment = async () => {
    const adjustment = parseFloat(stockAdjustment);
    if (!isNaN(adjustment) && adjustment !== 0) {
      try {
        const newStock = Math.max(0, (parseFloat(formData.stock) || 0) + adjustment);
        const token = localStorage.getItem('token');
        await axios.patch(`/api/products/${editProduct.id}`, 
          { stock: newStock },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setFormData(prev => ({ ...prev, stock: newStock }));
        setStockAdjustment('');
        toast.success('Stock actualizado');
        refreshProducts();
      } catch (err) {
        console.error('Error al ajustar stock:', err);
        toast.error('Error al actualizar stock');
      }
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (skuMatch) {
      toast.error('El SKU ya existe');
      return;
    }
    setShowConfirmation(true);
  };

  const handleFinalSubmit = async () => {
    setError('');
    const data = new FormData();
    const finalFormData = { ...formData };
    
    // Si no es oferta, limpiar campos de promoción para evitar inconsistencias
    if (!finalFormData.is_offer) {
      finalFormData.price_offer = '';
      finalFormData.promo_type = 'none';
      finalFormData.promo_buy = '';
      finalFormData.promo_pay = '';
    }

    Object.keys(finalFormData).forEach(key => data.append(key, finalFormData[key]));
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
        handleClose();
      } else {
        setFormData({ name: '', description: '', sku: '', price_buy: '', price_sell: '', stock: '', category_id: '', sell_by_weight: false, price_offer: '', is_offer: false });
        setImage(null);
        setPreview(null);
        setError('');
        setShowConfirmation(false);
        setTimeout(() => skuRef.current?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
      setShowConfirmation(false);
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

  const handleDelete = async () => {
    if (!editProduct) return;
    
    try {
      await axios.delete(`/api/products/${editProduct.id}`);
      toast.success('Producto desactivado correctamente');
      setShowDeleteConfirm(false);
      handleClose(); // Cerrar modal ANTES de refrescar
      refreshProducts(); // Refrescar después de cerrar
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al desactivar el producto');
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
          
          {showConfirmation ? (
            <div className="confirmation-summary">
              <Alert variant="info" className="mb-4">
                <h5 className="alert-heading mb-0">Revisa los detalles antes de guardar</h5>
              </Alert>
              <Row>
                <Col md={4} className="text-center mb-3">
                  <div className="border rounded bg-light d-flex align-items-center justify-content-center" style={{ height: '180px', overflow: 'hidden' }}>
                    {preview ? (
                      <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    ) : (
                      <span className="text-muted">Sin Imagen</span>
                    )}
                  </div>
                </Col>
                <Col md={8}>
                  <table className="table table-sm table-bordered">
                    <tbody>
                      <tr>
                        <th className="bg-light" style={{ width: '150px' }}>SKU</th>
                        <td>{formData.sku}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Nombre</th>
                        <td>{formData.name}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Categoría</th>
                        <td>{categories.find(c => c.id == formData.category_id)?.name || 'Sin Categoría'}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">P. Compra</th>
                        <td>${formData.price_buy || '0.00'}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">P. Venta</th>
                        <td className="fw-bold text-primary">${formData.price_sell}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">{editProduct ? 'Stock Actual' : 'Stock Inicial'}</th>
                        <td>{formData.stock} {formData.sell_by_weight ? 'Kg' : 'u.'}</td>
                      </tr>
                      {formData.is_offer && (
                        <tr>
                          <th className="bg-light text-danger">OFERTA ACTIVA</th>
                          <td>
                            {formData.promo_type === 'price' && <span>Solo Precio: ${formData.price_offer}</span>}
                            {formData.promo_type === 'quantity' && <span>Promo: {formData.promo_buy}×{formData.promo_pay}</span>}
                            {formData.promo_type === 'both' && <span>${formData.price_offer} + {formData.promo_buy}×{formData.promo_pay}</span>}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Col>
              </Row>
            </div>
          ) : (
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
                        placeholder={formData.price_buy ? (parseFloat(formData.price_buy) * (1 + estimatedPercentage / 100)).toFixed(2) : '0.00'}
                      />
                      <InputGroup size="sm" className="mt-2">
                        <InputGroup.Text>% Ganancia:</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          value={estimatedPercentage}
                          onChange={(e) => setEstimatedPercentage(parseFloat(e.target.value) || 0)}
                          step="1"
                          min="0"
                          max="500"
                          style={{ maxWidth: '80px' }}
                        />
                        <InputGroup.Text className="text-muted small">
                          {formData.price_buy && `= $${(parseFloat(formData.price_buy) * (1 + estimatedPercentage / 100)).toFixed(2)}`}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{editProduct ? '3. Stock' : '3. Stock Inicial'}</Form.Label>
                  {editProduct ? (
                    <div className="d-flex align-items-center gap-3 bg-light p-2 rounded border">
                      <div className="d-flex flex-column">
                        <small className="text-muted mb-1">Stock Actual:</small>
                        <Badge bg={formData.stock > 10 ? 'success' : formData.stock > 0 ? 'warning' : 'danger'} pill className="fs-6 py-2 px-3">
                          {formData.stock} unidades
                        </Badge>
                      </div>
                      <div className="flex-grow-1">
                        <small className="text-muted d-block mb-1">Ajustar (+ o -):</small>
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-white border-end-0 text-primary">
                            <Plus size={16} />
                          </InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            className="border-start-0 border-end-0"
                            placeholder="Ej: 5 o -2"
                            value={stockAdjustment}
                            onChange={(e) => setStockAdjustment(e.target.value)}
                            onKeyDown={handleStockAdjustment}
                          />
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={executeStockAdjustment}
                            disabled={!stockAdjustment || parseFloat(stockAdjustment) === 0}
                          >
                            Aceptar
                          </Button>
                        </InputGroup>
                        <Form.Text className="x-small text-muted">Presiona Enter o haz clic en Aceptar</Form.Text>
                      </div>
                    </div>
                  ) : (
                    <Form.Control 
                      type="number" 
                      name="stock" 
                      value={formData.stock} 
                      onChange={handleInputChange} 
                      step="0.001" 
                      required 
                      placeholder="Cantidad inicial..."
                    />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="sell-by-weight-switch"
                    label="Se vende por peso (Kg, gramos, etc.)"
                    name="sell_by_weight"
                    checked={formData.sell_by_weight}
                    onChange={handleInputChange}
                    className="fw-bold text-primary"
                  />
                  <Form.Text className="text-muted">
                    Habilitar esto para que el sistema solicite el peso al vender este producto.
                  </Form.Text>
                </Form.Group>

                <hr />
                <h5 className="mb-3 text-danger">🎁 Configuración de Oferta</h5>
                
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="is-offer-switch"
                    label="ACTIVAR OFERTA"
                    name="is_offer"
                    checked={formData.is_offer}
                    onChange={handleInputChange}
                    className="fw-bold text-danger"
                  />
                </Form.Group>

                {formData.is_offer && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Tipo de Oferta</Form.Label>
                      <Form.Select 
                        value={formData.promo_type}
                        onChange={(e) => setFormData({...formData, promo_type: e.target.value})}
                      >
                        <option value="none">Sin oferta</option>
                        <option value="price">Solo Precio Oferta</option>
                        <option value="quantity">Solo Promoción XxY</option>
                        <option value="both">Ambas (Precio + XxY)</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Selecciona qué tipo de oferta aplicar a este producto
                      </Form.Text>
                    </Form.Group>

                    {(formData.promo_type === 'price' || formData.promo_type === 'both') && (
                      <Form.Group className="mb-3">
                        <Form.Label>Precio de Oferta ($)</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="price_offer" 
                          value={formData.price_offer} 
                          onChange={handleInputChange} 
                          step="0.01"
                          placeholder="Ej: 1000"
                        />
                        <Form.Text className="text-muted">
                          Precio con descuento
                        </Form.Text>
                      </Form.Group>
                    )}

                    {(formData.promo_type === 'quantity' || formData.promo_type === 'both') && (
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Promoción XxY (Lleva X, Paga Y)</Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <div style={{ width: '100px' }}>
                            <Form.Label className="small mb-1">Lleva</Form.Label>
                            <Form.Control
                              type="number"
                              name="promo_buy"
                              value={formData.promo_buy}
                              onChange={handleInputChange}
                              placeholder="2"
                            />
                          </div>
                          <span className="mt-4">×</span>
                          <div style={{ width: '100px' }}>
                            <Form.Label className="small mb-1">Paga</Form.Label>
                            <Form.Control
                              type="number"
                              name="promo_pay"
                              value={formData.promo_pay}
                              onChange={handleInputChange}
                              placeholder="1"
                            />
                          </div>
                          {formData.promo_buy && formData.promo_pay && (
                            <Badge bg="danger" className="ms-2 mt-4">
                              🔥 {formData.promo_buy}×{formData.promo_pay}
                            </Badge>
                          )}
                        </div>
                        <Form.Text className="text-muted">
                          Ejemplo: 2×1 (Lleva 2, Paga 1), 3×2 (Lleva 3, Paga 2)
                        </Form.Text>
                      </Form.Group>
                    )}

                    {formData.promo_type !== 'none' && formData.price_sell && (
                      <Alert variant="info" className="small">
                        <strong>💡 Vista Previa:</strong><br/>
                        {formData.promo_type === 'price' && formData.price_offer && (
                          <span>Precio: ${formData.price_sell} → ${formData.price_offer}</span>
                        )}
                        {formData.promo_type === 'quantity' && formData.promo_buy && formData.promo_pay && (
                          <span>Promo: {formData.promo_buy}×{formData.promo_pay} sobre ${formData.price_sell}</span>
                        )}
                        {formData.promo_type === 'both' && formData.price_offer && formData.promo_buy && formData.promo_pay && (
                          <>
                            Precio: ${formData.price_sell} → ${formData.price_offer}<br/>
                            Promo: {formData.promo_buy}×{formData.promo_pay} sobre precio oferta
                          </>
                        )}
                      </Alert>
                    )}
                  </>
                )}
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
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            {editProduct && !showConfirmation && (
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                Desactivar Producto
              </Button>
            )}
          </div>
          <div>
            {!showConfirmation ? (
              <>
                <Button variant="secondary" onClick={handleClose} className="me-2">Cancelar</Button>
                <Button variant="primary" type="submit">Guardar Producto</Button>
              </>
            ) : (
              <>
                <Button variant="outline-secondary" onClick={() => setShowConfirmation(false)} className="me-2">Volver a Editar</Button>
                <Button variant="success" onClick={handleFinalSubmit}>Confirmar y Guardar</Button>
              </>
            )}
          </div>
        </Modal.Footer>
      </Form>
      
      {/* Modal de confirmación de desactivación */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Desactivación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas desactivar el producto <strong>{editProduct?.name}</strong>?</p>
          <p className="text-muted mb-0"><small>El producto se ocultará de los listados pero podrás reactivarlo creando un producto nuevo con el mismo código SKU.</small></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Desactivar
          </Button>
        </Modal.Footer>
      </Modal>
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
