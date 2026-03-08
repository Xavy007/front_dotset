// ===============================================
// ARCHIVO: src/services/api.config.js
// Configuración base para todos los servicios
// ===============================================

// URL base de la API desde variables de entorno
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

      // Si es 401 (no autorizado), redirigir a login
      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        window.location.href = '/';
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
