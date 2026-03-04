// ===============================================
// ARCHIVO: src/services/tablaPosicionesService.js
// Servicio para gestionar tablas de posiciones
// ===============================================

import { API_BASE, request } from './api.config';

export const tablaPosicionesService = {
  // --- CRUD BÁSICO ---
  getAll: () => request(`${API_BASE}/tabla-posiciones`),

  getAllIncludingInactive: () => request(`${API_BASE}/tabla-posiciones/todas`),

  getById: (id) => request(`${API_BASE}/tabla-posiciones/${id}`),

  create: (data) =>
    request(`${API_BASE}/tabla-posiciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`${API_BASE}/tabla-posiciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`${API_BASE}/tabla-posiciones/${id}`, {
      method: 'DELETE',
    }),

  // --- CONSULTAS ESPECÍFICAS ---
  getPorCampeonato: (id_campeonato) =>
    request(`${API_BASE}/tabla-posiciones/campeonato/${id_campeonato}`),

  getPorCampeonatoCategoria: (id_campeonato, id_categoria) =>
    request(
      `${API_BASE}/tabla-posiciones/campeonato/${id_campeonato}/categoria/${id_categoria}`
    ),

  getPosicionEquipo: (id_campeonato, id_categoria, id_equipo) =>
    request(
      `${API_BASE}/tabla-posiciones/campeonato/${id_campeonato}/categoria/${id_categoria}/equipo/${id_equipo}`
    ),

  getTopEquipos: (id_campeonato, id_categoria, limite = 5) =>
    request(
      `${API_BASE}/tabla-posiciones/campeonato/${id_campeonato}/categoria/${id_categoria}/top?limite=${limite}`
    ),
};
