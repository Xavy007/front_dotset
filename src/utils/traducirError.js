/**
 * Traduce mensajes de error comunes del inglés al español.
 * Útil para errores nativos del navegador (Failed to fetch, etc.)
 * y mensajes técnicos que pueden llegar sin traducir.
 */
const TRADUCCIONES = [
  [/failed to fetch/i,                   'Error de conexión. Verificá tu conexión a internet.'],
  [/networkerror/i,                       'Error de red. Verificá tu conexión a internet.'],
  [/network request failed/i,            'Error de red. Verificá tu conexión a internet.'],
  [/load failed/i,                       'Error al cargar el recurso. Intentá de nuevo.'],
  [/the internet connection appears/i,   'Sin conexión a internet.'],
  [/unauthorized/i,                      'No autorizado. Volvé a iniciar sesión.'],
  [/forbidden/i,                         'No tenés permisos para esta acción.'],
  [/not found/i,                         'Recurso no encontrado.'],
  [/internal server error/i,             'Error interno del servidor. Intentá más tarde.'],
  [/bad gateway/i,                       'El servidor no respondió. Intentá más tarde.'],
  [/service unavailable/i,               'Servicio no disponible. Intentá más tarde.'],
  [/timeout|timed out/i,                 'La operación tardó demasiado. Intentá de nuevo.'],
  [/validation error/i,                  'Error de validación en los datos.'],
  [/unique constraint/i,                 'Ya existe un registro con ese valor.'],
  [/foreign key/i,                       'No se puede eliminar: hay registros asociados.'],
  [/canvas has been tainted/i,           'Error de seguridad del navegador. Recargá la página.'],
  [/securityerror/i,                     'Error de seguridad. Recargá la página e intentá de nuevo.'],
  [/syntaxerror/i,                       'Respuesta inesperada del servidor.'],
  [/aborted/i,                           'La operación fue cancelada.'],
];

/**
 * @param {string|Error} error - Mensaje de error o instancia de Error
 * @returns {string} Mensaje en español
 */
export const traducirError = (error) => {
  const msg = (error instanceof Error ? error.message : error) || 'Error desconocido';

  for (const [patron, traduccion] of TRADUCCIONES) {
    if (patron.test(msg)) return traduccion;
  }

  return msg; // ya estaba en español u otro idioma desconocido
};
