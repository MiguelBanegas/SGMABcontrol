import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Ticket = React.forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  const totalItemSavings = sale.items.reduce((acc, item) => acc + Number(item.discount_amount), 0);
  const totalLista = sale.items.reduce((acc, item) => acc + (Number(item.subtotal) + Number(item.discount_amount)), 0);

  return (
    <div ref={ref} className="ticket-print-area" style={{ 
      width: '80mm', 
      padding: '8mm 5mm', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: '11px',
      lineHeight: '1.2'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>SGMAB CONTROL</h1>
        <p style={{ margin: '2px 0', fontSize: '12px', opacity: 0.8 }}>Comercio & Gestión</p>
        <div style={{ borderBottom: '1px solid #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span><b>Fecha:</b> {format(new Date(sale.created_at), "dd/MM/yyyy hh:mm a", { locale: es })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span><b>Vendedor:</b> {sale.seller_name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><b>Cliente:</b> {sale.customer_name || 'Cons. Final'}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1.5px solid #000', marginBottom: '8px' }}></div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Cant</th>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Descripción</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Importe</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '11px' }}>
          {sale.items.map((item, idx) => {
            const totalItemLista = Number(item.subtotal) + Number(item.discount_amount);
            const unitListPrice = totalItemLista / Number(item.quantity);
            const isWeight = item.sell_by_weight == 1 || item.sell_by_weight === true;

            return (
              <tr key={idx} style={{ borderTop: idx > 0 ? '0.5px dashed #ccc' : 'none' }}>
                <td style={{ verticalAlign: 'top', paddingTop: '6px', width: '40px' }}>
                  {isWeight ? item.quantity : Math.floor(item.quantity)}
                </td>
                <td style={{ verticalAlign: 'top', paddingTop: '6px', paddingRight: '5px' }}>
                  <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                  
                  <div style={{ fontSize: '9.5px', marginTop: '2px', color: '#444' }}>
                    <b>@ ${unitListPrice.toFixed(2)}</b> {isWeight ? '/Kg' : 'x unid.'}
                  </div>

                  {item.promo_type && item.promo_type !== 'none' && (
                    <div style={{ fontSize: '8.5px', color: '#198754', fontWeight: 'bold', marginTop: '1px' }}>
                      {item.promo_type === 'quantity' && `Promo ${item.promo_buy}x${item.promo_pay} aplicada`}
                      {item.promo_type === 'price' && `Precio de Oferta`}
                      {item.promo_type === 'both' && `Promo ${item.promo_buy}x${item.promo_pay} + Oferta`}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '6px' }}>
                  {item.discount_amount > 0 && (
                    <div style={{ fontSize: '9px', color: '#999', textDecoration: 'line-through' }}>
                      ${(totalItemLista).toFixed(2)}
                    </div>
                  )}
                  <div style={{ fontWeight: '700' }}>${Number(item.subtotal).toFixed(2)}</div>
                  {item.discount_amount > 0 && (
                    <div style={{ fontSize: '8.5px', color: '#198754', fontWeight: '600' }}>
                      (-${Number(item.discount_amount).toFixed(2)})
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '1.5px solid #000', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.7 }}>
          <span>Suma de productos:</span>
          <span>${totalLista.toFixed(2)}</span>
        </div>

        {totalItemSavings > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#d00', fontWeight: '500' }}>
            <span>Ahorros aplicados:</span>
            <span>-${totalItemSavings.toFixed(2)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '600', borderTop: '0.5px solid #eee', paddingTop: '4px' }}>
          <span>SUBTOTAL:</span>
          <span>${Number(sale.subtotal).toFixed(2)}</span>
        </div>

        {Number(sale.cash_discount) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#198754' }}>
            <span>Desc. Efectivo:</span>
            <span>-${Number(sale.cash_discount).toFixed(2)}</span>
          </div>
        )}

        <div style={{ 
          marginTop: '10px', 
          padding: '8px 0', 
          borderTop: '2px solid #000', 
          borderBottom: '2px solid #000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '900' }}>TOTAL A PAGAR:</span>
          <span style={{ fontSize: '18px', fontWeight: '900' }}>${Number(sale.total).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', padding: '6px', backgroundColor: '#f8f9fa', border: '1px solid #eee', borderRadius: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Bultos: {sale.items.reduce((sum, item) => {
          const isWeight = item.sell_by_weight === true || item.sell_by_weight == 1;
          return sum + (isWeight ? 1 : parseFloat(item.quantity));
        }, 0)}</span>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10px', textAlign: 'right' }}>
        <i>Medio de Pago: <b>{sale.payment_method || 'Efectivo'}</b></i>
      </div>

      <div style={{ textAlign: 'center', marginTop: '25px' }}>
        <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: '600' }}>¡Gracias por confiar en nosotros!</p>
        <p style={{ margin: '4px 0', fontSize: '8px', opacity: 0.5 }}>COMPROBANTE NO VÁLIDO COMO FACTURA</p>
        <p style={{ margin: '2px 0', fontSize: '8px', opacity: 0.5 }}>ID: {sale.id.toUpperCase()}</p>
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
