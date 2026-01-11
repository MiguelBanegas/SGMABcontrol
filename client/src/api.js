import axios from "axios";
import { getApiUrl } from "./utils/config";

const api = axios.create({
  baseURL: getApiUrl(),
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
