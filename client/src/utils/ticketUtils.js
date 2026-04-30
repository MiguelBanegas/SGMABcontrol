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

  let message = `*Proveeduria MAR FRANK*\n`;
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

  // Intentamos abrir la aplicación instalada directamente o usar wa.me como fallback robusto
  let whatsappUrl = "";

  if (sale.customer_phone) {
    // 1. Limpiar todo lo que no sea número
    let cleanPhone = sale.customer_phone.replace(/\D/g, "");

    // 2. Lógica para Argentina: si tiene 10 dígitos (ej: 1130863418)
    // se le debe anteponer el código de país 54 y el 9 (requerido por WA para móviles)
    if (cleanPhone.length === 10) {
      cleanPhone = "549" + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("15")) {
      // Caso 15 + 9 dígitos
      cleanPhone = "549" + cleanPhone.substring(2);
    } else if (cleanPhone.startsWith("9") && cleanPhone.length === 11) {
      // Ya tiene el 9 pero no el 54
      cleanPhone = "54" + cleanPhone;
    }

    // Usar wa.me que es universalmente compatible y maneja mejor el fallback entre app y web
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  } else {
    // Si no hay teléfono, compartir texto plano (abrirá selector de contactos en móvil)
    whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  window.open(whatsappUrl, "_blank");
};
