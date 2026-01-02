import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Package, Camera, Upload, X, Check, Search } from 'lucide-react';
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

  useEffect(() => {
    if (show) {
      setFormData({
        name: '',
        description: '',
        sku: initialSku,
        price_buy: '',
        price_sell: '',
        stock: '',
        category_id: '',
        sell_by_weight: false
      });
      setImage(null);
      setPreview(null);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
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
          {/* Vista previa de imagen */}
          <div className="mb-3 text-center" style={{ height: '140px', backgroundColor: '#f8f9fa', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            {preview ? (
              <>
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="position-absolute top-0 end-0 m-2 rounded-circle p-1"
                  onClick={() => { setImage(null); setPreview(null); }}
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
                <Package size={40} />
                <div className="mt-1 small">Sin Imagen</div>
                <div className="mt-2">
                   <Button variant="outline-primary" size="sm" onClick={() => document.getElementById('add-product-image').click()}>
                     <Upload size={14} className="me-1" /> Subir
                   </Button>
                   <input type="file" id="add-product-image" hidden onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
            )}
          </div>

          <Row className="g-2">
            <Col xs={12}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Nombre *</Form.Label>
                <Form.Control 
                  name="name"
                  placeholder="Ej: Jugo Clight"
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

            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Categoría</Form.Label>
                <Form.Select 
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sin Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Check 
                type="switch"
                id="add-sell-by-weight"
                label="Se vende por peso"
                name="sell_by_weight"
                className="small fw-bold text-primary mt-1"
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
