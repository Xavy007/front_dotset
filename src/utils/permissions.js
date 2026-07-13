// ===============================================
// ARCHIVO: src/utils/permissions.js
// ===============================================

export const PERMISSIONS = {
  admin: {
    dashboard: ['leer'],
    asociacion: ['leer', 'actualizar'],
    usuarios: ['crear', 'leer', 'actualizar', 'eliminar', 'cambiar_estado', 'cambiar_rol'],
    jugadores: ['crear', 'leer', 'actualizar', 'eliminar'],
    gestiones: ['crear', 'leer', 'actualizar', 'eliminar'],
    eqtecnico: ['crear', 'leer', 'actualizar', 'eliminar'],
    jueces: ['crear', 'leer', 'actualizar', 'eliminar'],
    categorias: ['crear', 'leer', 'actualizar', 'eliminar'],
    club: ['crear', 'leer', 'actualizar', 'eliminar'],
    equipos: ['crear', 'leer', 'actualizar', 'eliminar'],
    campeonatos: ['crear', 'leer', 'actualizar', 'eliminar'],
    inscripciones: ['crear', 'leer', 'actualizar', 'eliminar'],
    canchas: ['crear', 'leer', 'actualizar', 'eliminar'],
    partidos: ['crear', 'leer', 'actualizar', 'eliminar'],
    reportes: ['leer'],
    estadisticas: ['leer'],
    configuracion: ['leer', 'actualizar'],
  },

  secretario: {
    dashboard: ['leer'],
    gestiones: ['crear', 'leer', 'actualizar', 'eliminar'],
    jugadores: ['crear', 'leer', 'actualizar'],
    eqtecnico: ['crear', 'leer', 'actualizar'],
    jueces: ['leer'],
    categorias: ['leer'],
    club: ['leer', 'actualizar'],
    equipos: ['crear', 'leer', 'actualizar'],
    campeonatos: ['leer'],
    inscripciones: ['crear', 'leer', 'actualizar'],
    canchas: ['leer'],
    partidos: ['crear', 'leer', 'actualizar'],
    reportes: ['leer'],
    estadisticas: ['leer'],
  },

  presidente: {
    dashboard: ['leer'],
    gestiones: ['crear', 'leer', 'actualizar', 'eliminar'],
    jugadores: ['leer'],
    eqtecnico: ['leer'],
    jueces: ['leer'],
    categorias: ['leer'],
    club: ['leer'],
    equipos: ['leer'],
    campeonatos: ['crear', 'leer', 'actualizar'],
    inscripciones: ['crear', 'leer', 'actualizar'],
    canchas: ['leer'],
    partidos: ['leer'],
    reportes: ['leer'],
    estadisticas: ['leer'],
    configuracion: ['leer'],
  },

  presidenteclub: {
    dashboard: ['leer'],
    jugadores: ['crear', 'leer', 'actualizar'],
    eqtecnico: ['crear', 'leer', 'actualizar'],
    club: ['leer', 'actualizar'],
    equipos: ['crear', 'leer', 'actualizar'],
    inscripciones: ['crear', 'leer'],
    partidos: ['leer'],
    estadisticas: ['leer'],
  },

  representante: {
    dashboard: ['leer'],
    jugadores: ['leer'],
    equipos: ['leer'],
    inscripciones: ['leer'],
    partidos: ['leer'],
    estadisticas: ['leer'],
  },

  // juez: solo accede a la app Android (dotset), no al sistema web
};

// Verificar si el usuario tiene permiso
export const tienePermiso = (rol, modulo, accion) => {
  const permisos = PERMISSIONS[rol];
  if (!permisos) return false;
  
  const permisosModulo = permisos[modulo];
  if (!permisosModulo) return false;
  
  return permisosModulo.includes(accion);
};

// Obtener usuario actual
export const getUsuarioActual = () => {
  try {
    const userStr = sessionStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
};

// Verificar si puede acceder al módulo
export const puedeAccederModulo = (modulo) => {
  const usuario = getUsuarioActual();
  if (!usuario) return false;
  
  const permisos = PERMISSIONS[usuario.rol];
  return permisos && permisos[modulo] && permisos[modulo].length > 0;
};