/**
 * Normaliza la URL de una imagen de producto.
 * Maneja casos donde la URL ya tiene /uploads/ o es externa.
 * @param {string} url - La URL o path de la imagen almacenada en DB
 * @returns {string} - La URL correcta para el src de la imagen
 */
export const getImageUrl = (url) => {
  if (!url) return null;

  // Si ya es una URL completa (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Si ya empieza con /uploads (caso normal en DB actual)
  if (url.startsWith("/uploads/")) {
    return url; // El proxy de Vite o el servidor Express manejarán esto
  }

  // Si es solo el nombre del archivo (caso legacy o futuro)
  return `/uploads/${url}`;
};
