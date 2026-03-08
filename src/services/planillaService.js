// src/services/planillaService.js
// Servicio para obtener datos de partidos desde MongoDB para la planilla FIVB

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const planillaService = {
  /**
   * Obtener lista de partidos finalizados disponibles para ver planilla
   */
  getPartidosFinalizados: async () => {
    const response = await fetch(`${API_BASE}/mongodb/planilla-digital/finalizados`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo partidos');
    return data;
  },

  /**
   * Obtener planilla completa de un partido
   * @param {number} idPartido - ID del partido
   */
  getPlanillaCompleta: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/planilla-digital/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo planilla');
    return data;
  },

  /**
   * Obtener resumen rápido de un partido
   * @param {number} idPartido - ID del partido
   */
  getResumenPartido: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/planilla-digital/${idPartido}/resumen`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo resumen');
    return data;
  },

  /**
   * Obtener todos los eventos/puntos de un partido
   * @param {number} idPartido - ID del partido
   */
  getEventosPartido: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/eventos/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo eventos');
    return data;
  },

  /**
   * Obtener datos del partido digital completo
   * @param {number} idPartido - ID del partido
   */
  getPartidoDigital: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/partidos-digitales/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo partido digital');
    return data;
  },

  /**
   * Obtener información del partido desde PostgreSQL (fixture)
   * @param {number} idPartido - ID del partido
   */
  getInfoPartidoPostgres: async (idPartido) => {
    const response = await fetch(`${API_BASE}/fixture/partido/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo info del partido');
    return data;
  },

  /**
   * Obtener estadísticas de jugadores de un partido
   * @param {number} idPartido - ID del partido
   */
  getEstadisticasJugadores: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/estadisticas-jugadores/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo estadísticas');
    return data;
  },

  /**
   * Obtener detalle de sets de un partido (desde MongoDB)
   * @param {number} idPartido - ID del partido
   */
  getSetsPartido: async (idPartido) => {
    const response = await fetch(`${API_BASE}/mongodb/sets/${idPartido}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error obteniendo sets');
    return data;
  },
};

export default planillaService;
