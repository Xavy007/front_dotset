// ===============================================
// ARCHIVO: src/services/jugadoresService.js
// ===============================================

const API_BASE = 'http://localhost:8080/api';

// Función genérica para manejar respuestas
async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP ${res.status}`);
  }
  // Si es un delete exitoso (204), retornamos null
  if (res.status === 204) return null;
  return res.json();
}

export const jugadoresService = {
  // --- JUGADORES ---
  getAll: () => request(`${API_BASE}/jugadores`),
  
  getById: (id) => request(`${API_BASE}/jugadores/${id}`),
  
  create: (formData) => request(`${API_BASE}/jugadores`, {
    method: 'POST',
    body: formData, // No poner Content-Type manual con FormData, el navegador lo hace
  }),

  update: (id, formData) => request(`${API_BASE}/jugadores/${id}`, {
    method: 'PUT',
    body: formData,
  }),

  delete: (id) => request(`${API_BASE}/jugadores/${id}`, {
    method: 'DELETE',
  }),

  // --- CATALOGOS AUXILIARES ---
  getNacionalidades: () => request(`${API_BASE}/nacionalidad/`),
  getClubes: () => request(`${API_BASE}/club/`),
  getDepartamentos: () => request(`${API_BASE}/departamentos`),
  getProvincias: () => request(`${API_BASE}/provincias`),
  getCategorias: () => request(`${API_BASE}/categorias`),
};