// ===============================================
// ARCHIVO: src/services/campeonatoService.js
// ===============================================

import { API_BASE } from './api.config.js';

// Función genérica para manejar respuestas
async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP ${res.status}`);
  }
  // Si es un delete exitoso (204), retornamos null
  if (res.status === 204) return null;
  return res.json();
}

export const campeonatoService = {
  // --- CAMPEONATOS ---
  getAll: () => request(`${API_BASE}/campeonato`),

  getById: (id) => request(`${API_BASE}/campeonato/${id}`),

  create: (data) => request(`${API_BASE}/campeonato`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`${API_BASE}/campeonato/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  delete: (id) => request(`${API_BASE}/campeonato/${id}`, {
    method: 'DELETE',
  }),

  // --- CAMPEONATOS POR GESTION ---
  getByGestion: (id_gestion) => request(`${API_BASE}/campeonato/gestion/${id_gestion}`),

  // --- CAMPEONATOS POR TIPO ---
  getByTipo: (tipo) => request(`${API_BASE}/campeonato/tipo/${tipo}`),

  // --- CAMPEONATOS ACTIVOS ---
  getActivos: () => request(`${API_BASE}/campeonato/activos`),

  // --- CAMPEONATOS POR ESTADO ---
  getByEstado: (estado) => request(`${API_BASE}/campeonato/estado/${estado}`),

  // --- GESTION CAMPEONATO (años/gestiones) ---
  getAllGestiones: () => request(`${API_BASE}/gestion`),

  getGestionById: (id) => request(`${API_BASE}/gestion/${id}`),

  createGestion: (data) => request(`${API_BASE}/gestion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  updateGestion: (id, data) => request(`${API_BASE}/gestion/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  deleteGestion: (id) => request(`${API_BASE}/gestion/${id}`, {
    method: 'DELETE',
  }),
};
