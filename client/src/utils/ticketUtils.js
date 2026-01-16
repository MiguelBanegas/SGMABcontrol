import { toast } from "react-hot-toast";

/**
 * Formatea los datos de una venta en un string optimizado para WhatsApp.
 * @param {Object} sale - Los datos de la venta.
 * @returns {string} - El ticket formateado.
 */
export const formatTicketAsText = (sale) => {
  if (!sale) return "";

  const dateStr = new Date(sale.created_at).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  let message = `*SGMAB CONTROL*\n`;
  message += `_Comercio & Gestión_\n`;
  message += `--------------------------\n`;
  message += `*Fecha:* ${dateStr}\n`;
  message += `*Vendedor:* ${sale.seller_name}\n`;
  message += `*Cliente:* ${sale.customer_name || "Cons. Final"}\n`;
  message += `--------------------------\n`;
  message += `*Items:*\n`;

  message += "```\n";
  message += "Cant  Descripción              Subtot\n";

  sale.items.forEach((item) => {
    const isWeight = item.sell_by_weight == 1 || item.sell_by_weight === true;
    const qty = isWeight
      ? Number(item.quantity).toFixed(3)
      : Math.floor(item.quantity).toString();

    // Truncar nombre para que entre en la columna (WhatsApp móvil suele tener poco ancho)
    const name = item.product_name.substring(0, 24).padEnd(24);
    const subtotal = Number(item.subtotal).toFixed(2).padStart(7);

    message += `${qty.padEnd(5)} ${name} $${subtotal}\n`;
  });
  message += "```\n";

  message += `--------------------------\n`;
  if (Number(sale.cash_discount) > 0) {
    message += `*Desc. Efectivo:* -$${Number(sale.cash_discount).toFixed(2)}\n`;
  }
  message += `*TOTAL: $${Number(sale.total).toFixed(2)}*\n`;
  message += `--------------------------\n`;
  message += `¡Gracias por su compra!\n`;
  message += `_ID: ${sale.id.toUpperCase().substring(0, 8)}_`;

  return message;
};

/**
 * Comparte el ticket formateado vía WhatsApp.
 * @param {Object} sale - Los datos de la venta.
 */
export const shareTicketViaWhatsApp = async (sale) => {
  const text = formatTicketAsText(sale);

  // Usamos el protocolo 'whatsapp://' en lugar de 'https://wa.me/' para intentar abrir la aplicación
  // instalada directamente y evitar la ventana de WhatsApp Web.
  let whatsappUrl = "whatsapp://send";

  if (sale.customer_phone) {
    const cleanPhone = sale.customer_phone.replace(/\D/g, "");
    whatsappUrl += `?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  } else {
    whatsappUrl += `?text=${encodeURIComponent(text)}`;
  }

  window.open(whatsappUrl, "_blank");
};
