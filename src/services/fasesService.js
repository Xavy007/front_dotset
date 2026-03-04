// ===============================================
// ARCHIVO: src/services/fasesService.js
// Servicio para gestionar fases de campeonatos
// ===============================================

import { API_BASE, request } from './api.config';

export const fasesService = {
  // --- CRUD BÁSICO ---
  getAll: () => request(`${API_BASE}/fases`),

  getAllIncludingInactive: () => request(`${API_BASE}/fases/todas`),

  getById: (id) => request(`${API_BASE}/fases/${id}`),

  create: (data) =>
    request(`${API_BASE}/fases`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`${API_BASE}/fases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`${API_BASE}/fases/${id}`, {
      method: 'DELETE',
    }),

  // --- CONSULTAS ESPECÍFICAS ---
  getPorCampeonatoCategoria: (id_cc) =>
    request(`${API_BASE}/fases/campeonato-categoria/${id_cc}`),

  getPorTipo: (tipo) => request(`${API_BASE}/fases/tipo/${tipo}`),

  getPorEstado: (estado) => request(`${API_BASE}/fases/estado/${estado}`),

  // --- ACCIONES ---
  cambiarEstado: (id, estado) =>
    request(`${API_BASE}/fases/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ f_estado: estado }),
    }),
};
