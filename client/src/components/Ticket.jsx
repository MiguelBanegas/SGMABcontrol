import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Ticket = React.forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  return (
    <div ref={ref} className="ticket-print-area" style={{ 
      width: '80mm', 
      padding: '5mm', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      lineHeight: '1.4'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0', fontSize: '18px' }}>SGMAB CONTROL</h2>
        <p style={{ margin: '2px 0' }}>Comercio & Gestión</p>
        <p style={{ margin: '2px 0' }}>--------------------------------</p>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <p style={{ margin: '2px 0' }}><b>Fecha:</b> {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
        <p style={{ margin: '2px 0' }}><b>Vendedor:</b> {sale.seller_name}</p>
        <p style={{ margin: '2px 0' }}><b>Cliente:</b> {sale.customer_name || 'Anónimo'}</p>
      </div>

      <p style={{ margin: '5px 0' }}>--------------------------------</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid black' }}>
            <th style={{ textAlign: 'left' }}>Cant</th>
            <th style={{ textAlign: 'left' }}>Producto</th>
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ verticalAlign: 'top' }}>{item.quantity}</td>
              <td style={{ verticalAlign: 'top', paddingRight: '5px' }}>
                {item.product_name}
                {item.discount_amount > 0 && <span style={{fontSize: '9px', marginLeft: '4px'}}>(PROMO)</span>}
                <br />
                <small>@ ${item.price_unit}</small>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top' }}>${item.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sale.items.reduce((acc, current) => acc + (Number(current.discount_amount) * Number(current.quantity)), 0) > 0 && (
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#333' }}>
          Su ahorro: ${sale.items.reduce((acc, current) => acc + (Number(current.discount_amount) * Number(current.quantity)), 0).toFixed(2)}
        </div>
      )}

      <p style={{ margin: '5px 0' }}>--------------------------------</p>
      
      <div style={{ textAlign: 'right', fontSize: '16px' }}>
        <b>TOTAL: ${sale.total}</b>
      </div>
      <div style={{ textAlign: 'right', fontSize: '11px', marginTop: '5px' }}>
        <i>Pago: {sale.payment_method || 'Efectivo'}</i>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>¡Gracias por su compra!</p>
        <p style={{ margin: '2px 0', fontSize: '8px' }}>ID: {sale.id.slice(0,8)}</p>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ticket-print-area, .ticket-print-area * { visibility: visible; }
          .ticket-print-area { position: absolute; left: 0; top: 0; width: 80mm !important; }
        }
      `}</style>
    </div>
  );
});

export default Ticket;
