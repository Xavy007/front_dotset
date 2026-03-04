// ===============================================
// ARCHIVO: src/services/configuracionCampeonatoService.js
// Servicio para configurar campeonatos (grupos, liga, eliminatorias, etc.)
// ===============================================

import { API_BASE, request } from './api.config';

export const configuracionCampeonatoService = {
  /**
   * Configurar campeonato por grupos
   * @param {object} config - { id_cc, cantidad_grupos, ida_vuelta, fecha_inicio, fecha_fin, equipos }
   */
  configurarPorGrupos: (config) =>
    request(`${API_BASE}/configuracion-campeonato/grupos`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Configurar campeonato tipo liga (todos contra todos)
   * @param {object} config - { id_cc, ida_vuelta, fecha_inicio, fecha_fin, equipos }
   */
  configurarTipoLiga: (config) =>
    request(`${API_BASE}/configuracion-campeonato/liga`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Configurar eliminatorias (playoffs)
   * @param {object} config - { id_cc, cantidad_equipos, ida_vuelta, fecha_inicio, fecha_fin, orden }
   */
  configurarEliminatorias: (config) =>
    request(`${API_BASE}/configuracion-campeonato/eliminatorias`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Configurar campeonato completo (grupos + eliminatorias)
   * @param {object} config - Configuración completa del campeonato
   */
  configurarCompleto: (config) =>
    request(`${API_BASE}/configuracion-campeonato/completo`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Configurar Final Four
   * @param {object} config - { id_cc, fecha_inicio, fecha_fin, orden }
   */
  configurarFinalFour: (config) =>
    request(`${API_BASE}/configuracion-campeonato/final-four`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Obtener resumen de configuración de un campeonato
   * @param {number} id_cc - ID de campeonato-categoría
   */
  obtenerResumen: (id_cc) =>
    request(`${API_BASE}/configuracion-campeonato/resumen/${id_cc}`),

  /**
   * Validar si una cantidad de equipos es válida para eliminatorias (potencia de 2)
   * @param {number} numero - Cantidad de equipos a validar
   */
  validarEquipos: (numero) =>
    request(`${API_BASE}/configuracion-campeonato/validar-equipos/${numero}`),
};
