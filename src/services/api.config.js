// ===============================================
// ARCHIVO: src/services/api.config.js
// Configuración base para todos los servicios
// ===============================================

// URL base de la API desde variables de entorno
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

let isRefreshing = false;
let refreshQueue = []; // peticiones en espera mientras se refresca

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  refreshQueue = [];
};

const tryRefresh = async () => {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // envía la cookie refresh_token
  });
  if (!res.ok) throw new Error('refresh_failed');
  const data = await res.json();
  sessionStorage.setItem('token', data.token);
  return data.token;
};

// Timeout para las peticiones
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

/**
 * Función genérica para manejar peticiones HTTP
 * @param {string} url - URL completa del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise} - Promesa con los datos de respuesta
 */
export async function request(url, options = {}) {
  // Obtener token de autenticación si existe
  const token = sessionStorage.getItem('token');

  // Configurar headers por defecto
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Agregar token si existe
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Si es FormData, no establecer Content-Type (el navegador lo hace automáticamente)
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  // Combinar headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Crear controlador de timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include', // Para enviar cookies
    });

    clearTimeout(timeoutId);

    // Manejar errores HTTP
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));

      // 401 — intentar refrescar el access token antes de redirigir al login
      if (res.status === 401) {
        if (isRefreshing) {
          // Ya hay un refresh en curso: encolar esta petición
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          }).then((newToken) => {
            options.headers = { ...options.headers, Authorization: `Bearer ${newToken}` };
            return fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${newToken}` }, signal: controller.signal });
          });
        }

        isRefreshing = true;
        try {
          const newToken = await tryRefresh();
          processQueue(null, newToken);
          // Reintentar la petición original con el nuevo token
          clearTimeout(timeoutId);
          const retryRes = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
          });
          if (!retryRes.ok) throw new Error(`Error HTTP ${retryRes.status}`);
          return retryRes.status === 204 ? null : retryRes.json();
        } catch {
          processQueue(new Error('session_expired'));
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('usuario');
          window.location.href = '/';
        } finally {
          isRefreshing = false;
        }
      }

      throw new Error(errorData.message || `Error HTTP ${res.status}`);
    }

    // Si es un delete exitoso (204), retornar null
    if (res.status === 204) return null;

    // Retornar datos JSON
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Manejar timeout
    if (error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado tiempo');
    }

    throw error;
  }
}

/**
 * Helper para peticiones GET
 */
export const get = (endpoint) => request(`${API_BASE}${endpoint}`);

/**
 * Helper para peticiones POST
 */
export const post = (endpoint, data, isFormData = false) => {
  const body = isFormData ? data : JSON.stringify(data);
  return request(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body,
  });
};

/**
 * Helper para peticiones PUT
 */
export const put = (endpoint, data, isFormData = false) => {
  const body = isFormData ? data : JSON.stringify(data);
  return request(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    body,
  });
};

/**
 * Helper para peticiones PATCH
 */
export const patch = (endpoint, data) =>
  request(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/**
 * Helper para peticiones DELETE
 */
export const del = (endpoint) =>
  request(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
  });
