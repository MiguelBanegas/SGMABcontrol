import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Badge, ListGroup, Button, Container, Alert } from 'react-bootstrap';
import { Search, Package, Image as ImageIcon, TrendingUp, Settings, LogOut, Camera, Plus, Globe } from 'lucide-react';
import axios from 'axios';
import { getApiUrl, getServerUrl, isVpsConnection } from '../utils/config';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarcodeScanner as CapBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import ProductDetailModal from './ProductDetailModal';
import AddProductModal from './AddProductModal';
import { useConnectivity } from '../context/ConnectivityContext';
import { db } from '../utils/db';
import { syncProducts } from '../utils/syncService';
import toast from 'react-hot-toast';

const APP_VERSION = '1.1.2';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [activeTab, setActiveTab] = useState('top'); // 'top', 'low', 'search'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scannedSku, setScannedSku] = useState('');
  const { isOffline } = useConnectivity();
  const [isSyncing, setIsSyncing] = useState(false);
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
        setActiveTab('search');
        
        try {
          let productData;
          if (isOffline) {
            productData = await db.products.where('sku').equalsIgnoreCase(sku).first();
          } else {
            const res = await axios.get(`${getApiUrl()}/products/sku/${sku}`);
            productData = res.data;
          }

          if (productData) {
            setSelectedProduct(productData);
            setShowDetail(true);
          } else if (isOffline) {
            alert('SKU no encontrado en modo offline: ' + sku);
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

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (isOffline) {
        // En modo offline usamos todos los productos o limitamos
        const allLocal = await db.products.toArray();
        setTopSellers(Array.isArray(allLocal) ? allLocal.slice(0, 20) : []);
        setLowStock(Array.isArray(allLocal) ? allLocal.filter(p => !p.stock || p.stock < 5) : []);
        setLoading(false);
        return;
      }

      const [topRes, lowRes] = await Promise.all([
        axios.get(`${getApiUrl()}/products/top-sellers`).catch(() => ({ data: [] })),
        axios.get(`${getApiUrl()}/products/stats`).catch(() => ({ data: { lowStockProducts: [] } }))
      ]);
      setTopSellers(Array.isArray(topRes.data) ? topRes.data : []);
      setLowStock(Array.isArray(lowRes.data?.lowStockProducts) ? lowRes.data.lowStockProducts : []);
      
      // Aprovechamos para sincronizar en segundo plano si estamos online
      syncProducts();
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      // Fallback a vacíos para evitar crash
      setTopSellers([]);
      setLowStock([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (searchTerm.length < 3) return;
    setLoading(true);
    try {
      if (isOffline) {
        const query = searchTerm.toLowerCase();
        let filtered = await db.products
          .filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) || 
            (p.sku && p.sku.toLowerCase().includes(query))
          )
          .toArray();
        
        // Replicar relevancia del servidor: que empiecen con el término primero
        filtered = filtered.sort((a, b) => {
          const aName = a.name?.toLowerCase() || '';
          const bName = b.name?.toLowerCase() || '';
          const aSku = a.sku?.toLowerCase() || '';
          const bSku = b.sku?.toLowerCase() || '';
          
          const aStarts = aName.startsWith(query) || aSku.startsWith(query);
          const bStarts = bName.startsWith(query) || bSku.startsWith(query);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return aName.localeCompare(bName);
        });

        setProducts(Array.isArray(filtered) ? filtered : []);
      } else {
        // Usar la búsqueda oficial del servidor
        const res = await axios.get(`${getApiUrl()}/products/search?q=${searchTerm}`);
        setProducts(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      // Fallback a offline si el servidor falla
      const query = searchTerm.toLowerCase();
      const filtered = await db.products
          .filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) || 
            (p.sku && p.sku.toLowerCase().includes(query))
          )
          .toArray();
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sincronizar automáticamente al recuperar conexión
  useEffect(() => {
    if (!isOffline) {
      console.log('Conexión recuperada, sincronizando...');
      fetchInitialData();
    }
  }, [isOffline]);

  useEffect(() => {
    if (activeTab === 'search' && searchTerm.length >= 3) {
      const delayDebounceFn = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchInitialData();
      if (activeTab === 'search' && searchTerm.length >= 3) performSearch();
      
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
  }, [selectedProduct, activeTab, searchTerm]);

  const [needsUpdate, setNeedsUpdate] = useState(false);

  // Peridodic version check to force update
  useEffect(() => {
    socket.on('version_check', (data) => {
      const serverMobileVersion = typeof data === 'object' ? data.mobile : null;
      // Solo mostrar si es una versión DISTINTA y no la hemos ignorado
      if (serverMobileVersion && serverMobileVersion !== APP_VERSION) {
        const ignoredVersion = sessionStorage.getItem('ignore_version');
        if (ignoredVersion !== serverMobileVersion) {
          setNeedsUpdate(true);
        }
      } else if (serverMobileVersion === APP_VERSION) {
        // Si el servidor ya tiene nuestra versión, asegurarnos de que el modal se cierre
        setNeedsUpdate(false);
      }
    });
    return () => socket.off('version_check');
  }, []);

  const handleManualSync = async () => {
    if (isOffline) {
      toast.error('No se puede sincronizar en modo offline');
      return;
    }
    setIsSyncing(true);
    toast.loading('Sincronizando catálogo...', { id: 'sync' });
    const success = await syncProducts();
    setIsSyncing(false);
    if (success) {
      toast.success('Sincronización completa', { id: 'sync' });
      fetchInitialData();
    } else {
      toast.error('Error al sincronizar', { id: 'sync' });
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const currentProducts = activeTab === 'top' ? topSellers : (activeTab === 'low' ? lowStock : products);

  return (
    <Container fluid className="px-3 py-2 bg-light d-flex flex-column" style={{ minHeight: '100vh' }}>
      {needsUpdate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', textAlign: 'center', padding: '30px'
        }}>
          <h2 className="mb-4">🚀 Nueva Versión 🚀</h2>
          <p className="mb-4">Hay una actualización disponible (v{APP_VERSION} → Nueva). Por seguridad, se recomienda instalar el nuevo APK.</p>
          <div className="d-flex flex-column gap-3 w-100">
            <Button 
              variant="primary" 
              size="lg" 
              className="rounded-pill py-3 fw-bold shadow-lg"
              onClick={() => window.location.reload()}
            >
              Recargar Contenido
            </Button>
            <Button 
              variant="outline-light" 
              size="sm" 
              className="rounded-pill border-0 opacity-75"
              onClick={() => {
                // Sacar del servidor qué versión es para guardarla como ignorada
                socket.emit('request_version'); // O simplemente guardamos una genérica
                // Guardamos "true" o la versión si la tuviéramos a mano
                setNeedsUpdate(false);
                // Si tuviéramos la versión del servidor aquí la guardaríamos en sessionStorage
                sessionStorage.setItem('ignore_version', 'needs_update'); 
              }}
            >
              Continuar de todas formas (Temporal)
            </Button>
          </div>
          <small className="mt-4 opacity-50">v{APP_VERSION}</small>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-3 pt-2">
        <h5 className="mb-0 fw-bold d-flex align-items-center text-primary">
            MAR FRANK Stock v{APP_VERSION}
        </h5>
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
            <Button 
                variant="light" 
                size="sm" 
                className="rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                onClick={handleManualSync}
                disabled={isSyncing}
            >
                <TrendingUp size={20} className={isSyncing ? 'animate-spin' : 'text-success'} />
            </Button>
            <Button variant="light" size="sm" onClick={logout} className="rounded-circle p-2 shadow-sm text-danger d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <LogOut size={20} />
            </Button>
        </div>
      </div>

      {isVpsConnection() && !isOffline && (
        <Alert variant="info" className="py-1 px-3 extra-small border-0 shadow-sm rounded-3 mb-2 d-flex align-items-center opacity-75">
          <Globe size={14} className="me-2" />
          <span>Conectado a la <b>Nube (VPS)</b>. Datos globales.</span>
        </Alert>
      )}

      {isOffline && (
        <Alert variant="warning" className="py-2 px-3 small border-0 shadow-sm rounded-3 mb-3 d-flex align-items-center">
          <div className="spinner-grow spinner-grow-sm text-warning me-2" role="status"></div>
          <span className="fw-bold">MODO OFFLINE ACTIVADO</span>
          <span className="ms-2 opacity-75">Consultando base de datos local...</span>
        </Alert>
      )}

      <div className="d-flex bg-white rounded-pill p-1 mb-3 shadow-sm">
        <Button 
          variant={activeTab === 'top' ? 'primary' : 'white'} 
          className={`flex-grow-1 rounded-pill border-0 py-1 extra-small ${activeTab === 'top' ? 'shadow-sm' : 'text-muted'}`}
          onClick={() => setActiveTab('top')}
        >
          <TrendingUp size={14} className="me-1" /> Más Vendidos
        </Button>
        <Button 
          variant={activeTab === 'low' ? 'primary' : 'white'} 
          className={`flex-grow-1 rounded-pill border-0 py-1 extra-small ${activeTab === 'low' ? 'shadow-sm' : 'text-muted'}`}
          onClick={() => setActiveTab('low')}
        >
          <Package size={14} className="me-1" /> Bajo Stock
        </Button>
        <Button 
          variant={activeTab === 'search' ? 'primary' : 'white'} 
          className={`flex-grow-1 rounded-pill border-0 py-1 extra-small ${activeTab === 'search' ? 'shadow-sm' : 'text-muted'}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={14} className="me-1" /> Buscar
        </Button>
      </div>

      {activeTab === 'search' && (
        <InputGroup className="mb-3 shadow-sm border-0">
          <InputGroup.Text className="bg-white border-0 pe-1">
            <Search size={18} className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Nombre o SKU..."
            className="border-0 py-2 shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <Button 
              variant="white" 
              className="border-0 pe-3 text-muted bg-white" 
              onClick={handleScan}
          >
              <Camera size={20} />
          </Button>
        </InputGroup>
      )}

      {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            Cargando...
          </div>
      ) : (
          <div className="flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {currentProducts.length > 0 ? (
              <div className="d-flex flex-column gap-2 pb-5">
                {currentProducts.map(product => (
                  <div 
                    key={`${activeTab}-${product.id}`} 
                    className="bg-white rounded-3 p-2 shadow-sm border-start border-4 border-primary d-flex align-items-center"
                    onClick={() => handleProductClick(product)}
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#f8f9fa', overflow: 'hidden', marginRight: '12px', flexShrink: 0 }}>
                       {product.local_image ? (
                         <img src={product.local_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : product.image_url ? (
                         <img src={`${getServerUrl()}${product.image_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-25">
                           <Package size={24} />
                         </div>
                       )}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 overflow-hidden">
                           <h6 className="mb-0 fw-bold text-dark text-truncate">{product.name}</h6>
                           {product.is_offer && <Badge bg="danger" className="extra-small py-0">OFERTA</Badge>}
                        </div>
                        <div className="text-end ms-2">
                           {product.is_offer && <div className="text-muted extra-small text-decoration-line-through" style={{ fontSize: '0.6rem' }}>${Number(product.price_sell).toFixed(2)}</div>}
                           <span className={`fw-bold small ${product.is_offer ? 'text-success' : 'text-primary'}`}>
                             ${Number(product.is_offer ? product.price_offer : product.price_sell).toFixed(2)}
                           </span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">

                        <small className="text-muted extra-small">{product.sku}</small>
                        <Badge bg={product.stock <= 0 ? 'danger' : (product.stock < 5 ? 'warning' : 'light')} className={`extra-small ${product.stock < 5 && product.stock > 0 ? 'text-dark' : (product.stock >= 5 ? 'text-dark border' : '')}`}>
                          {Number(product.stock).toFixed(2)} {product.sell_by_weight ? 'kg' : 'uds.'}
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
              </div>
            ) : (
              <div className="text-center mt-5 opacity-50">
                {activeTab === 'search' && searchTerm.length < 3 ? (
                  <p>Escribe al menos 3 letras para buscar</p>
                ) : (
                  <>
                    <Search size={48} className="mb-2" />
                    <p>No se encontraron productos</p>
                  </>
                )}
              </div>
            )}
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
        refreshProducts={fetchInitialData}
      />
    </Container>
  );
};

export default Stock;
