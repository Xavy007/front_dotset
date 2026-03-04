// ===============================================
// ARCHIVO: src/services/inscripcionService.js
// ===============================================

const API_BASE = 'http://localhost:8080/api';

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

export const inscripcionService = {
  // Obtener todas las inscripciones
  getAll: () => request(`${API_BASE}/inscripciones`),

  // Obtener inscripción por ID
  getById: (id) => request(`${API_BASE}/inscripciones/${id}`),

  // Obtener inscripciones por campeonato-categoría
  getByCC: (id_cc) => request(`${API_BASE}/inscripciones/campeonato-categoria/${id_cc}`),

  // Obtener inscripciones por equipo
  getByEquipo: (id_equipo) => request(`${API_BASE}/inscripciones/equipo/${id_equipo}`),

  // Crear inscripción
  create: (data) => request(`${API_BASE}/inscripciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  // Actualizar inscripción
  update: (id, data) => request(`${API_BASE}/inscripciones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  // Eliminar inscripción
  delete: (id) => request(`${API_BASE}/inscripciones/${id}`, {
    method: 'DELETE',
  }),

  // Inscribir múltiples equipos a una categoría-campeonato
  inscribirMultiples: async (id_cc, equipoIds) => {
    const promises = equipoIds.map(id_equipo =>
      request(`${API_BASE}/inscripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_cc,
          id_equipo,
        }),
      })
    );

    return Promise.all(promises);
  },
};
