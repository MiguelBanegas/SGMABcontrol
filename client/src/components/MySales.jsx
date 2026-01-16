import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Collapse, Spinner } from 'react-bootstrap';
import { Receipt, ChevronDown, ChevronUp, Printer, Edit, Share2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';
import { db } from '../db/localDb';
import { shareTicketViaWhatsApp } from '../utils/ticketUtils';
import CustomerModal from './CustomerModal';

function MySales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [pendingWhatsAppSale, setPendingWhatsAppSale] = useState(null);

  useEffect(() => {
    loadSales(currentPage);
  }, [currentPage]);

  useEffect(() => {
    socket.on('sales_updated', () => loadSales(currentPage));
    return () => socket.off('sales_updated');
  }, [currentPage]);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const customers = await db.customers.toArray();
        setAllCustomers(customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchAllCustomers();
  }, []);

  const handleCustomerUpdate = async () => {
    try {
      const customers = await db.customers.toArray();
      setAllCustomers(customers);

      // Si estábamos esperando el teléfono para enviar WhatsApp
      if (customerToEdit && pendingWhatsAppSale) {
        const updated = customers.find(c => c.id === customerToEdit.id);
        if (updated && updated.phone) {
          // Actualizamos los datos de la venta con el nuevo teléfono antes de enviar
          const saleToSend = { 
            ...pendingWhatsAppSale, 
            customer_phone: updated.phone,
            seller_name: pendingWhatsAppSale.seller_name || user?.username || 'Vendedor'
          };
          await shareTicketViaWhatsApp(saleToSend);
          setPendingWhatsAppSale(null);
          
          // También refrescamos la lista de ventas localmente si es necesario
          // (Aunque el servidor ya debería tener el cambio si se grabó, 
          // pero el objeto 'sale' que tenemos podría estar viejo)
          loadSales(currentPage);
        }
      }
      setCustomerToEdit(null);
    } catch (error) {
      console.error('Error in handleCustomerUpdate:', error);
    }
  };

  const handleWhatsAppClick = async (sale) => {
    const customerId = sale.customer_id;
    const hasPhone = sale.customer_phone;
    
    if (!hasPhone && customerId) {
      const customer = allCustomers.find(c => c.id === customerId);
      if (customer && !customer.name.toLowerCase().includes('cons. final')) {
        setCustomerToEdit(customer);
        setPendingWhatsAppSale(sale);
        setShowCustomerModal(true);
        return;
      }
    }

    const saleWithSeller = { 
      ...sale, 
      seller_name: sale.seller_name || user?.username || 'Vendedor' 
    };

    try {
      await shareTicketViaWhatsApp(saleWithSeller);
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar WhatsApp');
    }
  };

  const loadSales = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sales/my-sales?page=${page}&perPage=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data.sales);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const printTicket = (sale) => {
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
          <p style="margin: 2px 0;"><b>Fecha:</b> ${new Date(sale.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 2px 0;"><b>Vendedor:</b> ${user?.username || 'Vendedor'}</p>
          <p style="margin: 2px 0;"><b>Cliente:</b> ${sale.customer_name || 'Cons. Final'}</p>
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
            ${sale.items.map(item => {
              const totalItemLista = Number(item.subtotal) + Number(item.discount_amount);
              const unitPrice = totalItemLista / Number(item.quantity);
              const isWeight = item.sell_by_weight == 1 || item.sell_by_weight === true;

              return `
              <tr>
                <td>${isWeight ? item.quantity : Math.floor(item.quantity)}</td>
                <td style="padding-right: 5px;">
                  <div class="bold">${item.product_name}</div>
                  <div style="font-size: 9.5px; margin-top: 2px; color: #444;">
                    <b>@ $${unitPrice.toFixed(2)}</b> ${isWeight ? '/Kg' : 'x unid.'}
                  </div>
                  ${item.promo_type && item.promo_type !== 'none' ? `<div style="font-size: 8.5px; color: #198754; font-weight: bold; margin-top: 1px;">
                    ${item.promo_type === 'quantity' ? `Promo ${item.promo_buy}x${item.promo_pay} aplicada` : 
                      item.promo_type === 'price' ? `Precio de Oferta` : 
                      `Promo ${item.promo_buy}x${item.promo_pay} + Oferta`}
                  </div>` : ''}
                </td>
                <td class="right">
                  ${item.discount_amount > 0 ? `<div style="font-size: 9px; color: #999; text-decoration: line-through;">$${totalItemLista.toFixed(2)}</div>` : ''}
                  <div class="bold">$${Number(item.subtotal).toFixed(2)}</div>
                  ${item.discount_amount > 0 ? `<div style="font-size: 8.5px; color: #198754; font-weight: 600;">(-$${Number(item.discount_amount).toFixed(2)})</div>` : ''}
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <div style="border-top: 1.5px solid black; padding-top: 8px;">
          <div class="summary-item" style="opacity: 0.7;">
            <span>Suma de productos:</span>
            <span>$${(Number(sale.subtotal) + sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0)).toFixed(2)}</span>
          </div>

          ${sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0) > 0 ? `
            <div class="summary-item" style="color: #d00; font-weight: 500;">
              <span>Ahorros aplicados:</span>
              <span>-$${sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0).toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="summary-item" style="font-weight: 600; border-top: 0.5px solid #eee; padding-top: 4px;">
            <span>SUBTOTAL:</span>
            <span>$${Number(sale.subtotal).toFixed(2)}</span>
          </div>

          ${Number(sale.cash_discount) > 0 ? `
            <div class="summary-item" style="color: #198754;">
              <span>Desc. Efectivo:</span>
              <span>-$${Number(sale.cash_discount).toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="total-box">
            <span style="font-size: 13px; font-weight: 900;">TOTAL A PAGAR:</span>
            <span style="font-size: 18px; font-weight: 900;">$${Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="center" style="margin-top: 12px; padding: 6px; background: #f8f9fa; border: 1px solid #eee; border-radius: 4px;">
          <span style="font-size: 10px; font-weight: 700; uppercase">Bultos: ${sale.items.reduce((sum, item) => {
            const isW = item.sell_by_weight === true || item.sell_by_weight == 1;
            return sum + (isW ? 1 : parseFloat(item.quantity));
          }, 0)}</span>
        </div>

        <div class="right" style="font-size: 10px; margin-top: 10px;">
          <i>Medio de Pago: <b>${sale.payment_method || 'Efectivo'}</b></i>
        </div>
        
        <div class="center" style="margin-top: 25px;">
          <p style="margin: 2px 0; font-size: 11px; font-weight: 600;">¡Gracias por confiar en nosotros!</p>
          <p style="margin: 4px 0; font-size: 8px; opacity: 0.5;">COMPROBANTE NO VÁLIDO COMO FACTURA</p>
          <p style="margin: 2px 0; font-size: 8px; opacity: 0.5;">ID: ${sale.id.toUpperCase()}</p>
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-primary text-white d-flex align-items-center gap-2">
          <Receipt size={24} />
          <h4 className="mb-0">Mis Ventas</h4>
        </Card.Header>
        <Card.Body>
          {sales.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Receipt size={48} className="mb-3 opacity-25" />
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th className="text-end">Total</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <React.Fragment key={sale.id}>
                    <tr>
                      <td>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                        >
                          {expandedSale === sale.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      </td>
                      <td>
                        {new Date(sale.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td>{sale.customer_name || 'Anónimo'}</td>
                      <td>
                        <Badge bg="secondary">{sale.items.length} productos</Badge>
                      </td>
                      <td className="text-end fw-bold">${sale.total}</td>
                      <td>
                        <Badge bg={sale.status === 'completado' ? 'success' : 'warning'}>
                          {sale.status === 'completado' ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => printTicket(sale)}
                          >
                            <Printer size={16} className="me-1" />
                            Reimprimir
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            title="Enviar por WhatsApp"
                            onClick={() => handleWhatsAppClick(sale)}
                          >
                            <Share2 size={16} />
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            title="Editar Venta"
                            onClick={() => navigate('/ventas', { state: { editSale: sale } })}
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="p-0">
                        <Collapse in={expandedSale === sale.id}>
                          <div className="bg-light p-3">
                            <h6 className="mb-3">Detalle de productos:</h6>
                            <Table size="sm" className="mb-0">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th className="text-center">Cantidad</th>
                                  <th className="text-end">Precio Unit.</th>
                                  <th className="text-end">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map((item, idx) => (
                                  <tr key={idx}>
                                     <td>
                                      {item.product_name}
                                      {item.promo_type && item.promo_type !== 'none' && (
                                        <div className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>
                                          {item.promo_type === 'quantity' && `Promo ${item.promo_buy}x${item.promo_pay}`}
                                          {item.promo_type === 'price' && `Precio Oferta`}
                                          {item.promo_type === 'both' && `Promo ${item.promo_buy}x${item.promo_pay} + Oferta`}
                                        </div>
                                      )}
                                    </td>
                                     <td className="text-center">{item.quantity} {(item.sell_by_weight == 1 || item.sell_by_weight === true) ? 'Kg' : ''}</td>
                                    <td className="text-end">
                                      {item.discount_amount > 0 && (
                                        <div className="text-muted x-small text-decoration-line-through" style={{ fontSize: '0.7rem' }}>
                                          ${((Number(item.subtotal) + Number(item.discount_amount))).toFixed(2)}
                                        </div>
                                      )}
                                      <div className="fw-bold">
                                        ${Number(item.subtotal).toFixed(2)}
                                      </div>
                                      {(item.sell_by_weight == 1 || item.sell_by_weight === true) && (
                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>@ ${(Number(item.subtotal) / Number(item.quantity)).toFixed(2)}/kg</div>
                                      )}
                                    </td>
                                    <td className="text-end">
                                      ${item.subtotal}
                                      {item.discount_amount > 0 && (
                                        <div className="x-small text-success" style={{ fontSize: '0.7rem' }}>Ahorro: -${Number(item.discount_amount).toFixed(2)}</div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                            <div className="mt-2 text-end d-flex flex-column align-items-end">
                              <div className="opacity-75 small">Total Lista: ${Number(sale.subtotal + sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0)).toFixed(2)}</div>
                              {sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0) > 0 && (
                                <div className="text-danger small fw-bold">Ahorro en Promos: -${sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) || 0), 0).toFixed(2)}</div>
                              )}
                              <div className="opacity-75 small border-top pt-1 mt-1">Subtotal: ${Number(sale.subtotal).toFixed(2)}</div>
                              {Number(sale.cash_discount) > 0 && (
                                <div className="text-success small">Desc. Efectivo: -${Number(sale.cash_discount).toFixed(2)}</div>
                              )}
                              <div className="fw-bold h5">TOTAL: ${Number(sale.total).toFixed(2)}</div>
                              <div className="bg-primary bg-opacity-10 rounded px-3 py-1 mt-2 text-primary fw-bold">
                                Cantidad de Productos: {sale.items.reduce((sum, item) => sum + (item.sell_by_weight ? 1 : parseFloat(item.quantity)), 0)}
                              </div>
                              <div className="small mt-1 text-muted">Método: {sale.payment_method || 'Efectivo'}</div>
                            </div>
                          </div>
                        </Collapse>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          )}
          
          {/* Controles de paginación */}
          {sales.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Mostrando {sales.length} de {total} ventas (máximo 100)
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <span className="align-self-center px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      <CustomerModal
        show={showCustomerModal}
        handleClose={() => {
          setShowCustomerModal(false);
          setPendingWhatsAppSale(null);
        }}
        refreshCustomers={handleCustomerUpdate}
        editCustomer={customerToEdit}
      />
    </div>
  );
}

export default MySales;
