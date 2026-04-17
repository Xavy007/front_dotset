import { useState, useEffect } from 'react';
import { API_BASE, SERVER_URL } from '../services/api.config.js';

let cache = null; // Cache en memoria para no repetir el fetch en la misma sesión

export function useAsociacion() {
  const [asociacion, setAsociacion] = useState(cache || {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch(`${API_BASE}/asociacion`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          cache = data.data;
          setAsociacion(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logoUrl = asociacion.logo
    ? `${SERVER_URL}${asociacion.logo.startsWith('/') ? asociacion.logo : '/' + asociacion.logo}`
    : null;

  return { asociacion, logoUrl, loading };
}
