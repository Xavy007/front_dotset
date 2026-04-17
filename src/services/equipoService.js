// ===============================================
// ARCHIVO: src/services/equipoService.js
// ===============================================

import { API_BASE } from './api.config.js';

// Función genérica para manejar respuestas
async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const equipoService = {
  // Obtener todos los equipos
  getAll: () => request(`${API_BASE}/equipo`),

  // Obtener equipo por ID
  getById: (id) => request(`${API_BASE}/equipo/${id}`),

  // Obtener equipos por club
  getByClub: (id_club) => request(`${API_BASE}/equipo/club/${id_club}`),

  // Obtener equipos por categoría
  getByCategoria: (id_categoria) => request(`${API_BASE}/equipo/categoria/${id_categoria}`),

  // Crear equipo
  create: (data) => request(`${API_BASE}/equipo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  // Actualizar equipo
  update: (id, data) => request(`${API_BASE}/equipo/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  // Eliminar equipo
  delete: (id) => request(`${API_BASE}/equipo/${id}`, {
    method: 'DELETE',
  }),
};
