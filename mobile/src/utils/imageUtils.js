/**
 * Normaliza la URL de una imagen de producto.
 * Maneja casos donde la URL ya tiene /uploads/ o es externa.
 * @param {string} url - La URL o path de la imagen almacenada en DB
 * @returns {string} - La URL correcta para el src de la imagen
 */
import { getApiUrl } from "./config";

export const getImageUrl = (url) => {
  if (!url) return null;

  // Si ya es una URL completa (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const apiBase = getApiUrl();
  // Quitar /api del final si existe, ya que las imagenes estan en /uploads (root)
  const serverBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  // Si ya empieza con /uploads
  if (url.startsWith("/uploads/")) {
    return `${serverBase}${url}`;
  }

  // Si es solo el nombre del archivo
  return `${serverBase}/uploads/${url}`;
};
