/**
 * Utilidad para descubrir automáticamente el servidor SGM en la red local
 * Útil en redes corporativas donde mDNS está bloqueado
 */

/**
 * Intenta conectar con una IP específica para verificar si es el servidor SGM
 * @param {string} ip - Dirección IP a probar
 * @param {number} port - Puerto del servidor
 * @param {number} timeout - Tiempo máximo de espera en ms
 * @returns {Promise<object|null>} Información del servidor o null si falla
 */
const tryServer = async (ip, port = 5051, timeout = 1000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`http://${ip}:${port}/api/server-info`, {
      signal: controller.signal,
      mode: "cors",
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { ...data, discoveredIp: ip };
    }
  } catch (error) {
    // Ignorar errores de conexión
  }
  return null;
};

/**
 * Escanea un rango de IPs en la red local buscando el servidor SGM
 * @param {string} baseIp - IP base (ej: "192.168.1")
 * @param {number} start - Inicio del rango (ej: 1)
 * @param {number} end - Fin del rango (ej: 254)
 * @param {number} port - Puerto del servidor
 * @returns {Promise<object|null>} Información del servidor encontrado o null
 */
export const scanNetwork = async (
  baseIp,
  start = 1,
  end = 254,
  port = 5051
) => {
  console.log(`🔍 Escaneando red ${baseIp}.${start}-${end}:${port}...`);

  // Crear array de IPs a escanear
  const ips = [];
  for (let i = start; i <= end; i++) {
    ips.push(`${baseIp}.${i}`);
  }

  // Escanear en lotes de 20 para no saturar la red
  const batchSize = 20;
  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    const promises = batch.map((ip) => tryServer(ip, port));
    const results = await Promise.all(promises);

    // Si encontramos el servidor, retornarlo inmediatamente
    const found = results.find((r) => r !== null);
    if (found) {
      console.log(`✅ Servidor encontrado en ${found.discoveredIp}:${port}`);
      return found;
    }
  }

  console.log("❌ No se encontró el servidor en la red");
  return null;
};

/**
 * Detecta la red local del cliente y escanea en busca del servidor
 * @returns {Promise<object|null>} Información del servidor o null
 */
export const autoDiscoverServer = async () => {
  // Intentar obtener la IP local del cliente para determinar la red
  // Esto es una aproximación, ya que no podemos obtener la IP real del cliente desde JS

  // Redes privadas comunes
  const commonNetworks = [
    "192.168.1",
    "192.168.0",
    "192.168.100",
    "10.0.0",
    "172.16.0",
  ];

  for (const network of commonNetworks) {
    const result = await scanNetwork(network, 1, 50); // Escanear solo primeras 50 IPs
    if (result) {
      return result;
    }
  }

  return null;
};

/**
 * Verifica si el servidor guardado sigue siendo válido
 * @param {string} serverUrl - URL del servidor guardada
 * @returns {Promise<boolean>} true si el servidor responde
 */
export const verifyServer = async (serverUrl) => {
  try {
    const response = await fetch(`${serverUrl}/api/server-info`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
};
