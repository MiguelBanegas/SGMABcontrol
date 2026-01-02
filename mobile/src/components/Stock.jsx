import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Badge, ListGroup, Button, Container } from 'react-bootstrap';
import { Search, Package, Image as ImageIcon, TrendingUp, Settings, LogOut, Camera, Plus } from 'lucide-react';
import axios from 'axios';
import { getApiUrl, getServerUrl } from '../utils/config';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarcodeScanner as CapBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import ProductDetailModal from './ProductDetailModal';
import AddProductModal from './AddProductModal';

const APP_VERSION = '1.0.1';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scannedSku, setScannedSku] = useState('');
  const { logout, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const handleScan = async () => {
    try {
      const status = await CapBarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
          const requestStatus = await CapBarcodeScanner.requestPermissions();
          if (requestStatus.camera !== 'granted') {
              alert('Se requiere permiso de cámara para escanear');
              return;
          }
      }

      try {
        await CapBarcodeScanner.installGoogleBarcodeScannerModule();
      } catch (installErr) {
        console.log('El módulo ya estaba instalado o hubo un error menor:', installErr.message);
      }
      
      const { barcodes } = await CapBarcodeScanner.scan();
      
      if (barcodes && barcodes.length > 0) {
        const sku = barcodes[0].displayValue;
        setSearchTerm(sku);
        
        try {
          const res = await axios.get(`${getApiUrl()}/products/sku/${sku}`);
          if (res.data) {
            setSelectedProduct(res.data);
            setShowDetail(true);
          }
        } catch (searchErr) {
          if (searchErr.response?.status === 404) {
            if (isAdmin) {
              if (window.confirm(`El SKU ${sku} no existe. ¿Desea agregarlo como nuevo producto?`)) {
                setScannedSku(sku);
                setShowAddModal(true);
              }
            } else {
              alert('SKU no encontrado: ' + sku);
            }
          } else {
            alert('Error al buscar SKU: ' + (searchErr.response?.data?.message || searchErr.message));
          }
        }
      }
    } catch (err) {
      console.error('Error al escanear:', err);
      alert('Error al abrir escáner: ' + err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      fetchProducts();
      if (selectedProduct) {
        axios.get(`${getApiUrl()}/products/sku/${selectedProduct.sku}`)
          .then(res => {
            if (res.data) setSelectedProduct(res.data);
          })
          .catch(err => console.error('Error refreshing selected product:', err));
      }
    };

    socket.on('catalog_updated', handleUpdate);
    return () => socket.off('catalog_updated', handleUpdate);
  }, [selectedProduct]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const filteredProducts = searchTerm.length >= 3 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products.slice(0, 20); 

  return (
    <Container fluid className="px-3 py-2 bg-light d-flex flex-column" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 pt-2">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
            <Package className="me-2 text-primary" size={24} /> Stock
        </h4>
        <div className="d-flex gap-2">
            {isAdmin && (
              <Button 
                variant="primary" 
                size="sm" 
                className="rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                onClick={() => { setScannedSku(''); setShowAddModal(true); }}
              >
                <Plus size={22} />
              </Button>
            )}
            <Link to="/settings" className="btn btn-light btn-sm rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <Settings size={20} className="text-secondary" />
            </Link>
            <Button variant="light" size="sm" onClick={logout} className="rounded-circle p-2 shadow-sm text-danger d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <LogOut size={20} />
            </Button>
        </div>
      </div>

      <InputGroup className="mb-3 shadow-sm border-0">
        <InputGroup.Text className="bg-white border-0 pe-1">
          <Search size={18} className="text-muted" />
        </InputGroup.Text>
        <Form.Control
          placeholder="Buscar producto o SKU..."
          className="border-0 py-2 shadow-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
            variant="white" 
            className="border-0 pe-3 text-muted bg-white" 
            onClick={handleScan}
        >
            <Camera size={20} />
        </Button>
      </InputGroup>

      {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            Cargando productos...
          </div>
      ) : (
          <div className="flex-grow-1">
            {filteredProducts.length > 0 ? (
              <div className="d-flex flex-column gap-2 pb-5">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-3 p-2 shadow-sm border-start border-4 border-primary d-flex align-items-center"
                    onClick={() => handleProductClick(product)}
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#f8f9fa', overflow: 'hidden', marginRight: '12px', flexShrink: 0 }}>
                       {product.image_url ? (
                         <img src={`${getServerUrl()}${product.image_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-25">
                           <Package size={24} />
                         </div>
                       )}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '70%' }}>{product.name}</h6>
                        <span className="fw-bold text-primary small">${product.price_sell}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-muted extra-small">{product.sku}</small>
                        <Badge bg={product.stock <= 0 ? 'danger' : 'light'} className={`extra-small ${product.stock <= 0 ? '' : 'text-dark border'}`}>
                          {product.stock} {product.sell_by_weight ? 'kg' : 'uds.'}
                        </Badge>
                      </div>
                      {product.category_name && (
                        <div className="extra-small text-muted mt-1 opacity-75 d-flex align-items-center" style={{ fontSize: '0.65rem' }}>
                           <Badge bg="secondary" className="opacity-75">{product.category_name}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="text-center py-3 opacity-25 mt-3">
                   <small className="extra-small">SGMAB Control - v{APP_VERSION}</small>
                </div>
              </div>
            ) : (
              <div className="text-center mt-5 opacity-50">
                <Search size={48} className="mb-2" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
      )}

      {searchTerm.length > 0 && searchTerm.length < 3 && !loading && (
          <div className="text-center text-muted mt-2 extra-small">
              Escriba al menos 3 caracteres para filtrar...
          </div>
      )}

      <ProductDetailModal 
        show={showDetail} 
        handleClose={() => setShowDetail(false)} 
        product={selectedProduct} 
      />

      <AddProductModal 
        show={showAddModal} 
        handleClose={() => setShowAddModal(false)}
        initialSku={scannedSku}
        refreshProducts={fetchProducts}
      />
    </Container>
  );
};

export default Stock;
