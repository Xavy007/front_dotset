// src/services/reportesService.js
// Servicio para consumir los endpoints de reportes del backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Función helper para hacer peticiones
const request = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en reportesService:', error);
    throw error;
  }
};

export const reportesService = {
  /**
   * Obtener ranking de goleadores/anotadores
   * @param {Object} filtros - { idcampeonato, idcategoria, limite }
   */
  getTopGoleadores: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.idcampeonato) params.append('idcampeonato', filtros.idcampeonato);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);
    params.append('limite', filtros.limite || 20);

    return request(`${API_BASE}/reportes/goleadores?${params}`);
  },

  /**
   * Obtener estadísticas de todos los equipos
   * @param {Object} filtros - { idcampeonato, idcategoria }
   */
  getEstadisticasEquipos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.idcampeonato) params.append('idcampeonato', filtros.idcampeonato);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);

    return request(`${API_BASE}/reportes/estadisticas-equipos?${params}`);
  },

  /**
   * Obtener estadísticas detalladas de un jugador
   * @param {number} idjugador - ID del jugador
   * @param {Object} filtros - { idcampeonato, idcategoria }
   */
  getEstadisticasJugador: async (idjugador, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.idcampeonato) params.append('idcampeonato', filtros.idcampeonato);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);

    return request(`${API_BASE}/reportes/jugador/${idjugador}?${params}`);
  },

  /**
   * Obtener reporte de sanciones
   * @param {Object} filtros - { idcampeonato, idcategoria, tipo_sancion }
   */
  getSanciones: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.idcampeonato) params.append('idcampeonato', filtros.idcampeonato);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);
    if (filtros.tipo_sancion) params.append('tipo_sancion', filtros.tipo_sancion);

    return request(`${API_BASE}/reportes/sanciones?${params}`);
  },

  /**
   * Obtener resumen de una jornada
   * @param {number} idjornada - ID de la jornada
   */
  getResumenJornada: async (idjornada) => {
    return request(`${API_BASE}/reportes/jornada/${idjornada}`);
  },

  /**
   * Obtener comparativa/historial de enfrentamientos entre dos equipos
   * @param {number} idequipo1 - ID del primer equipo
   * @param {number} idequipo2 - ID del segundo equipo
   * @param {Object} filtros - { idcampeonato }
   */
  getComparativaEquipos: async (idequipo1, idequipo2, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.idcampeonato) params.append('idcampeonato', filtros.idcampeonato);

    return request(`${API_BASE}/reportes/comparativa/${idequipo1}/${idequipo2}?${params}`);
  },
};

export default reportesService;
