// ===============================================
// ARCHIVO: src/services/gruposService.js
// Servicio para gestionar grupos de campeonatos
// ===============================================

import { API_BASE, request } from './api.config';

export const gruposService = {
  // --- CRUD BÁSICO ---
  getAll: () => request(`${API_BASE}/grupos`),

  getAllIncludingInactive: () => request(`${API_BASE}/grupos/todos`),

  getById: (id) => request(`${API_BASE}/grupos/${id}`),

  create: (data) =>
    request(`${API_BASE}/grupos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`${API_BASE}/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`${API_BASE}/grupos/${id}`, {
      method: 'DELETE',
    }),

  // --- CONSULTAS ESPECÍFICAS ---
  getPorCampeonatoCategoria: (id_cc) =>
    request(`${API_BASE}/grupos/campeonato-categoria/${id_cc}`),

  getPorFase: (id_fase) => request(`${API_BASE}/grupos/fase/${id_fase}`),

  getPorClave: (id_cc, clave) =>
    request(`${API_BASE}/grupos/clave/${id_cc}/${clave}`),
};
