const getServerUrl = () => {
  // En desarrollo, priorizamos el .env sobre localStorage
  if (import.meta.env.DEV) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
  }

  // Si no estamos en desarrollo o no hay .env, usamos localStorage
  const savedUrl = localStorage.getItem("SERVER_URL");
  if (savedUrl) return savedUrl;

  // En desarrollo (Vite), fallback por defecto
  if (import.meta.env.DEV) {
    return "http://localhost:5051";
  }

  // En producción, usamos el origen actual (dominio o IP)
  return window.location.origin;
};

const getApiUrl = () => {
  return getServerUrl();
};

const setServerUrl = (url) => {
  if (!url) {
    localStorage.removeItem("SERVER_URL");
  } else {
    // Asegurar que no termine en /
    const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    localStorage.setItem("SERVER_URL", cleanUrl);
  }
};

export { getServerUrl, getApiUrl, setServerUrl };
