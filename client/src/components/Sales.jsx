import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Form, InputGroup, Button, Table, ListGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { MessageSquare, Search, Barcode, Trash2, Plus, Minus, ShoppingCart, Wifi, WifiOff, Printer, TrendingUp, TrendingDown, Edit, Package, Lock, Unlock } from 'lucide-react';
import { db, syncCatalog, syncCustomers, updateLocalProducts } from '../db/localDb';
import { syncOfflineSales } from '../db/syncManager';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import socket from '../socket';
import CustomerModal from './CustomerModal';
import { User, UserPlus, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SalesTabs from './SalesTabs';
import Ticket from './Ticket';
import { shareTicketViaWhatsApp } from '../utils/ticketUtils';

const Sales = () => {
  const latestSearchTerm = useRef('');
  const searchTimeoutRef = useRef(null);
  const searchResultsRef = useRef(null);
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
  const [weightEditMode, setWeightEditMode] = useState('add'); // 'add' o 'set'
  const [weightUnit, setWeightUnit] = useState('kg'); // 'gr' o 'kg'
  const weightInputRef = useRef(null);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'syncing', 'synced', 'error'
  const saveTimeoutRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cashDiscountPercent, setCashDiscountPercent] = useState(0);
  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem('auto_print');
    return saved === null ? false : saved === 'true';
  });
  const [printMethod, setPrintMethod] = useState(() => {
    return localStorage.getItem('print_method') || 'server';
  });
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentSplits, setPaymentSplits] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentWizard, setShowPaymentWizard] = useState(false);
  const [wizardAmount, setWizardAmount] = useState('');
  const [wizardStep, setWizardStep] = useState('amount'); // 'amount', 'method'
  const wizardInputRef = useRef(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [selectedCustomerContainers, setSelectedCustomerContainers] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [wizardCustomerSearch, setWizardCustomerSearch] = useState('');
  const [wizardCustomerResults, setWizardCustomerResults] = useState([]);
  const [wizardCustomerSelectedIndex, setWizardCustomerSelectedIndex] = useState(-1);
  const wizardCustomerInputRef = useRef(null);
  const [wizardLockEnter, setWizardLockEnter] = useState(false);
  const wizardLockEnterRef = useRef(false);
  const [autoWhatsApp, setAutoWhatsApp] = useState(() => {
    const saved = localStorage.getItem('auto_whatsapp');
    return saved === null ? false : saved === 'true';
  });
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [pendingWhatsAppSale, setPendingWhatsAppSale] = useState(null);
  const paymentInputRef = useRef(null);
  const customersRef = useRef([]);
  const selectedCustomerRef = useRef(null);
  const cartRef = useRef([]);
  const paymentMethodRef = useRef('Efectivo');
  const amountPaidRef = useRef('0');
  const [searchMode, setSearchMode] = useState(() => {
    return localStorage.getItem('search_mode') || 'local';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const ticketRef = useRef(null);
  const paymentSplitsRef = useRef([]);
  const cashDiscountPercentRef = useRef(0);
  const showPaymentWizardRef = useRef(false);
  const wizardStepRef = useRef('amount');
  const wizardAmountRef = useRef('');
  const wizardCustomerResultsRef = useRef([]);
  const wizardCustomerSelectedIndexRef = useRef(-1);
  const customerBalanceRef = useRef(null);

  // Estado para ventas múltiples
  const [salesTabs, setSalesTabs] = useState([{
    id: 1,
    cart: [],
    customer: null,
    paymentMethod: 'Efectivo',
    amountPaid: '0',
    paymentSplits: []
  }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [currentRegister, setCurrentRegister] = useState(null);
  const [checkingRegister, setCheckingRegister] = useState(true);
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingRegisterLoading, setOpeningRegisterLoading] = useState(false);
  
  // Obtener la venta activa actual
  const activeTab = salesTabs.find(tab => tab.id === activeTabId) || salesTabs[0];

  // Mantener refs sincronizados
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    paymentMethodRef.current = paymentMethod;
  }, [paymentMethod]);

  useEffect(() => {
    amountPaidRef.current = amountPaid;
  }, [amountPaid]);

  useEffect(() => {
    paymentSplitsRef.current = paymentSplits;
  }, [paymentSplits]);

  useEffect(() => {
    cashDiscountPercentRef.current = cashDiscountPercent;
  }, [cashDiscountPercent]);

  useEffect(() => {
    showPaymentWizardRef.current = showPaymentWizard;
  }, [showPaymentWizard]);

  useEffect(() => {
    wizardStepRef.current = wizardStep;
  }, [wizardStep]);

  useEffect(() => {
    wizardAmountRef.current = wizardAmount;
  }, [wizardAmount]);
  
  useEffect(() => {
    wizardCustomerResultsRef.current = wizardCustomerResults;
  }, [wizardCustomerResults]);

  useEffect(() => {
    wizardCustomerSelectedIndexRef.current = wizardCustomerSelectedIndex;
  }, [wizardCustomerSelectedIndex]);

  useEffect(() => {
    customerBalanceRef.current = customerBalance;
  }, [customerBalance]);

  useEffect(() => {
    wizardLockEnterRef.current = wizardLockEnter;
  }, [wizardLockEnter]);

  // Sincronizar cart con el tab activo
  useEffect(() => {
    if (activeTab) {
      setCart(activeTab.cart || []);
      setSelectedCustomer(activeTab.customer);
      setPaymentMethod(activeTab.paymentMethod || 'Efectivo');
      setAmountPaid(activeTab.amountPaid || '0');
      setPaymentSplits(activeTab.paymentSplits || []);
    }
  }, [activeTabId]);

  // Actualizar el tab activo cuando cambia el cart
  useEffect(() => {
    setSalesTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, cart, customer: selectedCustomer, paymentMethod, amountPaid, paymentSplits }
        : tab
    ));
  }, [cart, selectedCustomer, paymentMethod, amountPaid, paymentSplits, activeTabId]);

  // Cargar venta para editar si viene en el state
  useEffect(() => {
    if (location.state?.editSale) {
      const sale = location.state.editSale;
      setEditingSaleId(sale.id);
      
      // Transformar items de la venta al formato del carrito
      const editCart = sale.items.map(item => ({
        ...item,
        id: item.product_id, // El carrito usa el id del producto
        name: item.product_name,
        sku: item.sku,
        image_url: item.image_url,
        quantity: parseFloat(item.quantity || 0),
        price_sell: parseFloat(item.price_sell_at_sale || 0),
        price_offer: parseFloat(item.price_offer_at_sale || 0),
        price_buy: parseFloat(item.price_buy_at_sale || 0),
        promo_type: item.promo_type || 'none',
        promo_buy: item.promo_buy,
        promo_pay: item.promo_pay,
        sell_by_weight: item.sell_by_weight === 1 || item.sell_by_weight === true
      }));

      setCart(editCart);
      
      // Buscar el cliente en la lista local si existe
      if (sale.customer_id) {
        const customer = customers.find(c => c.id === sale.customer_id);
        if (customer) setSelectedCustomer(customer);
        else setSelectedCustomer({ id: sale.customer_id, name: sale.customer_name || 'Cargando...' });
      }

      setPaymentMethod(sale.payment_method);
      setAmountPaid(sale.amount_paid?.toString() || '0');

      // Limpiar el state para no volver a cargar
      window.history.replaceState({}, document.title);
    }
  }, [location.state, customers]);

  // Verificar caja abierta
  useEffect(() => {
    const fetchRegister = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/cash-registers/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentRegister(response.data);
      } catch (error) {
        console.error('Error fetching register:', error);
      } finally {
        setCheckingRegister(false);
      }
    };
    fetchRegister();
  }, []);

  const handleOpenRegisterDirectly = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast.error('Ingresa un monto inicial válido');
      return;
    }

    setOpeningRegisterLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cash-registers/open', {
        opening_amount: parseFloat(openingAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Caja abierta exitosamente');
      setShowOpenRegisterModal(false);
      setOpeningAmount('');
      
      // Actualizar el estado de la caja
      const response = await axios.get('/api/cash-registers/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentRegister(response.data);
    } catch (error) {
      console.error('Error opening register:', error);
      toast.error(error.response?.data?.message || 'Error al abrir caja');
    } finally {
      setOpeningRegisterLoading(false);
    }
  };
  
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

        <div style="margin-top: 12px; font-size: 10px;">
          <div style="border-bottom: 0.5px solid #eee; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">Desglose de Pago</div>
          ${saleData.payments && saleData.payments.length > 0 ? 
            saleData.payments.map(p => `
              <div class="summary-item">
                <span>${p.method}:</span>
                <b>$${Number(p.amount).toFixed(2)}</b>
              </div>
            `).join('') : `
              <div class="summary-item">
                <span>${saleData.payment_method || 'Efectivo'}:</span>
                <b>$${Number(saleData.total).toFixed(2)}</b>
              </div>
            `
          }
          ${saleData.debt_amount > 0 ? `
            <div class="summary-item" style="color: #d00; border-top: 0.5px dashed #d00; padding-top: 2px; margin-top: 4px;">
              <span>SALDO DEUDA:</span>
              <b>$${Number(saleData.debt_amount).toFixed(2)}</b>
            </div>
          ` : ''}
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

  const handlePrintTicket = (ticketData) => {
    if (printMethod === 'server') {
      axios.post('/api/print', { sale: ticketData })
        .then(() => console.log('Ticket enviado a impresión directa'))
        .catch(err => {
          console.error('Error en impresión directa:', err);
          toast.error('Error al enviar a la impresora del servidor. Intentando manual...');
          printTicket(ticketData);
        });
    } else {
      printTicket(ticketData);
    }
  };
  const handleGlobalKeyDown = (e) => {
    // Si el asistente de pago está abierto, prioridad absoluta a sus atajos
    if (showPaymentWizardRef.current) {
      // Si estamos en el paso de búsqueda de cliente dentro del wizard, no interceptamos
      if (wizardStepRef.current === 'customer') return;

      const currentCart = cartRef.current;
      const currentSplits = paymentSplitsRef.current;
      const currentDiscount = cashDiscountPercentRef.current;

      // Permitir cambiar cliente en cualquier momento del wizard con F4
      if (e.key === 'F4') {
        e.preventDefault();
        setWizardCustomerSearch('');
        setWizardCustomerResults([]);
        setWizardCustomerSelectedIndex(0);
        setWizardStep('customer');
        setTimeout(() => wizardCustomerInputRef.current?.focus(), 50);
        return;
      }
      
      // Calcular totales actuales usando los mismos métodos que el renderizado
      const subtotalVal = calculateTotal(currentCart);
      const cashDiscountApplied = calculateCashDiscountFromSplits(subtotalVal, currentSplits, currentDiscount);
      const finalTotalVal = subtotalVal - cashDiscountApplied;
      
      const currentCustomer = selectedCustomerRef.current;
      const currentBalance = customerBalanceRef.current;
      const eligibleCredit = (currentCustomer && !currentCustomer.name?.toLowerCase().includes('cons. final') && Number(currentBalance || 0) < 0)
        ? Math.abs(Number(currentBalance || 0))
        : 0;
      
      const creditToApplyVal = Math.min(eligibleCredit, finalTotalVal);
      const dueAfterCredit = Math.max(0, finalTotalVal - creditToApplyVal);
      const totalAssigned = currentSplits.reduce((sum, s) => sum + s.amount, 0);
      const remainingVal = dueAfterCredit - totalAssigned;

      if (e.key === 'Enter') {
        if (remainingVal <= 0.01) {
          e.preventDefault();
          handleCheckout();
          setShowPaymentWizard(false);
          return;
        }

        if (wizardStepRef.current === 'amount') {
          e.preventDefault();
          setWizardStep('method');
          return;
        }
      } else if (wizardStepRef.current === 'method') {
        if (e.key === 'Enter' && currentSplits.length === 0) {
          e.preventDefault();
          addWizardPayment('Efectivo');
          return;
        }
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const methods = { '1': 'Efectivo', '2': 'MP', '3': 'Transferencia', '4': 'Cta Cte' };
          addWizardPayment(methods[e.key]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setWizardStep('amount');
        }
      }
      return;
    }

    if (e.key === 'F10') {
      e.preventDefault();
      openWizard();
    } else if (e.key === 'F2') {
      e.preventDefault();
      scanInputRef.current?.focus();
    } else if (e.key === 'F4') {
      e.preventDefault();
      customerInputRef.current?.focus();
    }
  };


  useEffect(() => {
    const handleStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncOfflineSales();
      }
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    // 1. Cargar SOLO al Consumidor Final para el inicio rápido
    db.customers.filter(c => c.name.toLowerCase().includes('cons. final')).first().then(defaultCustomer => {
      if (defaultCustomer) {
        setSelectedCustomer(defaultCustomer);
        setCustomers([defaultCustomer]); // Solo mantenemos el default en el estado para optimizar
      }
    });

    // 2. Sincronización en segundo plano DIFERIDA (para no bloquear el inicio)
    const syncTimeout = setTimeout(() => {
      if (navigator.onLine) {
        syncOfflineSales();
        
        // Catálogo - Sincronizar solo si es necesario o en segundo plano
        axios.get('/api/products')
          .then(res => syncCatalog(res.data))
          .catch(err => console.error('Error al sincronizar catálogo', err));
        
        // Clientes
        const token = localStorage.getItem('token');
        axios.get('/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            // Sincronizamos la DB local pero NO cargamos todo al estado de React para evitar lentitud
            syncCustomers(res.data);
            
            const defaultCustomer = res.data.find(c => c.name.toLowerCase().includes('cons. final'));
            if (defaultCustomer) {
              setSelectedCustomer(defaultCustomer);
              setCustomers([defaultCustomer]); 
            }
          })
          .catch(err => console.error('Error al sincronizar clientes', err));
      }
    }, 3000); // Esperar 3 segundos antes de la carga pesada

    // Forzar foco en el input después de un breve momento
    setTimeout(() => {
      if (scanInputRef.current) scanInputRef.current.focus();
    }, 500);

    // Escuchar actualizaciones en tiempo real
    socket.on('catalog_updated', (data) => {
      console.log('Recibida notificación de catálogo actualizado', data ? '(incremental)' : '(total)');
    });

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      socket.off('catalog_updated');
      clearTimeout(syncTimeout);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0 && searchResultsRef.current) {
      const selectedItem = searchResultsRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

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

  const handleSearch = (term) => {
    setSearchTerm(term);
    latestSearchTerm.current = term;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const startTime = performance.now();
        
        try {
          const lowerTerm = term.toLowerCase().trim();
          
          // Obtener modo de búsqueda (local o server)
          const searchMode = localStorage.getItem('search_mode') || 'local';
          
          let results = [];
          
          if (searchMode === 'server') {
            // Búsqueda en servidor
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/products/search?q=${encodeURIComponent(term)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            results = response.data;
          } else {
            // Búsqueda local OPTIMIZADA
            // 1. Intentar SKU exacto primero (usando índice de Dexie - instantáneo)
            const exactSku = await db.products.where('sku').equalsIgnoreCase(lowerTerm).first();
            
            if (exactSku) {
              results = [exactSku];
            } else {
              // 2. Búsqueda por nombre o SKU parcial si no hay SKU exacto
              results = await db.products
                .filter(p => {
                  const productName = (p.name || '').toLowerCase();
                  const productSku = (p.sku || '').toLowerCase();
                  return productName.includes(lowerTerm) || productSku.includes(lowerTerm);
                })
                .limit(50)
                .toArray();
            }

            // Ordenar resultados locales
            results = results.sort((a, b) => {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              const aStarts = aName.startsWith(lowerTerm);
              const bStarts = bName.startsWith(lowerTerm);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              return 0;
            });
          }

          if (latestSearchTerm.current !== term) return;

          const endTime = performance.now();
          const searchTime = (endTime - startTime).toFixed(2);
          console.log(`🔍 Búsqueda ${searchMode}: ${searchTime}ms - ${results.length} resultados`);

          setSearchResults(results);
          setSelectedIndex(results.length > 0 ? 0 : -1);
        } catch (error) {
          console.error("Error en búsqueda:", error);
          
          // Fallback a búsqueda local si falla el servidor
          if (localStorage.getItem('search_mode') === 'server') {
            console.log('⚠️ Búsqueda en servidor falló, usando local como fallback');
            try {
              const lowerTerm = term.toLowerCase().trim();
              const results = await db.products
                .filter(p => {
                  const productName = (p.name || '').toLowerCase();
                  const productSku = (p.sku || '').toLowerCase();
                  return productName.includes(lowerTerm) || productSku.includes(lowerTerm);
                })
                .limit(100)
                .toArray();
              
              setSearchResults(results);
              setSelectedIndex(results.length > 0 ? 0 : -1);
            } catch (fallbackError) {
              console.error("Error en fallback:", fallbackError);
            }
          }
        } finally {
          if (latestSearchTerm.current === term) {
            setIsSearching(false);
          }
        }
      }, 100); // 100ms de espera antes de buscar
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
      setIsSearching(false);
    }
  };

  const addToCart = (product) => {
    if (!currentRegister && !checkingRegister) {
      toast.error('Debe abrir la caja antes de iniciar una venta');
      setShowOpenRegisterModal(true);
      return;
    }

    if (product.sell_by_weight) {
      setCurrentWeightProduct(product);
      setWeightEditMode('add');
      setInputWeight('');
      setWeightUnit('kg'); // Resetear a kg por defecto
      setShowWeightModal(true);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedIndex(-1);
      // El foco se hará en el modal mediante useEffect o onEntered
      return;
    }

    const existing = cart.find(item => String(item.id) === String(product.id));
    if (existing) {
      setCart(cart.map(item => 
        String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Activar efecto de highlight
    setLastAddedProductId(product.id);
    setTimeout(() => setLastAddedProductId(null), 2000);
    
    setSearchTerm('');
    latestSearchTerm.current = '';
    setSearchResults([]);
    setSelectedIndex(-1);
    setIsSearching(false);
    scanInputRef.current?.focus();
  };

  const openWizard = () => {
    const currentCart = cartRef.current;
    if (currentCart.length === 0) return;

    // Reiniciar datos previos para empezar de cero
    setPaymentSplits([]);
    setAmountPaid('0');

    const currentTotal = calculateTotal(currentCart);
    const currentCustomer = selectedCustomerRef.current;
    const customerCredit =
      currentCustomer &&
      !currentCustomer.name?.toLowerCase().includes('cons. final') &&
      Number(customerBalance || 0) < 0
        ? Math.abs(Number(customerBalance || 0))
        : 0;
    // No asumir descuento hasta que el usuario elija el método de pago.
    const suggestedDue = Math.max(0, currentTotal - customerCredit);

    // Sugerir monto a cobrar luego de aplicar saldo a favor
    setWizardAmount(suggestedDue.toFixed(2));
    setWizardStep('amount');
    setShowPaymentWizard(true);
  };

  const addWizardPayment = (method) => {
    let amount = parseFloat(wizardAmountRef.current) || 0;
    const currentCustomer = selectedCustomerRef.current;
    const currentSplits = paymentSplitsRef.current;
const currentCart = cartRef.current;
    const currentDiscount = cashDiscountPercentRef.current;
    const currentBalance = customerBalanceRef.current;

    if (amount <= 0 && method !== 'Cta Cte') {
      toast.error('Ingrese un monto válido');
      return;
    }

    // No permitir que métodos que no sean Efectivo generen vuelto
    if (method !== 'Efectivo') {
      const subtotalVal = calculateTotal(currentCart);
      // Al agregar un método NO-efectivo, el descuento por efectivo desaparece o se recalcula.
      // Para el tope de seguridad, usamos el total SIN el descuento por efectivo que pudiera haber ahora.
      const finalTotalVal = subtotalVal; 
      
      const eligibleCredit = (currentCustomer && !currentCustomer.name?.toLowerCase().includes('cons. final') && Number(currentBalance || 0) < 0)
        ? Math.abs(Number(currentBalance || 0))
        : 0;
      
      const creditToApplyVal = Math.min(eligibleCredit, finalTotalVal);
      const dueAfterCreditVal = Math.max(0, finalTotalVal - creditToApplyVal);
      const totalAssignedVal = currentSplits.reduce((sum, s) => sum + s.amount, 0);
      const remainingForThisMethod = Math.max(0, dueAfterCreditVal - totalAssignedVal);
      
      if (amount > remainingForThisMethod) {
        amount = remainingForThisMethod;
      }
    }

    if (method === 'Cta Cte' && (!currentCustomer || currentCustomer?.name?.toLowerCase().includes('cons. final'))) {
      setWizardStep('customer');
      setWizardCustomerSearch('');
      setWizardCustomerResults([]);
      setWizardCustomerSelectedIndex(-1);
      setTimeout(() => wizardCustomerInputRef.current?.focus(), 100);
      return;
    }

    // Actualizar splits
    const existing = currentSplits.find(s => s.method === method);
    let newSplits;
    if (existing) {
      newSplits = currentSplits.map(s => s.method === method ? { ...s, amount: s.amount + amount } : s);
    } else {
      newSplits = [...currentSplits, { method, amount }];
    }
    
    setPaymentSplits(newSplits);
    
    // Calcular crédito disponible para restar del total sugerido
    const eligibleCredit = (currentCustomer && !currentCustomer.name?.toLowerCase().includes('cons. final') && Number(currentBalance || 0) < 0)
      ? Math.abs(Number(currentBalance || 0))
      : 0;

    // Calcular nuevo remanente para sugerir en el siguiente paso
    const currentTotal = calculateTotal(currentCart);
    const finalTotal = currentTotal - calculateCashDiscountFromSplits(currentTotal, newSplits, currentDiscount);
    const creditToApplyVal = Math.min(eligibleCredit, finalTotal);
    const dueAfterCredit = Math.max(0, finalTotal - creditToApplyVal);

    const totalAssigned = newSplits.reduce((sum, s) => sum + s.amount, 0);
    const newRemaining = dueAfterCredit - totalAssigned;

    if (newRemaining > 0.01) {
      setWizardAmount(newRemaining.toFixed(2));
    } else {
      setWizardAmount('');
    }
    
    setWizardStep('amount');
    
    // Si ya cubrió el total, el modal mostrará el botón de finalizar gracias a la lógica del render
  };

  const handleWizardCustomerSearch = async (term) => {
    setWizardCustomerSearch(term);
    if (term.length >= 1) {
      // Búsqueda optimizada en IndexedDB: primero por prefijo (muy rápido)
      const results = await db.customers
        .where('name')
        .startsWithIgnoreCase(term)
        .limit(10)
        .toArray();
      
      // Si hay pocos resultados por prefijo, buscamos por inclusión (más lento pero más flexible)
      if (results.length < 3 && term.length > 2) {
        const moreResults = await db.customers
          .filter(c => c.name.toLowerCase().includes(term.toLowerCase()))
          .limit(10)
          .toArray();
        
        // Unificar resultados evitando duplicados
        const combined = [...results];
        moreResults.forEach(r => {
          if (!combined.find(c => c.id === r.id)) combined.push(r);
        });
        setWizardCustomerResults(combined.slice(0, 10));
        setWizardCustomerSelectedIndex(combined.length > 0 ? 0 : -1);
      } else {
        setWizardCustomerResults(results);
        setWizardCustomerSelectedIndex(results.length > 0 ? 0 : -1);
      }
    } else {
      setWizardCustomerResults([]);
      setWizardCustomerSelectedIndex(-1);
    }
  };

  const handleWizardCustomerKeyDown = (e) => {
    if (wizardCustomerResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWizardCustomerSelectedIndex(prev => (prev < wizardCustomerResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWizardCustomerSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && wizardCustomerSelectedIndex >= 0) {
        e.preventDefault();
        if (wizardLockEnter) return; // Evitar doble ejecución
        selectCustomerFromWizard(wizardCustomerResults[wizardCustomerSelectedIndex]);
      }
    }
  };

  const selectCustomerFromWizard = async (customer) => {
    // Bloqueo de seguridad para evitar cierres accidentales con el mismo Enter
    setWizardLockEnter(true);
    await selectCustomer(customer);
    
    setTimeout(() => {
      // Ir al paso de monto para que el usuario elija cuánto asignar (especialmente si quiere pagar solo parte en Cta Cte)
      setWizardStep('amount');
      setWizardLockEnter(false);
    }, 300);
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
    const existing = cart.find(item => String(item.id) === String(product.id));
    
    if (existing) {
      setCart(cart.map(item => 
        String(item.id) === String(product.id)
          ? { ...item, quantity: weightEditMode === 'add' ? item.quantity + weight : weight } 
          : item
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
    setWeightUnit('kg'); // Resetear a kg
    setIsSearching(false);
    scanInputRef.current?.focus();
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const term = searchTerm.trim();
      if (!term) return;

      // 1. Prioridad: Búsqueda exacta por SKU (ideal para lectores de barra)
      const exactMatch = await db.products
        .where('sku')
        .equalsIgnoreCase(term)
        .first();
      
      if (exactMatch) {
        addToCart(exactMatch);
        toast.success(`Producto agregado: ${exactMatch.name}`, { duration: 1500 });
        return;
      }

      // 2. Si hay resultados visibles y uno seleccionado, agregar ese
      if (searchResults.length > 0 && selectedIndex >= 0) {
        addToCart(searchResults[selectedIndex]);
        return;
      }
      
      // 3. Si no hay resultados visibles, buscar por SKU parcial o nombre (1er resultado)
      const results = await db.products
        .filter(p => 
          p.name.toLowerCase().includes(term.toLowerCase()) || 
          p.sku.includes(term)
        )
        .limit(1)
        .toArray();
      
      if (results.length > 0) {
        addToCart(results[0]);
        toast.success(`Producto agregado: ${results[0].name}`, { duration: 1500 });
      } else {
        toast.error('Producto no encontrado', { duration: 2000 });
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
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 0);
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (String(item.id) === String(productId)) {
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

  const calculateCashDiscountFromSplits = (subtotalAmount, splits, discountPercent) => {
    const parsedDiscount = (parseFloat(discountPercent) || 0) / 100;
    if (parsedDiscount <= 0) return 0;

    const validSplits = (splits || []).filter((s) => (parseFloat(s.amount) || 0) > 0);
    const nonDebtSplits = validSplits.filter((s) => s.method !== 'Cta Cte');
    const cashAmount = nonDebtSplits
      .filter((s) => s.method === 'Efectivo')
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const hasOnlyCashAsNonDebt = nonDebtSplits.length > 0 && nonDebtSplits.every((s) => s.method === 'Efectivo');
    const hasMixedNonDebtMethods = nonDebtSplits.some((s) => s.method !== 'Efectivo');

    // Regla de negocio: el descuento por efectivo SOLO aplica si la venta queda 100% en efectivo
    // y el monto en efectivo alcanza para cubrir el total con descuento.
    if (!hasOnlyCashAsNonDebt || hasMixedNonDebtMethods) return 0;

    const discountedTotal = subtotalAmount * (1 - parsedDiscount);
    if (cashAmount + 0.01 < discountedTotal) return 0;

    return subtotalAmount * parsedDiscount;
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
    if (term.length >= 1) {
      const results = await db.customers
        .where('name')
        .startsWithIgnoreCase(term)
        .limit(10)
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

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomerResults([]);
    
    // Cargar automáticamente el saldo y envases del cliente
    if (customer && !customer.name?.toLowerCase().includes('cons. final')) {
      fetchCustomerStats(customer);
    }
  };

  const fetchCustomerStats = async (customer) => {
    if (!customer || customer.name.toLowerCase().includes('cons. final')) return;
    
    // Fetch balance and containers
    try {
      toast.loading('Consultando estado...', { id: 'fetch-stats' });
      const token = localStorage.getItem('token');
      const [balanceRes, containersRes] = await Promise.all([
        axios.get(`/api/customer-accounts/${customer.id}/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/containers/customer/${customer.id}/balances`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setCustomerBalance(balanceRes.data.balance);
      setSelectedCustomerContainers(containersRes.data);
      
      // Check if has pending containers
      const hasPending = containersRes.data.some(b => b.balance > 0);
      
      // Update active tab with the flag
      setSalesTabs(tabs => tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, customer, hasPendingContainers: hasPending }
          : tab
      ));
      toast.success('Información actualizada', { id: 'fetch-stats' });
    } catch (err) {
      console.error('Error fetching customer data:', err);
      toast.error('Error al consultar saldo', { id: 'fetch-stats' });
      setCustomerBalance(null);
      setSelectedCustomerContainers([]);
    }
  };

  const handleCustomerUpdate = () => {
    // Re-sincronizar lista de clientes
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        syncCustomers(res.data);
        
        // Mantener solo el seleccionado y el default en el estado para eficiencia
        const defaultCustomer = res.data.find(c => c.name.toLowerCase().includes('cons. final'));
        const currentSelected = selectedCustomerRef.current;
        const stateCustomers = [];
        if (defaultCustomer) stateCustomers.push(defaultCustomer);
        if (currentSelected && currentSelected.id !== defaultCustomer?.id) {
          const updatedSelected = res.data.find(c => c.id === currentSelected.id);
          if (updatedSelected) {
            stateCustomers.push(updatedSelected);
            setSelectedCustomer(updatedSelected);
          }
        }
        setCustomers(stateCustomers);
        if (customerToEdit && pendingWhatsAppSale) {
          const updated = res.data.find(c => c.id === customerToEdit.id);
          if (updated && updated.phone) {
            shareTicketViaWhatsApp({ ...pendingWhatsAppSale, customer_phone: updated.phone });
            setPendingWhatsAppSale(null);
          }
        }
        
        setCustomerToEdit(null);
      })
      .catch(err => console.error('Error al actualizar clientes:', err));
  };

  const handleCheckout = async () => {
    // Usar valores de los refs para asegurar que el listener de F10 (que es una clausura) tenga los datos actuales
    const currentCart = cartRef.current;
    const currentCustomer = selectedCustomerRef.current;
    const currentPaymentMethod = paymentMethodRef.current;
    const currentTotal = currentCart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);

    if (currentCart.length === 0) return;

    // Validación de envases vs Consumidor Final para asegurar trazabilidad
    const hasContainers = currentCart.some(item => item.is_container);
    if (hasContainers) {
      if (!currentCustomer || 
          currentCustomer.name.toLowerCase().includes('cons. final') || 
          currentCustomer.name.toLowerCase().includes('consumidor final')) {
        toast.error('Para ventas con envases, debe seleccionar un cliente real (no Consumidor Final)');
        customerInputRef.current?.focus();
        return;
      }
    }

    // Para Cuenta Corriente, no se requiere monto de pago
    if (currentPaymentMethod === 'Cta Cte') {
      if (!currentCustomer) {
        toast.error('Debe seleccionar un cliente para Cuenta Corriente');
        customerInputRef.current?.focus();
        return;
      }
      
      // No se puede usar Cta Cte con "Cons. Final"
      if (currentCustomer.name.toLowerCase().includes('cons. final') || 
          currentCustomer.name.toLowerCase().includes('consumidor final')) {
        toast.error('No se puede usar Cuenta Corriente para Consumidor Final');
        customerInputRef.current?.focus();
        return;
      }
    }

    const currentSplits = paymentSplitsRef.current;
    const currentDiscount = cashDiscountPercentRef.current;
    
    const finalTotal = calculateTotal(currentCart) - calculateCashDiscountFromSplits(calculateTotal(currentCart), currentSplits, currentDiscount);
    
    // Calcular total pagado (excluyendo Cta Cte que es deuda)
    const paid = currentSplits
      .filter(p => p.method !== 'Cta Cte')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const ctaCteAmount = currentSplits
      .filter(p => p.method === 'Cta Cte')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalAssigned = paid + ctaCteAmount;
    const difference = totalAssigned - finalTotal;

    // Determinamos el método principal para compatibilidad (el que tenga más monto)
    let finalPaymentMethod = 'Efectivo';
    if (paymentSplits.length > 0) {
      const sortedSplits = [...paymentSplits].sort((a, b) => b.amount - a.amount);
      finalPaymentMethod = sortedSplits[0].method;
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
      total: finalTotal,
      subtotal: calculateTotal(currentCart),
      cash_discount: calculateCashDiscountFromSplits(calculateTotal(currentCart), currentSplits, currentDiscount),
      customer_id: currentCustomer?.id || null,
      payment_method: finalPaymentMethod, // Método principal para reportes legacy
      payments: currentSplits.filter(p => p.amount > 0).map(p => ({
        method: p.method,
        amount: p.amount
      })),
      amount_paid: paid,
      change_given: difference > 0 ? difference : 0,
      debt_amount: difference < 0 ? Math.abs(difference) + ctaCteAmount : ctaCteAmount,
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline) {
        const token = localStorage.getItem('token');
        if (editingSaleId) {
          await axios.put(`/api/sales/${editingSaleId}`, saleData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          await axios.post('/api/sales', saleData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
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
      setAmountPaid('0'); // Limpiar campo de pago a 0
      
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
      setCustomerBalance(null);
      setCustomerSearch('');
      setCustomerResults([]);
      
      setPaymentMethod('Efectivo');
      localStorage.removeItem('pending_sale');
      
      // Hacer foco de nuevo en el buscador de productos para la siguiente venta
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }

      // Preparar datos para el ticket
      const ticketData = {
        ...saleData,
        seller_name: user?.username || 'Vendedor',
        customer_name: currentCustomer?.name || 'Anónimo',
        customer_phone: currentCustomer?.phone || null,
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

      setLastCompletedSale(ticketData);

      // Lógica de automatización: WhatsApp prioritario sobre Impresión si hay celular
      if (autoWhatsApp && ticketData.customer_phone) {
        shareTicketViaWhatsApp(ticketData);
      } else if (autoPrint) {
        handlePrintTicket(ticketData);
      }

      // Si autoWhatsApp está encendido pero NO hay celular, avisar al usuario
      if (autoWhatsApp && !ticketData.customer_phone && currentCustomer && !currentCustomer.name.toLowerCase().includes('cons. final')) {
         toast('El cliente no tiene celular registrado para envío automático.', { icon: '📱', duration: 3000 });
      }

      // Notificación de éxito con opción de impresión manual
      let successMessage = `Venta realizada con éxito`;
      if (finalPaymentMethod === 'Cta Cte') {
        successMessage = `Venta registrada en CUENTA CORRIENTE ($${finalTotal.toFixed(2)})`;
      } else if (difference < 0) {
        successMessage = `Venta registrada con deuda de $${Math.abs(difference).toFixed(2)}`;
      } else if (finalPaymentMethod === 'MP') {
        successMessage = `Venta registrada con MERCADO PAGO`;
      }
      
      toast.success((t) => (
        <span>
          <b>{successMessage}</b> {isOnline ? '' : '(Offline)'}
          {difference >= 0 && difference > 0 && (
            <div className="mt-2 h3 mb-0">
              Vuelto: <strong className="text-danger">${difference.toFixed(2)}</strong>
            </div>
          )}
          <div className="d-flex flex-column gap-2 mt-2">
            <Button 
              variant="primary" 
              size="sm" 
              className="w-100"
              onClick={() => {
                handlePrintTicket(ticketData);
                toast.dismiss(t.id);
              }}
            >
              <Printer size={14} className="me-1" /> Imprimir Ticket
            </Button>
            <Button 
              variant="success" 
              size="sm" 
              className="w-100"
              onClick={async () => {
                // Si no hay celular y hay un cliente que no sea Cons. Final
                if (!ticketData.customer_phone && ticketData.customer_id) {
                  const customer = customers.find(c => c.id === ticketData.customer_id);
                  if (customer && !customer.name.toLowerCase().includes('cons. final')) {
                    setPendingWhatsAppSale(ticketData);
                    setCustomerToEdit(customer);
                    setShowCustomerModal(true);
                    toast.dismiss(t.id);
                    return;
                  }
                }
                try {
                  await shareTicketViaWhatsApp(ticketData);
                  toast.dismiss(t.id);
                } catch (error) {
                  console.error(error);
                  toast.error('Error al enviar por WhatsApp');
                }
              }}
            >
              <Share2 size={14} className="me-1" /> 
              {!ticketData.customer_phone && ticketData.customer_id && !ticketData.customer_name.toLowerCase().includes('cons. final')
                ? 'Agregar Celular y Enviar'
                : 'Enviar por WhatsApp'}
            </Button>
          </div>
        </span>
      ), {
        duration: 8000,
        icon: '💰',
      });

      // Imprimir automáticamente si está configurado
      if (autoPrint) {
        handlePrintTicket(ticketData);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Error al procesar la venta';
      toast.error(errorMessage);
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

  const cancelEdit = () => {
    setEditingSaleId(null);
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod('Efectivo');
    setAmountPaid('0');
    toast('Edición cancelada', { icon: 'ℹ️' });
  };

  return (
    <div className="pos-container py-2">
      {editingSaleId && (
        <div className="alert alert-warning mb-3 shadow-sm d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-bold">⚠️ MODO EDICIÓN ACTIVADO:</span> Editando venta <strong>#{editingSaleId}</strong>.
            Los cambios afectarán el stock y las cajas asociadas.
          </div>
          <Button variant="outline-danger" size="sm" onClick={cancelEdit}>
            <Trash2 size={14} className="me-1" /> Salir de edición
          </Button>
        </div>
      )}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              {/* Pestañas de ventas múltiples */}
              <SalesTabs 
                tabs={salesTabs}
                activeTabId={activeTabId}
                onTabChange={(tabId) => setActiveTabId(tabId)}
                onTabClose={(tabId) => {
                  if (salesTabs.length === 1) {
                    toast.error('Debe haber al menos una venta abierta');
                    return;
                  }
                  const tab = salesTabs.find(t => t.id === tabId);
                  if (tab && tab.cart.length > 0) {
                    // Usar toast personalizado para confirmación
                    const confirmClose = () => {
                      return new Promise((resolve, reject) => {
                        const toastId = toast((t) => (
                          <div>
                            <p className="mb-2">¿Cerrar esta venta? Se perderán {tab.cart.length} productos.</p>
                            <div className="d-flex gap-2">
                              <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => {
                                  toast.dismiss(toastId);
                                  resolve(true);
                                }}
                              >
                                Sí, cerrar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => {
                                  toast.dismiss(toastId);
                                  reject(false);
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ), {
                          duration: Infinity,
                          position: 'top-center'
                        });
                      });
                    };

                    confirmClose()
                      .then(() => {
                        setSalesTabs(salesTabs.filter(t => t.id !== tabId));
                        if (activeTabId === tabId) {
                          setActiveTabId(salesTabs[0].id);
                        }
                        toast.success('Venta cerrada');
                      })
                      .catch(() => {
                        // Usuario canceló
                      });
                  } else {
                    setSalesTabs(salesTabs.filter(t => t.id !== tabId));
                    if (activeTabId === tabId) {
                      setActiveTabId(salesTabs[0].id);
                    }
                    toast.success('Venta cerrada');
                  }
                }}
                onNewTab={() => {
                  const newId = Math.max(...salesTabs.map(t => t.id)) + 1;
                  setSalesTabs([...salesTabs, {
                    id: newId,
                    cart: [],
                    customer: null,
                    paymentMethod: 'Efectivo',
                    amountPaid: '0'
                  }]);
                  setActiveTabId(newId);
                  toast.success('Nueva venta creada');
                }}
              />
              
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
                <ListGroup 
                  ref={searchResultsRef}
                  className="position-absolute w-100 shadow-lg custom-scrollbar" 
                  style={{ 
                    zIndex: 1000, 
                    marginTop: '-15px', 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    borderRadius: '0 0 8px 8px'
                  }}
                >
                  {searchResults.map((p, idx) => (
                    <ListGroup.Item 
                      key={p.id} 
                      action 
                      onClick={() => addToCart(p)}
                      className={`d-flex align-items-center justify-content-between p-3 ${selectedIndex === idx ? 'bg-primary text-white shadow' : ''}`}
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '140px', height: '140px', border: '1px solid #eee', flexShrink: 0 }}>
                          {p.image_url ? <img src={`/uploads/${p.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Search size={40} className="opacity-25" />}
                        </div>
                        <div>
                          <strong className="fs-4 d-block">{p.name}</strong>
                          <div className={`${selectedIndex === idx ? 'text-white-50' : 'text-muted'} fs-6`}>SKU: {p.sku}</div>
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
                          <div className={`text-decoration-line-through small ${selectedIndex === idx ? 'text-white-50' : 'text-muted'}`}>${p.price_sell}</div>
                        )}
                        <div className={`fw-bold h3 mb-0 ${selectedIndex === idx ? 'text-warning' : (p.promo_type === 'price' ? 'text-success' : 'text-primary')}`}>
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
                      <th className="text-center" style={{ width: '100px' }}>Cant.</th>
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
                              style={{ width: '100px', height: '100px', border: '1px solid #eee' }}
                            >
                              {item.image_url ? (
                                <img 
                                  src={`/uploads/${item.image_url}`} 
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
                                {item.is_container && (
                                  <Badge bg="info" className="x-small text-dark">📦 Envase</Badge>
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
                              <>
                                <Button variant="light" size="sm" onClick={() => {
                                    setCurrentWeightProduct(item);
                                    setWeightEditMode('set');
                                    setInputWeight(item.quantity.toString());
                                    setShowWeightModal(true);
                                }}><Edit size={14} /></Button>
                                <Button variant="light" size="sm" onClick={() => {
                                    setCurrentWeightProduct(item);
                                    setWeightEditMode('add');
                                    setInputWeight('');
                                    setShowWeightModal(true);
                                }}><Plus size={14} /></Button>
                              </>
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
                                <div className="fw-bold h4 mb-0">${finalSubtotal.toFixed(2)}</div>
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
          {!checkingRegister && !currentRegister && (
            <Alert variant="danger" className="mb-3 shadow-sm border-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Lock size={20} className="text-danger" />
                <strong className="h5 mb-0">Caja Cerrada</strong>
              </div>
              <p className="small mb-2">
                Debe abrir la caja para poder registrar ventas.
              </p>
              <div className="d-flex flex-column gap-2">
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="w-100 fw-bold"
                  onClick={() => setShowOpenRegisterModal(true)}
                >
                  <Unlock size={16} className="me-2" />
                  ABRIR CAJA AQUÍ
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="w-100"
                  onClick={() => navigate('/cash-register')}
                >
                  IR A MI CAJA
                </Button>
              </div>
            </Alert>
          )}

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
            </div>            {/* Totales */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2 opacity-75 small">
                <span>Total Lista (sin promos):</span>
                <span>${listTotal.toFixed(2)}</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="d-flex justify-content-between mb-2 text-danger fw-bold small">
                  <span>Ahorro en Promos:</span>
                  <span>-${totalSavings.toFixed(2)}</span>
                </div>
              )}
              
              <div className="d-flex justify-content-between mb-2 border-top border-secondary border-opacity-25 pt-2">
                <span className="fw-bold">Subtotal:</span>
                <span className="fw-bold">${total.toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold h4 mb-0">TOTAL:</span>
                <span className="fw-bold display-6 text-info">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="text-center bg-primary bg-opacity-10 rounded py-2 border border-primary border-opacity-25">
                 <span className="text-primary small fw-bold">CANTIDAD DE PRODUCTOS: </span>
                 <span className="h4 mb-0 text-primary fw-bold">{totalItemsCount}</span>
              </div>
            </div>

            {/* Resumen Venta Anterior */}
            {lastCompletedSale && (
              <div className="mb-4 bg-black bg-opacity-25 p-3 rounded border border-secondary border-opacity-50 shadow-sm">
                <h6 className="small text-info text-uppercase mb-2 border-bottom border-info border-opacity-25 pb-1 font-monospace" style={{ letterSpacing: '1px' }}>
                  Última Venta
                </h6>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-white-50 text-uppercase small">Cliente:</span>
                  <span className="fw-bold fs-5">{lastCompletedSale.customer_name || 'Cons. Final'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-white-50 text-uppercase small">Monto:</span>
                  <span className="fw-bold text-info fs-4">${lastCompletedSale.total.toFixed(2)}</span>
                </div>
                {lastCompletedSale.amount_paid > lastCompletedSale.total && (
                  <div className="d-flex justify-content-between align-items-center mt-1 border-top border-secondary border-opacity-25 pt-1">
                    <span className="text-white-50 text-uppercase small">Vuelto:</span>
                    <span className="fw-bold text-warning fs-4">${(lastCompletedSale.amount_paid - lastCompletedSale.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Configuraciones de Ticket */}
            <div className="mb-4">
              <div className="mb-2 d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-25">
                 <div className="d-flex align-items-center gap-2">
                   <Share2 size={18} className={autoWhatsApp ? "text-success" : "text-muted"} />
                   <span className="small">WhatsApp auto.</span>
                 </div>
                 <Form.Check 
                   type="switch"
                   id="auto-whatsapp-switch"
                   checked={autoWhatsApp}
                   onChange={(e) => {
                     setAutoWhatsApp(e.target.checked);
                     localStorage.setItem('auto_whatsapp', e.target.checked);
                   }}
                 />
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-25">
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
            </div>

            <Button 
              variant={editingSaleId ? "warning" : "primary"} 
              size="lg" 
              className="w-100 py-3 fw-bold shadow-lg text-uppercase"
              style={{ letterSpacing: '1px' }}
              disabled={cart.length === 0 || (!currentRegister && !checkingRegister)}
              onClick={() => openWizard()}
            >
              <ShoppingCart size={20} className="me-2" />
              {editingSaleId ? 'GUARDAR CAMBIOS' : 'FINALIZAR VENTA (F10)'}
            </Button>

            <Button 
              variant="outline-warning" 
              className="w-100 mt-3 d-flex align-items-center justify-content-center gap-2 border-opacity-50"
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

      {/* Modal Apertura de Caja */}
      <Modal show={showOpenRegisterModal} onHide={() => setShowOpenRegisterModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Abrir Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group>
            <Form.Label className="fw-bold">Monto Inicial en Efectivo</Form.Label>
            <InputGroup size="lg">
              <InputGroup.Text className="bg-light border-end-0">$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="bg-light border-start-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenRegisterDirectly();
                }}
              />
            </InputGroup>
            <Form.Text className="text-muted mt-2 d-block">
              Ingresa el dinero físico con el que inicias el turno.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowOpenRegisterModal(false)} className="px-4 border-0">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOpenRegisterDirectly}
            disabled={openingRegisterLoading || !openingAmount}
            className="px-5 fw-bold shadow-sm"
          >
            {openingRegisterLoading ? 'Abriendo...' : 'Abrir Caja Ahora'}
          </Button>
        </Modal.Footer>
      </Modal>

      <CustomerModal 
        show={showCustomerModal} 
        handleClose={() => {
          setShowCustomerModal(false);
          setCustomerToEdit(null);
        }}
        editCustomer={customerToEdit}
        refreshCustomers={handleCustomerUpdate}
        onCustomerCreated={(c) => {
          selectCustomer(c);
          if (!customers.some(cust => cust.id === c.id)) {
            const newCustomers = [...customers, c];
            setCustomers(newCustomers);
            syncCustomers(newCustomers);
          }
        }}
      />

      <Modal 
        show={showWeightModal} 
        onHide={() => setShowWeightModal(false)} 
        centered
        onEntered={() => weightInputRef.current?.focus()}
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{weightEditMode === 'add' ? 'Sumar Peso' : 'Corregir/Establecer Peso'}</Modal.Title>
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

      {/* Modal de Resumen de Cuenta */}
      <Modal show={showAccountModal} onHide={() => setShowAccountModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title className="w-100">
            <div className="d-flex justify-content-between align-items-center pe-3">
              <div className="d-flex align-items-center gap-2">
                <User size={24} className="text-info" />
                <span>Estado de Cuenta: {selectedCustomer?.name}</span>
              </div>
              <Button variant="outline-info" size="sm" onClick={() => fetchCustomerStats(selectedCustomer)}>
                Consultar Saldo Hoy
              </Button>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-dark border-secondary shadow-sm">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1 small uppercase">Saldo Total en Pesos</h6>
                      <h2 className={customerBalance > 0 ? 'text-danger' : 'text-success'}>
                        ${Number(customerBalance || 0).toFixed(2)}
                      </h2>
                    </div>
                    <div>
                      {customerBalance > 0 ? (
                        <Badge bg="danger" className="p-2">CLIENTE DEUDOR</Badge>
                      ) : (
                        <Badge bg="success" className="p-2">CUENTA AL DÍA</Badge>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <h5 className="mb-3 d-flex align-items-center gap-2">
            <Package size={20} className="text-warning" />
            Envases Pendientes
          </h5>
          
          <div className="table-responsive">
            <Table variant="dark" hover className="border-secondary mb-0">
              <thead className="table-dark border-secondary">
                <tr>
                  <th>Envase/Producto</th>
                  <th className="text-center">Deuda Actual</th>
                </tr>
              </thead>
              <tbody className="border-secondary">
                {selectedCustomerContainers.length > 0 ? (
                  selectedCustomerContainers
                    .filter(b => b.balance > 0)
                    .map((b, idx) => (
                      <tr key={idx} className="border-secondary align-middle">
                        <td>{b.product_name}</td>
                        <td className="text-center">
                          <Badge bg="danger" pill className="fs-6 px-3">{b.balance} unidades</Badge>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center py-4 text-muted">
                      No hay deudas de envases para este cliente.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowAccountModal(false)}>Cerrar</Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowAccountModal(false);
              navigate('/cuenta-corriente', { state: { customerId: selectedCustomer.id } });
            }}
          >
            Ir a Cuenta Corriente Completa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- WIZARD DE PAGO INTELIGENTE --- */}
      {(() => {
        const hasSplits = paymentSplits.length > 0;
        // No mostrar/aplicar descuento por efectivo hasta que el usuario elija método(s) de pago.
        const cashDiscountApplied = hasSplits
          ? calculateCashDiscountFromSplits(total, paymentSplits, cashDiscountPercent)
          : 0;
        const finalTotal = total - cashDiscountApplied;
        const eligibleCustomerCredit =
          selectedCustomer &&
          !selectedCustomer.name?.toLowerCase().includes('cons. final') &&
          Number(customerBalance || 0) < 0
            ? Math.abs(Number(customerBalance || 0))
            : 0;
        const creditToApply = Math.min(eligibleCustomerCredit, finalTotal);
        const dueAfterCredit = Math.max(0, finalTotal - creditToApply);
        const totalAssigned = paymentSplits.reduce((sum, s) => sum + s.amount, 0);
        const remaining = dueAfterCredit - totalAssigned;


        return (
          <Modal 
            show={showPaymentWizard} 
            onHide={() => {
              setShowPaymentWizard(false);
              setPaymentSplits([]);
              setWizardStep('amount');
              setWizardAmount('');
              // Resetear a Consumidor Final al cancelar
              const defaultCustomer = customers.find(c => c.name.toLowerCase().includes('cons. final'));
              if (defaultCustomer) selectCustomer(defaultCustomer);
            }} 
            centered 
            size="md" 
            onEntered={() => wizardInputRef.current?.focus()}
            contentClassName="bg-dark text-white border-secondary shadow-lg"
          >
            <Modal.Header closeButton className="border-secondary">
              <Modal.Title className="d-flex align-items-center gap-2">
                <Badge bg="primary">F10</Badge> Asistente de Pago
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <div className="text-center mb-4">
                <h6 className="text-muted uppercase small mb-1">Total a Cobrar</h6>
                <h1 className="display-4 fw-bold text-primary">${finalTotal.toFixed(2)}</h1>
                {creditToApply > 0 && (
                  <div className="mt-2 small">
                    <div className="text-success">Saldo a favor aplicado: -${creditToApply.toFixed(2)}</div>
                    <div className="text-info fw-bold">Total final a pagar: ${dueAfterCredit.toFixed(2)}</div>
                  </div>
                )}
                <div className="mt-3">
                  <div className="small text-muted mb-1">Cliente del ticket</div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <Badge bg="secondary" className="p-2 px-3 rounded-pill shadow-sm">
                      {selectedCustomer?.name || 'Cons. Final'}
                    </Badge>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => {
                        setWizardCustomerSearch('');
                        setWizardCustomerResults([]);
                        setWizardCustomerSelectedIndex(0);
                        setWizardStep('customer');
                        setTimeout(() => wizardCustomerInputRef.current?.focus(), 50);
                      }}
                    >
                      Cambiar <small className="opacity-75">(F4)</small>
                    </Button>
                  </div>
                </div>
                {selectedCustomer && !selectedCustomer.name.toLowerCase().includes('cons. final') && (
                  <div className="mt-2">
                    {customerBalance !== null ? (
                      <Badge bg={customerBalance > 0 ? "danger" : customerBalance < 0 ? "success" : "info"} className="p-2 px-3 rounded-pill shadow-sm">
                        {customerBalance > 0 ? (
                          <span className="d-flex align-items-center"><TrendingUp size={14} className="me-1"/> Deuda {selectedCustomer.name}: ${customerBalance.toFixed(2)}</span>
                        ) : customerBalance < 0 ? (
                          <span className="d-flex align-items-center"><TrendingDown size={14} className="me-1"/> Favor {selectedCustomer.name}: ${Math.abs(customerBalance).toFixed(2)}</span>
                        ) : (
                          <span>Cliente: {selectedCustomer.name} (Sin deuda)</span>
                        )}
                      </Badge>
                    ) : (
                      <Button variant="outline-primary" size="sm" onClick={() => fetchCustomerStats(selectedCustomer)}>
                        Consultar Saldo / Deuda
                      </Button>
                    )}
                  </div>
                )}
              </div>

                {paymentSplits.length > 0 && (
                  <div className="mb-4 bg-black bg-opacity-50 p-4 rounded-3 border border-secondary shadow-lg">
                    <div className="small text-info uppercase mb-3 fw-bold border-bottom border-secondary pb-2 d-flex align-items-center gap-2" style={{ letterSpacing: '1px' }}>
                      <ShoppingCart size={16} /> Detalle de Cobertura
                    </div>
                    {paymentSplits.map((s, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-2 fs-6">
                        <div className="d-flex align-items-center gap-2">
                          <Button variant="link" size="sm" className="text-danger p-0 m-0 hover-opacity-75" onClick={() => setPaymentSplits(paymentSplits.filter((_, i) => i !== idx))}>
                            <Trash2 size={16} />
                          </Button>
                          <span className="text-white-50">{s.method}</span>
                        </div>
                        <span className="text-white fw-bold">${s.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <div className="border-top border-secondary mt-3 pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-light opacity-75">Suma de Pagos</span>
                        <span className="text-white fw-bold">${totalAssigned.toFixed(2)}</span>
                      </div>
                      
                      {creditToApply > 0 && (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-light opacity-75">Crédito a Favor (Usado)</span>
                            <span className="text-success fw-bold">-${creditToApply.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-25">
                            <span className="text-info fw-bold">Cobertura Total</span>
                            <span className="text-info fw-bold fs-5">${Math.min(finalTotal, totalAssigned + creditToApply).toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      {cashDiscountApplied > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span className="text-warning">Ahorro Efectivo</span>
                          <span className="text-warning fw-bold">-${cashDiscountApplied.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {paymentSplits.length > 0 &&
                paymentSplits.every((s) => s.method === 'Efectivo') &&
                remaining > 0.01 && (
                  <Alert variant="warning" className="mb-3 py-2 px-3">
                    Pago en efectivo insuficiente: no corresponde descuento por efectivo. Seleccione cliente y combine formas de pago.
                  </Alert>
                )}

              {remaining > 0.01 ? (
                <div className="wizard-input-container">
                  {wizardStep === 'amount' ? (
                    <Form.Group>
                      <Form.Label className="small mb-2 d-block text-center text-light opacity-75 uppercase" style={{ letterSpacing: '1px' }}>
                        Saldo a Completar: <span className="text-white fw-bold">${remaining.toFixed(2)}</span>
                      </Form.Label>
                      <Form.Control
                        ref={wizardInputRef}
                        type="number"
                        className="form-control-lg bg-dark text-white border-primary border-2 text-center fs-1 py-3"
                        value={wizardAmount}
                        onChange={(e) => setWizardAmount(e.target.value)}
                        placeholder="0.00"
                        autoComplete="off"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                      />
                      <div className="mt-3 text-center text-muted small">
                        <Badge bg="secondary" className="me-1">ENTER</Badge> para elegir método
                      </div>
                    </Form.Group>
                  ) : wizardStep === 'customer' ? (
                    <div className="animate__animated animate__fadeIn">
                      <h4 className="text-center mb-3">Buscar Cliente para el Ticket</h4>
                      <Form.Control
                        ref={wizardCustomerInputRef}
                        type="text"
                        placeholder="Nombre del cliente..."
                        className="bg-dark text-white border-primary mb-3"
                        value={wizardCustomerSearch}
                        onChange={(e) => handleWizardCustomerSearch(e.target.value)}
                        onKeyDown={handleWizardCustomerKeyDown}
                        autoComplete="off"
                        autoFocus
                      />
                      {wizardCustomerResults.length > 0 ? (
                        <ListGroup className="mb-3">
                          {wizardCustomerResults.map((c, idx) => (
                            <ListGroup.Item
                              key={c.id}
                              action
                              className={`${wizardCustomerSelectedIndex === idx ? 'bg-primary text-white' : 'bg-dark text-white border-secondary'}`}
                              onClick={() => selectCustomerFromWizard(c)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{c.name}</span>
                                <Badge bg="info">ENTER</Badge>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : wizardCustomerSearch.length > 2 ? (
                        <div className="text-center text-muted mb-3 small">No se encontraron clientes</div>
                      ) : null}
                      <div className="text-center d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            const defaultCustomer = customers.find(c =>
                              c.name.toLowerCase().includes('cons. final') ||
                              c.name.toLowerCase().includes('consumidor final')
                            );
                            if (defaultCustomer) {
                              selectCustomer(defaultCustomer);
                              setWizardStep('method');
                              setTimeout(() => wizardInputRef.current?.focus(), 50);
                            } else {
                              toast.error('No se encontró el cliente Cons. Final');
                            }
                          }}
                        >
                          Usar Cons. Final
                        </Button>
                        <Button variant="link" className="text-muted small" onClick={() => setWizardStep('method')}>
                          [ESC] Volver a métodos
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center animate__animated animate__fadeIn">
                      <h4 className="mb-3">¿Cómo se pagaron los <span className="text-primary">${parseFloat(wizardAmount).toFixed(2)}</span>?</h4>
                      <div className="d-grid gap-2">
                        <Button variant="outline-light" className="text-start py-3 fs-5 d-flex justify-content-between" onClick={() => addWizardPayment('Efectivo')}>
                          <span>💵 Efectivo <small className="opacity-50">(ENTER)</small></span>
                          <Badge bg="primary">1</Badge>
                        </Button>
                        <Button variant="outline-light" className="text-start py-3 fs-5 d-flex justify-content-between" onClick={() => addWizardPayment('MP')}>
                          <span>📱 Mercado Pago</span>
                          <Badge bg="primary">2</Badge>
                        </Button>
                        <Button variant="outline-light" className="text-start py-3 fs-5 d-flex justify-content-between" onClick={() => addWizardPayment('Transferencia')}>
                          <span>🏦 Transferencia</span>
                          <Badge bg="primary">3</Badge>
                        </Button>
                        <Button variant="outline-light" className="text-start py-3 fs-5 d-flex justify-content-between" onClick={() => addWizardPayment('Cta Cte')}>
                          <span>💳 Cuenta Corriente</span>
                          <Badge bg="primary">4</Badge>
                        </Button>
                      </div>
                      <Button variant="link" className="text-muted mt-3 small" onClick={() => setWizardStep('amount')}>
                        [ESC] Volver a monto
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 animate__animated animate__pulse animate__infinite">
                  <div className="mb-4">
                    <Badge bg="success" className="fs-5 p-3 px-4 rounded-pill">✓ PAGO COMPLETADO</Badge>
                  </div>
                  {remaining < -0.01 && (
                    <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25">
                      <h6 className="text-warning uppercase small mb-1">Vuelto a entregar (Exceso Efectivo)</h6>
                      <h1 className="display-4 fw-bold text-warning">${Math.abs(remaining).toFixed(2)}</h1>
                      <div className="small text-warning opacity-75 mt-1">Los pagos electrónicos se limitaron al saldo pendiente.</div>
                    </div>
                  )}
                  <Button variant="primary" size="lg" className="w-100 py-3 fs-3 fw-bold shadow-lg" onClick={() => { handleCheckout(); setShowPaymentWizard(false); }}>
                    FINALIZAR VENTA [ENTER]
                  </Button>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
              <Button variant="secondary" onClick={() => setShowPaymentWizard(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>
        );
      })()}
    </div>
  );
};

export default Sales;
