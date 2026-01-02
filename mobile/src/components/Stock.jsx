import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Badge, ListGroup, Button, Container } from 'react-bootstrap';
import { Search, Package, Image as ImageIcon, TrendingUp, Settings, LogOut, Camera } from 'lucide-react';
import axios from 'axios';
import { getApiUrl, getServerUrl } from '../utils/config';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarcodeScanner as CapBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import ProductDetailModal from './ProductDetailModal';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const { logout, user } = useAuth();

  const handleScan = async () => {
    try {
      // 1. Verificar/Solicitar permisos
      const status = await CapBarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
          const requestStatus = await CapBarcodeScanner.requestPermissions();
          if (requestStatus.camera !== 'granted') {
              alert('Se requiere permiso de cámara para escanear');
              return;
          }
      }

      // 2. Asegurarse de que el módulo esté instalado
      try {
        await CapBarcodeScanner.installGoogleBarcodeScannerModule();
      } catch (installErr) {
        console.log('El módulo ya estaba instalado o hubo un error menor:', installErr.message);
      }
      
      // 3. Iniciar escaneo
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
          alert('SKU no encontrado: ' + sku);
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
    : products.slice(0, 20); // Mostrar los primeros 20 por defecto si no hay búsqueda

  return (
    <Container fluid className="px-3 py-2 bg-light" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
            <Package className="me-2 text-primary" size={24} /> Stock
        </h4>
        <div className="d-flex gap-2">
            <Link to="/settings" className="btn btn-light btn-sm rounded-circle p-2 shadow-sm">
                <Settings size={20} className="text-secondary" />
            </Link>
            <Button variant="light" size="sm" onClick={logout} className="rounded-circle p-2 shadow-sm text-danger">
                <LogOut size={20} />
            </Button>
        </div>
      </div>

      <InputGroup className="mb-4 shadow-sm border-0">
        <InputGroup.Text className="bg-white border-0">
          <Search size={18} className="text-muted" />
        </InputGroup.Text>
        <Form.Control
          placeholder="Buscar producto o SKU..."
          className="border-0 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
            variant="white" 
            className="border-0 pe-3 text-muted" 
            onClick={handleScan}
        >
            <Camera size={20} />
        </Button>
      </InputGroup>

      {loading ? (
          <div className="text-center py-5">Cargando productos...</div>
      ) : (
          <Row xs={2} md={3} className="g-3">
            {filteredProducts.map(product => (
              <Col key={product.id}>
                <Card 
                    className="h-100 border-0 shadow-sm rounded-3 overflow-hidden" 
                    onClick={() => handleProductClick(product)}
                    style={{ cursor: 'pointer' }}
                >
                  <div style={{ height: '120px', backgroundColor: '#f8f9fa', position: 'relative' }}>
                    {product.image_url ? (
                      <img 
                        src={`${getServerUrl()}${product.image_url}`} 
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-25">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <Badge bg="dark" className="position-absolute top-0 end-0 m-1 opacity-75" style={{ fontSize: '0.6rem' }}>
                      {product.sku}
                    </Badge>
                  </div>
                  <Card.Body className="p-2">
                    <Card.Title className="small fw-bold mb-1 text-truncate" title={product.name}>
                        {product.name}
                    </Card.Title>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-primary fw-bold small">${product.price_sell}</span>
                      <Badge bg={product.stock > 5 ? "success" : "warning"} style={{ fontSize: '0.65rem' }}>
                        {Number(product.stock)}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
      )}

      {searchTerm.length > 0 && searchTerm.length < 3 && (
          <div className="text-center text-muted mt-3 small">
              Escriba al menos 3 caracteres para buscar...
          </div>
      )}
      
      {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-5 text-muted">No se encontraron productos</div>
      )}

      <ProductDetailModal 
        show={showDetail} 
        handleClose={() => setShowDetail(false)} 
        product={selectedProduct} 
      />
    </Container>
  );
};

export default Stock;
