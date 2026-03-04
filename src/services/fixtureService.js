// src/services/fixtureService.js

import { API_BASE, request } from './api.config';

export const fixtureService = {
  /**
   * Genera fixture automático (preview, no guarda)
   */
  generarFixture: (config) =>
    request(`${API_BASE}/fixture/generar`, {
      method: 'POST',
      body: JSON.stringify(config)
    }),

  /**
   * Guarda fixture completo en BD
   */
  guardarFixture: (data) =>
    request(`${API_BASE}/fixture/guardar`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Obtiene fixture de un campeonato-categoria
   */
  obtenerFixture: (id_campeonato, id_cc) =>
    request(`${API_BASE}/fixture/campeonato/${id_campeonato}/categoria/${id_cc}`),

  /**
   * Obtiene TODOS los partidos del campeonato (todas las categorías)
   * @param {number} id_campeonato - ID del campeonato
   * @param {string} fecha - Fecha opcional (formato YYYY-MM-DD)
   */
  obtenerTodosLosPartidos: (id_campeonato, fecha = null) => {
    const url = fecha
      ? `${API_BASE}/fixture/campeonato/${id_campeonato}/todos?fecha=${fecha}`
      : `${API_BASE}/fixture/campeonato/${id_campeonato}/todos`;
    return request(url);
  },

  /**
   * Actualiza un partido (cancha, árbitros, horario)
   */
  actualizarPartido: (id_partido, data) =>
    request(`${API_BASE}/fixture/partido/${id_partido}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  /**
   * Obtiene recursos disponibles (canchas, árbitros)
   */
  obtenerRecursos: () =>
    request(`${API_BASE}/fixture/recursos`)
};
