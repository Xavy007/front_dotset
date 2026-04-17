// ===============================================
// ARCHIVO: src/utils/permissions.js
// ===============================================

export const PERMISSIONS = {
  admin: {
    dashboard: ['leer'],
    asociacion: ['leer', 'actualizar'],
    usuarios: ['crear', 'leer', 'actualizar', 'eliminar', 'cambiar_estado', 'cambiar_rol'],
    jugadores: ['crear', 'leer', 'actualizar', 'eliminar'],
    gestiones:['crear', 'leer', 'actualizar', 'eliminar'],
    eqtecnico: ['crear', 'leer', 'actualizar', 'eliminar'],
    jueces: ['crear', 'leer', 'actualizar', 'eliminar'],
    categorias: ['crear', 'leer', 'actualizar', 'eliminar'],
    club: ['crear', 'leer', 'actualizar', 'eliminar'],
    equipos: ['crear', 'leer', 'actualizar', 'eliminar'],
    campeonatos: ['crear', 'leer', 'actualizar', 'eliminar'],
    canchas: ['crear', 'leer', 'actualizar', 'eliminar'],
    partidos: ['crear', 'leer', 'actualizar', 'eliminar'],
    reportes: ['leer'],
    configuracion: ['leer', 'actualizar'],
  },
  
  secretario: {
    dashboard: ['leer'],
    gestiones:['crear', 'leer', 'actualizar', 'eliminar'],
    jugadores: ['crear', 'leer', 'actualizar'],
    eqtecnico: ['crear', 'leer', 'actualizar'],
    jueces: ['leer'],
    categorias: ['leer'],
    club: ['leer', 'actualizar'],
    equipos: ['crear', 'leer', 'actualizar'],
    campeonatos: ['leer'],
    canchas: ['leer'],
    partidos: ['crear', 'leer', 'actualizar'],
    reportes: ['leer'],
  },
  
  presidente: {
    gestiones:['crear', 'leer', 'actualizar', 'eliminar'],
    dashboard: ['leer'],
    jugadores: ['leer'],
    eqtecnico: ['leer'],
    jueces: ['leer'],
    categorias: ['leer'],
    club: ['leer'],
    equipos: ['leer'],
    campeonatos: ['crear', 'leer', 'actualizar'],
    canchas: ['leer'],
    partidos: ['leer'],
    reportes: ['leer'],
    configuracion: ['leer'],
  },
  
  presidenteclub: {
    dashboard: ['leer'],
    jugadores: ['crear', 'leer', 'actualizar'], // Solo de su club
    eqtecnico: ['crear', 'leer', 'actualizar'], // Solo de su club
    club: ['leer'], // Solo su club
    equipos: ['leer'], // Solo sus equipos
    campeonatos: ['leer'],
    partidos: ['leer'],
    reportes: ['leer'],
  },
  
  representante: {
    dashboard: ['leer'],
    jugadores: ['leer'], // Solo de su club
    equipos: ['leer'], // Solo sus equipos
    campeonatos: ['leer'],
    partidos: ['leer'],
  },
  
  juez: {
    dashboard: ['leer'],
    partidos: ['leer', 'actualizar'], // Solo registrar resultados
    campeonatos: ['leer'],
    canchas: ['leer'],
  }
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