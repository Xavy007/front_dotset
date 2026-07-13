import { useState, useEffect } from 'react';

/**
 * useState que persiste el valor en sessionStorage.
 * Al volver a la página el filtro/valor se restaura automáticamente.
 * Se usa 'key' como clave única — convención: 'pagina:campo'.
 */
export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`filter:${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(`filter:${key}`, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}
