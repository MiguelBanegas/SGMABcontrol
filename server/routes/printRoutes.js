const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const PENDING_DIR = path.join(__dirname, "../spooler/pending");

router.post("/", async (req, res) => {
  const { sale } = req.body;

  if (!sale) {
    return res.status(400).json({ message: "Datos de venta faltantes" });
  }

  try {
    const ticketHtml = generateTicketHtml(sale);
    const fileName = `ticket_${Date.now()}_${uuidv4().substring(0, 8)}.html`;
    const filePath = path.join(PENDING_DIR, fileName);

    fs.writeFileSync(filePath, ticketHtml);
    res.json({ message: "Ticket enviado a la cola de impresión", fileName });
  } catch (error) {
    console.error("Error al encolar impresión:", error);
    res.status(500).json({ message: "Error al procesar la impresión" });
  }
});

function generateTicketHtml(sale) {
  // Misma lógica de estilo que en Ticket.jsx pero en un string HTML autosuficiente
  const itemsHtml = sale.items
    .map((item) => {
      const totalItemLista =
        Number(item.subtotal) + Number(item.discount_amount);
      const unitListPrice = totalItemLista / Number(item.quantity);
      const isWeight = item.sell_by_weight == 1 || item.sell_by_weight === true;

      return `
      <tr style="border-top: 0.5px dashed #ccc;">
        <td style="vertical-align: top; padding: 6px 0; width: 40px;">
          ${isWeight ? item.quantity : Math.floor(item.quantity)}
        </td>
        <td style="vertical-align: top; padding: 6px 0; padding-right: 5px;">
          <div style="font-weight: 600;">${item.product_name}</div>
          <div style="font-size: 9.5px; margin-top: 2px; color: #444;">
            <b>@ $${unitListPrice.toFixed(2)}</b> ${
        isWeight ? "/Kg" : "x unid."
      }
          </div>
          ${
            item.promo_type && item.promo_type !== "none"
              ? `<div style="font-size: 8.5px; color: #198754; font-weight: bold; margin-top: 1px;">Promo Aplicada</div>`
              : ""
          }
        </td>
        <td style="text-align: right; vertical-align: top; padding: 6px 0;">
          ${
            item.discount_amount > 0
              ? `<div style="font-size: 9px; color: #999; text-decoration: line-through;">$${totalItemLista.toFixed(
                  2
                )}</div>`
              : ""
          }
          <div style="font-weight: 700;">$${Number(item.subtotal).toFixed(
            2
          )}</div>
        </td>
      </tr>
    `;
    })
    .join("");

  const totalLista = sale.items.reduce(
    (acc, item) => acc + (Number(item.subtotal) + Number(item.discount_amount)),
    0
  );
  const totalItemSavings = sale.items.reduce(
    (acc, item) => acc + Number(item.discount_amount),
    0
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          width: 80mm; 
          margin: 0; 
          padding: 5mm;
          font-size: 11px;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="center">
        <h1 style="margin: 0; font-size: 20px;">SGMAB CONTROL</h1>
        <p style="margin: 2px 0; opacity: 0.8;">Comercio & Gestión</p>
        <hr>
      </div>
      <div>
        <p><b>Fecha:</b> ${new Date(sale.created_at).toLocaleString()}</p>
        <p><b>Vendedor:</b> ${sale.seller_name}</p>
        <p><b>Cliente:</b> ${sale.customer_name || "Cons. Final"}</p>
      </div>
      <hr>
      <table>
        <thead>
          <tr style="font-size: 10px; text-transform: uppercase;">
            <th align="left">Cant</th>
            <th align="left">Descripción</th>
            <th align="right">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="border-top: 1.5px solid black; padding-top: 8px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>SUBTOTAL:</span>
          <span>$${Number(sale.subtotal).toFixed(2)}</span>
        </div>
        ${
          Number(sale.cash_discount) > 0
            ? `<div style="display: flex; justify-content: space-between; color: #198754;"><span>Desc. Efectivo:</span><span>-$${Number(
                sale.cash_discount
              ).toFixed(2)}</span></div>`
            : ""
        }
        <div style="margin-top: 10px; padding: 8px 0; border: 2px solid black; display: flex; justify-content: space-between;">
          <span style="font-weight: 900;">TOTAL A PAGAR:</span>
          <span style="font-size: 18px; font-weight: 900;">$${Number(
            sale.total
          ).toFixed(2)}</span>
        </div>
      </div>
      <div class="center" style="margin-top: 20px;">
        <p>¡Gracias por su compra!</p>
      </div>
      <script>
        // No script needed as it will be printed by the backend
      </script>
    </body>
    </html>
  `;
}

module.exports = router;
