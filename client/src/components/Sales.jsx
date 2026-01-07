import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Table, ListGroup, Badge, Modal } from 'react-bootstrap';
import { MessageSquare, Search, Barcode, Trash2, Plus, Minus, ShoppingCart, Wifi, WifiOff, Printer } from 'lucide-react';
import { db, syncCatalog, syncCustomers, updateLocalProducts } from '../db/localDb';
import { syncOfflineSales } from '../db/syncManager';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import socket from '../socket';
import CustomerModal from './CustomerModal';
import { User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sales = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pending_sale');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scanInputRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSelectedIndex, setCustomerSelectedIndex] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const customerInputRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [currentWeightProduct, setCurrentWeightProduct] = useState(null);
  const [inputWeight, setInputWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('gr'); // 'gr' o 'kg'
  const weightInputRef = useRef(null);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'syncing', 'synced', 'error'
  const saveTimeoutRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cashDiscountPercent, setCashDiscountPercent] = useState(0);
  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem('auto_print');
    return saved === null ? true : saved === 'true';
  });
  
  // Función para calcular precio efectivo según tipo de promoción
  const calculateItemPrice = (item) => {
    const quantity = parseFloat(item.quantity);
    const priceList = parseFloat(item.price_sell);
    const priceOffer = parseFloat(item.price_offer) || priceList;
    
    let subtotal = 0;
    let effectivePrice = priceList;
    let savings = 0;
    let details = '';

    switch (item.promo_type) {
      case 'price':
        // Solo precio oferta
        subtotal = quantity * priceOffer;
        effectivePrice = priceOffer;
        savings = (priceList - priceOffer) * quantity;
        details = `Precio oferta: $${priceOffer}`;
        break;

      case 'quantity':
        // Solo promoción XxY sobre precio lista
        if (item.promo_buy && item.promo_pay) {
          const sets = Math.floor(quantity / item.promo_buy);
          const remaining = quantity % item.promo_buy;
          const paidItems = (sets * item.promo_pay) + remaining;
          subtotal = paidItems * priceList;
          effectivePrice = subtotal / quantity;
          savings = (quantity - paidItems) * priceList;
          details = `${item.promo_buy}×${item.promo_pay}: Pagas ${paidItems} de ${quantity}`;
        } else {
          subtotal = quantity * priceList;
        }
        break;

      case 'both':
        // Ambas: XxY sobre precio oferta
        if (item.promo_buy && item.promo_pay && priceOffer) {
          const sets = Math.floor(quantity / item.promo_buy);
          const remaining = quantity % item.promo_buy;
          const paidItems = (sets * item.promo_pay) + remaining;
          subtotal = paidItems * priceOffer;
          effectivePrice = subtotal / quantity;
          savings = (quantity * priceList) - subtotal;
          details = `${item.promo_buy}×${item.promo_pay} sobre $${priceOffer}`;
        } else if (priceOffer) {
          subtotal = quantity * priceOffer;
          effectivePrice = priceOffer;
          savings = (priceList - priceOffer) * quantity;
          details = `Precio oferta: $${priceOffer}`;
        } else {
          subtotal = quantity * priceList;
        }
        break;

      default:
        // Sin promoción
        subtotal = quantity * priceList;
    }

    return {
      subtotal: subtotal.toFixed(2),
      basePrice: (item.promo_type === 'price' || item.promo_type === 'both' ? priceOffer : priceList).toFixed(2),
      savings: savings.toFixed(2),
      details
    };
  };

  // Función para imprimir ticket directamente
  const printTicket = (saleData) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      toast.error('Por favor habilite ventanas emergentes para imprimir');
      return;
    }

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de Venta</title>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de Venta</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            margin: 0;
            padding: 8mm 5mm;
            width: 80mm;
            color: #000;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { text-align: left; border-bottom: 1.5px solid black; padding-bottom: 4px; font-size: 10px; letter-spacing: 0.5px; }
          td { vertical-align: top; padding: 6px 0; border-top: 0.5px dashed #ccc; }
          tr:first-child td { border-top: none; }
          .separator { border-bottom: 1.5px solid black; margin: 8px 0; }
          .total-box { 
            margin-top: 10px; 
            padding: 8px 0; 
            border-top: 2px solid black; 
            border-bottom: 2px solid black;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .summary-item { display: flex; justify-content: space-between; margin-bottom: 4px; }
          @media print {
            body { margin: 0; padding: 8mm 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">SGMAB CONTROL</h1>
          <p style="margin: 2px 0; font-size: 12px; opacity: 0.8;">Comercio & Gestión</p>
          <div class="separator"></div>
        </div>
        
        <div style="margin-bottom: 12px; font-size: 10px;">
          <p style="margin: 2px 0;"><b>Fecha:</b> ${new Date(saleData.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 2px 0;"><b>Vendedor:</b> ${saleData.seller_name}</p>
          <p style="margin: 2px 0;"><b>Cliente:</b> ${saleData.customer_name || 'Cons. Final'}</p>
        </div>
        
        <div class="separator"></div>
        
        <table>
          <thead>
            <tr class="uppercase">
              <th style="width: 40px;">Cant</th>
              <th>Descripción</th>
              <th class="right">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items.map(item => {
              const totalItemLista = (item.price_sell_at_sale || item.price_sell || 0) * item.quantity;
              const unitPrice = totalItemLista / item.quantity;
              const isWeight = item.sell_by_weight;

              return `
              <tr>
                <td>${isWeight ? item.quantity : Math.floor(item.quantity)}</td>
                <td style="padding-right: 5px;">
                  <div class="bold">${item.product_name}</div>
                  <div style="font-size: 9.5px; margin-top: 2px; color: #444;">
                    <b>@ $${unitPrice.toFixed(2)}</b> ${isWeight ? '/Kg' : 'x unid.'}
                  </div>
                  ${item.promo_details ? `<div style="font-size: 8.5px; color: #198754; font-weight: bold; margin-top: 1px;">${item.promo_details}</div>` : ''}
                </td>
                <td class="right">
                  ${item.discount_amount > 0 ? `<div style="font-size: 9px; color: #999; text-decoration: line-through;">$${totalItemLista.toFixed(2)}</div>` : ''}
                  <div class="bold">$${item.subtotal}</div>
                  ${item.discount_amount > 0 ? `<div style="font-size: 8.5px; color: #198754; font-weight: 600;">(-$${item.discount_amount.toFixed(2)})</div>` : ''}
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
        
        <div style="border-top: 1.5px solid black; padding-top: 8px;">
          <div class="summary-item" style="opacity: 0.7;">
            <span>Suma de productos:</span>
            <span>$${saleData.items.reduce((acc, item) => acc + ((item.price_sell_at_sale || item.price_sell || 0) * item.quantity), 0).toFixed(2)}</span>
          </div>

          ${saleData.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0) > 0 ? `
            <div class="summary-item" style="color: #d00; font-weight: 500;">
              <span>Ahorros aplicados:</span>
              <span>-$${saleData.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0).toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="summary-item" style="font-weight: 600; border-top: 0.5px solid #eee; padding-top: 4px;">
            <span>SUBTOTAL:</span>
            <span>$${saleData.subtotal.toFixed(2)}</span>
          </div>

          ${saleData.cash_discount > 0 ? `
            <div class="summary-item" style="color: #198754;">
              <span>Desc. Efectivo:</span>
              <span>-$${saleData.cash_discount.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="total-box">
            <span style="font-size: 13px; font-weight: 900;">TOTAL A PAGAR:</span>
            <span style="font-size: 18px; font-weight: 900;">$${saleData.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="center" style="margin-top: 12px; padding: 6px; background: #f8f9fa; border: 1px solid #eee; border-radius: 4px;">
          <span style="font-size: 10px; font-weight: 700; uppercase">Bultos: ${saleData.items.reduce((sum, item) => sum + (item.sell_by_weight ? 1 : parseFloat(item.quantity)), 0)}</span>
        </div>

        <div class="right" style="font-size: 10px; margin-top: 10px;">
          <i>Medio de Pago: <b>${saleData.payment_method || 'Efectivo'}</b></i>
        </div>
        
        <div class="center" style="margin-top: 25px;">
          <p style="margin: 2px 0; font-size: 11px; font-weight: 600;">¡Gracias por confiar en nosotros!</p>
          <p style="margin: 4px 0; font-size: 8px; opacity: 0.5;">COMPROBANTE NO VÁLIDO COMO FACTURA</p>
          <p style="margin: 2px 0; font-size: 8px; opacity: 0.5;">ID: ${saleData.id.toUpperCase()}</p>
        </div>

        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  // Refs para evitar clausuras obsoletas en el listener global de F10
  const cartRef = useRef(cart);
  const selectedCustomerRef = useRef(selectedCustomer);
  const paymentMethodRef = useRef(paymentMethod);
  const customersRef = useRef(customers);

  useEffect(() => {
    cartRef.current = cart;
    selectedCustomerRef.current = selectedCustomer;
    paymentMethodRef.current = paymentMethod;
    customersRef.current = customers;
  }, [cart, selectedCustomer, paymentMethod, customers]);

  useEffect(() => {
    const handleStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncOfflineSales();
      }
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // 1. Cargar datos locales inmediatamente para apertura instantánea
    db.customers.toArray().then(localCusts => {
      if (localCusts.length > 0) {
        setCustomers(localCusts);
        // Seleccionar Consumidor Final si es necesario
        if (!selectedCustomerRef.current) {
          const defaultCustomer = localCusts.find(c => c.name.toLowerCase().includes('cons. final'));
          if (defaultCustomer) setSelectedCustomer(defaultCustomer);
        }
      }
    });

    // 2. Sincronización en segundo plano con el servidor
    if (navigator.onLine) {
      syncOfflineSales();
      
      // Catálogo
      axios.get('/api/products')
        .then(res => syncCatalog(res.data))
        .catch(err => console.error('Error al sincronizar catálogo', err));
      
      // Clientes
      const token = localStorage.getItem('token');
      axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setCustomers(res.data);
          syncCustomers(res.data);
          
          if (!selectedCustomerRef.current) {
            const defaultCustomer = res.data.find(c => c.name.toLowerCase().includes('cons. final'));
            if (defaultCustomer) setSelectedCustomer(defaultCustomer);
          }
        })
        .catch(err => console.error('Error al sincronizar clientes', err));
    }

    // Escuchar actualizaciones en tiempo real
    socket.on('catalog_updated', (data) => {
      console.log('Recibida notificación de catálogo actualizado', data ? '(incremental)' : '(total)');
      if (data && Array.isArray(data)) {
        updateLocalProducts(data);
      } else {
        axios.get('/api/products')
          .then(res => syncCatalog(res.data))
          .catch(err => console.error('Error al re-sincronizar catálogo', err));
      }
    });

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      socket.off('catalog_updated');
    };
  }, []);

  // Cargar configuración de descuento por efectivo
  useEffect(() => {
    axios.get('/api/settings')
      .then(res => {
        setCashDiscountPercent(parseFloat(res.data.cash_discount_percent || 0));
      })
      .catch(err => console.error('Error al cargar configuración:', err));
  }, []);

  // Cargar venta en progreso al montar el componente
  const pendingSaleLoadedRef = useRef(false);
  
  useEffect(() => {
    if (pendingSaleLoadedRef.current) return; // Ya se cargó
    
    const loadPendingSale = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/sales/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.cart && response.data.cart.length > 0) {
          setCart(response.data.cart);
          
          // Cargar cliente si existe
          if (response.data.customer_id) {
            const customer = customers.find(c => c.id === response.data.customer_id);
            if (customer) {
              setSelectedCustomer(customer);
            }
          }
          
          // Cargar método de pago
          if (response.data.payment_method) {
            setPaymentMethod(response.data.payment_method);
          }
          
          toast.success('Venta en progreso cargada', { duration: 3000, icon: '📋' });
          pendingSaleLoadedRef.current = true; // Marcar como cargado
        }
      } catch (error) {
        console.error('Error al cargar venta en progreso:', error);
        // Fallback a localStorage si falla el servidor
        const saved = localStorage.getItem('pending_sale');
        if (saved) {
          setCart(JSON.parse(saved));
        }
      }
    };
    
    loadPendingSale();
  }, [customers]);

  // Guardar venta en progreso (localStorage inmediato + servidor con debounce)
  useEffect(() => {
    // Guardar en localStorage inmediatamente
    localStorage.setItem('pending_sale', JSON.stringify(cart));
    
    // Guardar en servidor con debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (cart.length > 0) {
      setSyncStatus('syncing');
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post('/api/sales/pending', {
            cart,
            customer_id: selectedCustomer?.id || null,
            payment_method: paymentMethod
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setSyncStatus('synced');
        } catch (error) {
          console.error('Error al guardar venta en progreso:', error);
          setSyncStatus('error');
          // Mantener en localStorage como fallback
        }
      }, 2000); // Debounce de 2 segundos
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cart, selectedCustomer, paymentMethod]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length > 1) {
      setIsSearching(true);
      try {
        const results = await db.products
          .filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.sku.includes(term))
          .limit(5)
          .toArray();
        setSearchResults(results);
        setSelectedIndex(results.length > 0 ? 0 : -1);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
      setIsSearching(false);
    }
  };

  const addToCart = (product) => {
    if (product.sell_by_weight) {
      setCurrentWeightProduct(product);
      setInputWeight('');
      setWeightUnit('gr'); // Resetear a gramos por defecto
      setShowWeightModal(true);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedIndex(-1);
      // El foco se hará en el modal mediante useEffect o onEntered
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Activar efecto de highlight
    setLastAddedProductId(product.id);
    setTimeout(() => setLastAddedProductId(null), 2000);
    
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    scanInputRef.current?.focus();
  };

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    let weight = parseFloat(inputWeight);
    
    if (isNaN(weight) || weight <= 0) {
      toast.error('Ingrese un peso válido');
      return;
    }

    // Convertir gramos a kilogramos si es necesario
    if (weightUnit === 'gr') {
      weight = weight / 1000; // Convertir gramos a kg
    }

    const product = currentWeightProduct;
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + weight } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: weight }]);
    }

    // Activar efecto de highlight
    setLastAddedProductId(product.id);
    setTimeout(() => setLastAddedProductId(null), 2000);

    setShowWeightModal(false);
    setCurrentWeightProduct(null);
    setInputWeight('');
    setWeightUnit('gr'); // Resetear a gramos
    scanInputRef.current?.focus();
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si hay resultados visibles y uno seleccionado, agregar ese
      if (searchResults.length > 0 && selectedIndex >= 0) {
        addToCart(searchResults[selectedIndex]);
        return;
      }
      
      // Si no hay resultados visibles pero hay un término de búsqueda,
      // buscar por SKU exacto (para lectores de código de barras)
      if (searchTerm.trim()) {
        const exactMatch = await db.products
          .where('sku')
          .equals(searchTerm.trim())
          .first();
        
        if (exactMatch) {
          addToCart(exactMatch);
          toast.success(`Producto agregado: ${exactMatch.name}`, { duration: 2000 });
        } else {
          // Si no hay coincidencia exacta, buscar por nombre o SKU parcial
          const results = await db.products
            .filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.sku.includes(searchTerm)
            )
            .limit(1)
            .toArray();
          
          if (results.length > 0) {
            addToCart(results[0]);
            toast.success(`Producto agregado: ${results[0].name}`, { duration: 2000 });
          } else {
            toast.error('Producto no encontrado', { duration: 2000 });
          }
        }
      }
    } else if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = (cartItems) => {
    return cartItems.reduce((sum, item) => {
      const calc = calculateItemPrice(item);
      return sum + parseFloat(calc.subtotal);
    }, 0);
  };

  const listTotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.price_sell) * parseFloat(item.quantity));
  }, 0);

  const total = calculateTotal(cart);

  const totalSavings = cart.reduce((sum, item) => {
    const calc = calculateItemPrice(item);
    return sum + parseFloat(calc.savings);
  }, 0);

  const totalItemsCount = cart.reduce((sum, item) => {
    const isWeight = item.sell_by_weight === true || item.sell_by_weight == 1;
    return sum + (isWeight ? 1 : parseFloat(item.quantity));
  }, 0);

  const handleCustomerSearch = async (term) => {
    setCustomerSearch(term);
    if (term.length > 0) {
      const results = await db.customers
        .filter(c => c.name.toLowerCase().includes(term.toLowerCase()))
        .limit(5)
        .toArray();
      setCustomerResults(results);
      setCustomerSelectedIndex(results.length > 0 ? 0 : -1);
    } else {
      setCustomerResults([]);
      setCustomerSelectedIndex(-1);
    }
  };

  const handleCustomerKeyDown = (e) => {
    if (customerResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCustomerSelectedIndex(prev => (prev < customerResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomerSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && customerSelectedIndex >= 0) {
        e.preventDefault();
        selectCustomer(customerResults[customerSelectedIndex]);
      }
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleCheckout = async () => {
    // Usar valores de los refs para asegurar que el listener de F10 (que es una clausura) tenga los datos actuales
    const currentCart = cartRef.current;
    const currentCustomer = selectedCustomerRef.current;
    const currentPaymentMethod = paymentMethodRef.current;
    const currentTotal = currentCart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);

    if (currentCart.length === 0) return;

    if (currentPaymentMethod === 'Cta Cte' && !currentCustomer) {
      toast.error('Debe seleccionar un cliente para Cuenta Corriente');
      customerInputRef.current?.focus();
      return;
    }

    // Si no hay cliente y no es Cta Cte, avisar una vez si el foco no está en el buscador de clientes
    if (!currentCustomer && document.activeElement !== customerInputRef.current) {
      customerInputRef.current?.focus();
      toast('¿Desea agregar un cliente? Presione F10 de nuevo para vender como Anónimo', { icon: '👤', duration: 4000 });
      return;
    }

    const saleData = {
      id: uuidv4(),
      items: currentCart.map(item => {
        const calc = calculateItemPrice(item);
        return {
          product_id: item.id,
          quantity: item.quantity,
          price_unit: parseFloat(calc.effectivePrice),
          subtotal: parseFloat(calc.subtotal),
          discount_amount: parseFloat(calc.savings) / item.quantity // Descuento unitario
        };
      }),
      total: calculateTotal(currentCart) - (currentPaymentMethod === 'Efectivo' ? calculateTotal(currentCart) * (cashDiscountPercent / 100) : 0),
      subtotal: calculateTotal(currentCart),
      cash_discount: currentPaymentMethod === 'Efectivo' ? calculateTotal(currentCart) * (cashDiscountPercent / 100) : 0,
      customer_id: currentCustomer?.id || null,
      payment_method: currentPaymentMethod,
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline) {
        const token = localStorage.getItem('token');
        await axios.post('/api/sales', saleData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      await db.offlineSales.add({ ...saleData, status: isOnline ? 'synced' : 'pending' });
      
      // Actualización optimista del stock en IndexedDB local
      try {
        const optimisticUpdates = currentCart.map(item => ({
          ...item,
          stock: Math.max(0, (parseFloat(item.stock) || 0) - parseFloat(item.quantity))
        }));
        await updateLocalProducts(optimisticUpdates);
      } catch (optError) {
        console.error('Error en actualización optimista:', optError);
      }
      
      setCart([]);
      
      // Limpiar venta en progreso del servidor
      try {
        const token = localStorage.getItem('token');
        await axios.delete('/api/sales/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error al limpiar venta en progreso:', error);
      }
      
      // Intentar resetear al cliente Cons. Final por defecto usando el ref más actualizado
      const defaultCustomer = customersRef.current.find(c => c.name.toLowerCase().includes('cons. final'));
      setSelectedCustomer(defaultCustomer || null);
      
      setPaymentMethod('Efectivo');
      localStorage.removeItem('pending_sale');
      
      // Hacer foco de nuevo en el buscador de productos para la siguiente venta
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }

      toast.success('Venta realizada con éxito' + (isOnline ? '' : ' (Modo Offline)'), {
        duration: 4000,
        icon: '💰',
      });

      // Imprimir ticket automáticamente
      const ticketData = {
        ...saleData,
        seller_name: user?.username || 'Vendedor',
        customer_name: currentCustomer?.name || 'Anónimo',
        items: currentCart.map(item => {
          const calc = calculateItemPrice(item);
          return {
            ...item,
            product_name: item.name,
            quantity: item.quantity,
            price_unit: parseFloat(calc.effectivePrice),
            subtotal: parseFloat(calc.subtotal),
            discount_amount: parseFloat(calc.savings),
            promo_details: calc.details
          };
        })
      };

      // Imprimir ticket automáticamente
      if (autoPrint) {
        axios.post('/api/print', { sale: ticketData })
          .then(() => console.log('Ticket enviado a impresión directa'))
          .catch(err => {
            console.error('Error en impresión directa:', err);
            toast.error('Error al enviar a la impresora');
          });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la venta');
    }
  };

  const handleSendNote = async () => {
    if (!noteMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/notifications', { message: noteMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Nota enviada al administrador');
      setNoteMessage('');
      setShowNoteModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la nota');
    }
  };

  return (
    <div className="pos-container py-2">
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <InputGroup size="lg" className="mb-3">
                <InputGroup.Text className="bg-white border-end-0">
                  <Barcode size={24} className="text-primary" />
                </InputGroup.Text>
                <Form.Control
                  ref={scanInputRef}
                  placeholder="Escanee código o busque producto..."
                  className="border-start-0"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>

              {/* Indicador de búsqueda */}
              {isSearching && (
                <div className="position-absolute w-100 bg-white border rounded shadow-sm p-3 text-center" style={{ zIndex: 1000, marginTop: '-15px' }}>
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Buscando...</span>
                    </div>
                    <span className="text-muted">Buscando productos...</span>
                  </div>
                </div>
              )}

              {/* Resultados de búsqueda */}
              {!isSearching && searchResults.length > 0 && (
                <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1000, marginTop: '-15px' }}>
                  {searchResults.map((p, idx) => (
                    <ListGroup.Item 
                      key={p.id} 
                      action 
                      onClick={() => addToCart(p)}
                      className={`d-flex align-items-center justify-content-between p-3 ${selectedIndex === idx ? 'bg-primary text-white shadow' : ''}`}
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          {p.image_url ? <img src={`${p.image_url}`} style={{ width: '100%' }} /> : <Search size={20} />}
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="text-muted x-small">SKU: {p.sku}</div>
                          {p.promo_type && p.promo_type !== 'none' && (
                            <div className="mt-1">
                              {p.promo_type === 'price' && (
                                <Badge bg="success" className="x-small">💰 Oferta</Badge>
                              )}
                              {p.promo_type === 'quantity' && p.promo_buy && p.promo_pay && (
                                <Badge bg="danger" className="x-small">🔥 {p.promo_buy}×{p.promo_pay}</Badge>
                              )}
                              {p.promo_type === 'both' && (
                                <>
                                  <Badge bg="success" className="x-small me-1">💰 ${p.price_offer}</Badge>
                                  <Badge bg="danger" className="x-small">🔥 {p.promo_buy}×{p.promo_pay}</Badge>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-end">
                        {p.promo_type === 'price' && p.price_offer && (
                          <div className="text-decoration-line-through text-muted small">${p.price_sell}</div>
                        )}
                        <div className={`fw-bold ${p.promo_type === 'price' ? 'text-success' : 'text-primary'}`}>
                          ${p.promo_type === 'price' ? p.price_offer : p.price_sell}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {/* Sin resultados */}
              {!isSearching && searchTerm.length > 1 && searchResults.length === 0 && (
                <div className="position-absolute w-100 bg-white border rounded shadow-sm p-3 text-center text-muted" style={{ zIndex: 1000, marginTop: '-15px' }}>
                  🔍 No se encontraron productos
                </div>
              )}

              <div className="table-responsive mt-4" style={{ minHeight: '400px' }}>
                <Table hover align="middle">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Cod.</th>
                      <th>Producto</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr 
                        key={item.id}
                        className={lastAddedProductId === item.id ? 'table-success' : ''}
                        style={{
                          transition: 'background-color 0.3s ease',
                          backgroundColor: lastAddedProductId === item.id ? '#d1e7dd' : 'transparent'
                        }}
                      >
                        <td className="text-muted small">
                          {item.sku || '---'}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="bg-light rounded flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden" 
                              style={{ width: '32px', height: '32px', border: '1px solid #eee' }}
                            >
                              {item.image_url ? (
                                <img 
                                  src={`${item.image_url}`} 
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              ) : (
                                <Search size={14} className="opacity-25" />
                              )}
                            </div>
                            <div>
                              <div className="fw-bold">{item.name}</div>
                              <div className="d-flex gap-1">
                                {item.promo_type === 'price' && (
                                  <Badge bg="success" className="x-small">💰 Oferta</Badge>
                                )}
                                {item.promo_type === 'quantity' && item.promo_buy && item.promo_pay && (
                                  <Badge bg="danger" className="x-small">🔥 {item.promo_buy}×{item.promo_pay}</Badge>
                                )}
                                {item.promo_type === 'both' && (
                                  <>
                                    <Badge bg="success" className="x-small me-1">💰 ${item.price_offer}</Badge>
                                    <Badge bg="danger" className="x-small">🔥 {item.promo_buy}×{item.promo_pay}</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {!item.sell_by_weight && (
                              <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></Button>
                            )}
                            <span className="fw-bold" style={{ width: item.sell_by_weight ? 'auto' : '30px' }}>
                              {item.sell_by_weight ? `${parseFloat(item.quantity).toFixed(3)} Kg` : item.quantity}
                            </span>
                            {!item.sell_by_weight && (
                              <Button variant="light" size="sm" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></Button>
                            )}
                            {item.sell_by_weight && (
                                <Button variant="light" size="sm" onClick={() => {
                                    setCurrentWeightProduct(item);
                                    setInputWeight('');
                                    setShowWeightModal(true);
                                }}><Plus size={14} /></Button>
                            )}
                          </div>
                        </td>
                        <td className="text-end">
                          {(() => {
                            const calc = calculateItemPrice(item);
                            const originalUnit = parseFloat(item.price_sell) * (item.sell_by_weight ? parseFloat(item.quantity) : 1);
                            const baseUnit = parseFloat(calc.basePrice) * (item.sell_by_weight ? parseFloat(item.quantity) : 1);
                            
                            return (
                              <>
                                {baseUnit < originalUnit && (
                                  <div className="text-muted x-small text-decoration-line-through">
                                    ${originalUnit.toFixed(2)}
                                  </div>
                                )}
                                <div className="fw-bold">${baseUnit.toFixed(2)}</div>
                                {item.sell_by_weight && (
                                  <div className="x-small text-muted">@ ${parseFloat(item.price_sell).toFixed(2)}/kg</div>
                                )}
                                {calc.details && (
                                  <div className="text-success x-small" style={{ fontSize: '0.75rem' }}>
                                    {calc.details}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>
                        <td className="text-end">
                          {(() => {
                            const calc = calculateItemPrice(item);
                            const originalPrice = parseFloat(item.price_sell); // Precio de lista original
                            const quantity = parseFloat(item.quantity);
                            const rawTotalOriginal = originalPrice * quantity;
                            const finalSubtotal = parseFloat(calc.subtotal);
                            const savings = parseFloat(calc.savings);

                            return (
                              <>
                                {savings > 0 && (
                                  <div className="text-muted x-small text-decoration-line-through">
                                    ${rawTotalOriginal.toFixed(2)}
                                  </div>
                                )}
                                <div className="fw-bold">${finalSubtotal.toFixed(2)}</div>
                                {savings > 0 && (
                                  <div className="text-danger x-small fw-bold">
                                    Ahorro: ${savings.toFixed(2)}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>
                        <td className="text-end">
                          <Button variant="link" className="text-danger p-0" onClick={() => removeFromCart(item.id)}>
                            <Trash2 size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <ShoppingCart size={48} className="mb-3 opacity-25" />
                          <p>Escanee productos para comenzar la venta</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-dark text-white p-4 sticky-top" style={{ top: '2rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Resumen</h4>
              <div className="d-flex gap-2">
                {isOnline ? (
                  <Badge bg="success"><Wifi size={14} className="me-1" /> Online</Badge>
                ) : (
                  <Badge bg="danger"><WifiOff size={14} className="me-1" /> Offline</Badge>
                )}
                {cart.length > 0 && (
                  <Badge bg={syncStatus === 'synced' ? 'success' : syncStatus === 'syncing' ? 'warning' : 'danger'}>
                    {syncStatus === 'syncing' && '⏳ Guardando...'}
                    {syncStatus === 'synced' && '✓ Guardado'}
                    {syncStatus === 'error' && '⚠️ Error'}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Eliminado el contador de items superior para evitar repetición */}
            
            <div className="d-flex justify-content-between mb-2 opacity-75">
              <span>Total Lista (sin promos):</span>
              <span>${listTotal.toFixed(2)}</span>
            </div>
            
            {totalSavings > 0 && (
              <div className="d-flex justify-content-between mb-2 text-danger fw-bold">
                <span>Ahorro en Promos:</span>
                <span>-${totalSavings.toFixed(2)}</span>
              </div>
            )}
            
            <div className="d-flex justify-content-between mb-2 border-top pt-2">
              <span className="fw-bold">Subtotal:</span>
              <span className="fw-bold">${total.toFixed(2)}</span>
            </div>
            
            {paymentMethod === 'Efectivo' && cashDiscountPercent > 0 && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Desc. Efectivo ({cashDiscountPercent}%):</span>
                <span>-${(total * (cashDiscountPercent / 100)).toFixed(2)}</span>
              </div>
            )}
            
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold h4 mb-0">TOTAL:</span>
              <span className="fw-bold display-6 text-info">
                ${(total - (paymentMethod === 'Efectivo' ? total * (cashDiscountPercent / 100) : 0)).toFixed(2)}
              </span>
            </div>
            
            <div className="text-center bg-primary bg-opacity-10 rounded py-2 border border-primary border-opacity-25 mb-4">
               <span className="text-primary small fw-bold">CANTIDAD DE PRODUCTOS: </span>
               <span className="h4 mb-0 text-primary fw-bold">{totalItemsCount}</span>
            </div>

            {/* Selector de Cliente */}
            <div className="mb-4">
              <Form.Label className="small opacity-75">Cliente</Form.Label>
              {selectedCustomer ? (
                <div className="d-flex align-items-center justify-content-between bg-dark bg-opacity-50 p-2 rounded border border-secondary">
                  <div className="d-flex align-items-center">
                    <User size={18} className="me-2 text-info" />
                    <span>{selectedCustomer.name}</span>
                  </div>
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={() => setSelectedCustomer(null)}>Cambiar</Button>
                </div>
              ) : (
                <div className="position-relative">
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-dark border-secondary text-white">
                      <User size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      ref={customerInputRef}
                      placeholder="Buscar cliente..."
                      className="bg-dark border-secondary text-white"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onKeyDown={handleCustomerKeyDown}
                    />
                    <Button variant="outline-info" onClick={() => setShowCustomerModal(true)}>
                      <UserPlus size={16} />
                    </Button>
                  </InputGroup>
                  {customerResults.length > 0 && (
                    <ListGroup className="position-absolute w-100 shadow-lg mt-1 border-secondary" style={{ zIndex: 1050, opacity: 1 }}>
                      {customerResults.map((c, idx) => (
                        <ListGroup.Item 
                          key={c.id} 
                          action 
                          size="sm"
                          className={`text-white border-secondary py-2 ${customerSelectedIndex === idx ? 'bg-primary' : 'bg-dark'}`}
                          style={{ backgroundColor: customerSelectedIndex === idx ? '#0d6efd' : '#212529' }}
                          onClick={() => selectCustomer(c)}
                        >
                          {c.name}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {customerSearch.length > 0 && customerResults.length === 0 && !showCustomerModal && (
                    <div className="x-small text-muted mt-1 text-center">Sin resultados.</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Eliminado el segundo TOTAL redundante */}

            <div className="mb-4">
              <Form.Label className="small opacity-75">Forma de Pago</Form.Label>
              <Form.Select 
                className="bg-dark border-secondary text-white border-2"
                value={paymentMethod}
                onChange={(e) => {
                  const newMethod = e.target.value;
                  if (newMethod === 'Cta Cte' && selectedCustomer?.name?.toLowerCase().includes('cons. final')) {
                    toast.error('No se permite Cuenta Corriente para Consumidor Final');
                    return;
                  }
                  setPaymentMethod(newMethod);
                }}
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="MP">📱 Mercado Pago</option>
                <option value="Cta Cte">💳 Cta. Cte.</option>
              </Form.Select>
            </div>
            
            <div className="mb-4 d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-25">
               <div className="d-flex align-items-center gap-2">
                 <Printer size={18} className={autoPrint ? "text-success" : "text-muted"} />
                 <span className="small">Imprimir ticket auto.</span>
               </div>
               <Form.Check 
                 type="switch"
                 id="auto-print-switch"
                 checked={autoPrint}
                 onChange={(e) => {
                   setAutoPrint(e.target.checked);
                   localStorage.setItem('auto_print', e.target.checked);
                 }}
               />
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-100 py-3 fw-bold shadow"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              FINALIZAR VENTA (F10)
            </Button>

            <Button 
              variant="outline-warning" 
              className="w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
              onClick={() => setShowNoteModal(true)}
            >
              <MessageSquare size={18} /> Dejar Nota / Aviso
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title>Enviar Nota al Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form.Group>
            <Form.Label>Mensaje / Faltante / Aviso</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              className="bg-dark border-secondary text-white"
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              placeholder="Ej: Faltan rollos de ticket, El producto X no tiene stock..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
          <Button variant="warning" onClick={handleSendNote}>Enviar Aviso</Button>
        </Modal.Footer>
      </Modal>

      <CustomerModal 
        show={showCustomerModal} 
        handleClose={() => setShowCustomerModal(false)}
        onCustomerCreated={(c) => {
          selectCustomer(c);
          setCustomers([...customers, c]);
          syncCustomers([...customers, c]);
        }}
      />

      <Modal 
        show={showWeightModal} 
        onHide={() => setShowWeightModal(false)} 
        centered
        onEntered={() => weightInputRef.current?.focus()}
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Ingresar Peso</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleWeightSubmit}>
          <Modal.Body>
            <div className="text-center mb-4">
               <h4 className="text-dark">{currentWeightProduct?.name}</h4>
               <div className="text-muted">Precio por Kg: ${currentWeightProduct?.price_sell}</div>
            </div>
            
            {/* Selector de Unidad */}
            <div className="mb-3">
              <div className="btn-group w-100" role="group">
                <Button
                  variant={weightUnit === 'gr' ? 'primary' : 'outline-primary'}
                  onClick={() => setWeightUnit('gr')}
                  className="fw-bold"
                >
                  Gramos (gr)
                </Button>
                <Button
                  variant={weightUnit === 'kg' ? 'primary' : 'outline-primary'}
                  onClick={() => setWeightUnit('kg')}
                  className="fw-bold"
                >
                  Kilogramos (Kg)
                </Button>
              </div>
            </div>
            
            <Form.Group>
              <Form.Label className="fw-bold">
                Peso ({weightUnit === 'gr' ? 'Gramos' : 'Kilogramos'})
              </Form.Label>
              <InputGroup size="lg">
                <Form.Control 
                  ref={weightInputRef}
                  type="number" 
                  step={weightUnit === 'gr' ? '1' : '0.001'}
                  placeholder={weightUnit === 'gr' ? '0' : '0.000'}
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  required
                />
                <InputGroup.Text>{weightUnit === 'gr' ? 'gr' : 'Kg'}</InputGroup.Text>
              </InputGroup>
              {inputWeight && !isNaN(parseFloat(inputWeight)) && (
                <div className="mt-3">
                  <div className="text-center text-muted small">
                    {weightUnit === 'gr' && `${parseFloat(inputWeight)} gr = ${(parseFloat(inputWeight) / 1000).toFixed(3)} Kg`}
                  </div>
                  <div className="text-center h3 text-primary mt-2">
                    Total: ${(
                      (weightUnit === 'gr' ? parseFloat(inputWeight) / 1000 : parseFloat(inputWeight)) * 
                      parseFloat(currentWeightProduct?.price_sell || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWeightModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Agregar al Carrito</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Sales;
