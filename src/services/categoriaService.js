// ===============================================
// ARCHIVO: src/services/categoriaService.js
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

export const categoriaService = {
  // --- CATEGORIAS ---
  getAll: () => request(`${API_BASE}/categoria`),

  getById: (id) => request(`${API_BASE}/categoria/${id}`),

  // --- CAMPEONATO-CATEGORIA ---
  assignCategoriaToCampeonato: (data) => request(`${API_BASE}/campeonato-categoria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }),

  getCategoriasByCampeonato: (id_campeonato) =>
    request(`${API_BASE}/campeonato-categoria/campeonato/${id_campeonato}`),

  removeCategoriaFromCampeonato: (id) => request(`${API_BASE}/campeonato-categoria/${id}`, {
    method: 'DELETE',
  }),

  // Función helper para asignar múltiples categorías de una vez
  assignMultipleCategories: async (id_campeonato, categoriaIds) => {
    const promises = categoriaIds.map(id_categoria =>
      request(`${API_BASE}/campeonato-categoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_campeonato,
          id_categoria,
          formato: 'todos_vs_todos' // Formato por defecto
        }),
      })
    );

    return Promise.all(promises);
  },

  // Actualizar configuración de una campeonato-categoría
  updateConfiguracion: (id_cc, configuracion) => request(`${API_BASE}/campeonato-categoria/${id_cc}/configuracion`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(configuracion),
  }),
};
