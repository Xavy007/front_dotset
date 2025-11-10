// ===============================================
// ARCHIVO: src/hooks/usePermissions.js
// ===============================================

import { useMemo } from 'react';
import { tienePermiso, getUsuarioActual, puedeAccederModulo } from '../utils/permissions';

export const usePermissions = () => {
  const usuario = useMemo(() => getUsuarioActual(), []);
  
  const can = (modulo, accion) => {
    if (!usuario) return false;
    return tienePermiso(usuario.rol, modulo, accion);
  };
  
  const canAccess = (modulo) => {
    return puedeAccederModulo(modulo);
  };
  
  const isRole = (...roles) => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };
  
  return {
    usuario,
    can,
    canAccess,
    isRole
  };
};