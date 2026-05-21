// src/services/estadisticasService.js
import { API_BASE } from './api.config.js';

const headers = () => {
  const token = sessionStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
};

const get = (url) => fetch(url, { headers: headers() }).then(r => r.json());

export const estadisticasService = {
  getJugadoresPartido:   (id)            => get(`${API_BASE}/mongodb/estadisticas-jugadores/${id}`),
  getComparativaEquipos: (id)            => get(`${API_BASE}/mongodb/estadisticas-equipos/${id}/comparativa`),
  getMVP:                (id)            => get(`${API_BASE}/mongodb/estadisticas-jugadores/${id}/mvp`),
  getRankingCampeonato:  (idCamp, idCC)  => {
    const qs = idCC ? `?id_cc=${idCC}` : '';
    return get(`${API_BASE}/mongodb/estadisticas-jugadores/ranking/campeonato/${idCamp}${qs}`);
  },
  getDiagnosticoPartido:   (id)     => get(`${API_BASE}/mongodb/diagnostico/${id}`),
  getCampeonatos:          ()       => get(`${API_BASE}/campeonato`),
  getPartidosCampeonato:   (idCamp) => get(`${API_BASE}/fixture/campeonato/${idCamp}/todos`),
  getCategoriasCampeonato: (idCamp) => get(`${API_BASE}/campeonato-categoria/campeonato/${idCamp}`),
};
