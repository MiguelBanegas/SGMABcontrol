import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Collapse, Spinner } from 'react-bootstrap';
import { Receipt, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function MySales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadSales(currentPage);
  }, [currentPage]);

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
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 5mm;
            width: 80mm;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .separator { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px 0; }
          th { text-align: left; border-bottom: 1px solid #000; }
          small { font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2 style="margin: 0; font-size: 18px;">SGMAB CONTROL</h2>
          <p style="margin: 2px 0;">Comercio & Gestión</p>
          <p style="margin: 2px 0;">--------------------------------</p>
        </div>
        
        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0;"><b>Fecha:</b> ${new Date(sale.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 2px 0;"><b>Vendedor:</b> ${user?.username || 'Vendedor'}</p>
          <p style="margin: 2px 0;"><b>Cliente:</b> ${sale.customer_name || 'Anónimo'}</p>
        </div>
        
        <p class="separator">--------------------------------</p>
        
        <table>
          <thead>
            <tr>
              <th>Cant</th>
              <th>Producto</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.quantity}</td>
                <td style="padding-right: 5px;">
                  ${item.product_name}
                  ${item.discount_amount > 0 ? '<span style="font-size: 9px; margin-left: 4px;">(PROMO)</span>' : ''}
                  <br/>
                  <small>@ $${item.price_unit}</small>
                </td>
                <td class="right">$${item.subtotal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) * Number(item.quantity)), 0) > 0 ? `
          <div class="right" style="font-size: 11px; color: #333;">
            Su ahorro: $${sale.items.reduce((acc, item) => acc + (Number(item.discount_amount) * Number(item.quantity)), 0).toFixed(2)}
          </div>
        ` : ''}
        
        <p class="separator">--------------------------------</p>
        
        <div class="right" style="font-size: 16px;">
          <b>TOTAL: $${sale.total}</b>
        </div>
        <div class="right" style="font-size: 11px; margin-top: 5px;">
          <i>Pago: ${sale.payment_method || 'Efectivo'}</i>
        </div>
        
        <div class="center" style="margin-top: 20px;">
          <p style="margin: 2px 0; font-size: 10px;">¡Gracias por su compra!</p>
          <p style="margin: 2px 0; font-size: 8px;">ID: ${sale.id.slice(0, 8)}</p>
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
                          minute: '2-digit'
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
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => printTicket(sale)}
                        >
                          <Printer size={16} className="me-1" />
                          Reimprimir
                        </Button>
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
                                    <td>{item.product_name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-end">${item.price_unit}</td>
                                    <td className="text-end">${item.subtotal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                            <div className="mt-2 text-end">
                              <strong>Método de pago:</strong> {sale.payment_method || 'Efectivo'}
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
    </div>
  );
}

export default MySales;
