// ===============================================
// ARCHIVO: src/components/Sidebar.jsx
// SIDEBAR CON PERMISOS POR ROL
// ===============================================

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users2,
  User,
  SquareUserRound,
  UserRoundCog,
  TrendingUp,
  Volleyball,
  Shield,
  Trophy,
  MapIcon,
  Activity,
  LogOut,
  FileText,
  Calendar,
  CalendarCog,
  CalendarRange,
  UserPlus,
  Medal,
  Building2
} from 'lucide-react';
import { LogoutModal } from '../utils/LogoutModal';
import { handleLogout } from '../utils/auth';
import { puedeAccederModulo } from '../utils/permissions';

export function Sidebar({ isOpen, currentPage, onPageChange, userRol, usuario, className }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ✅ Items del menú con control de acceso basado en el rol
  const menuItems = useMemo(() => {
    console.log('🔍 Calculando menú para rol:', userRol);
    
    const items = [
      { 
        label: 'Dashboard', 
        icon: BarChart3, 
        page: 'dashboard',
        module: 'dashboard'
      },
      { 
        label: 'Usuarios', 
        icon: User, 
        page: 'usuarios',
        module: 'usuarios'
      },
      {
        label: 'Gestiones',
        icon: CalendarRange,
        page: 'gestiones',
        module: 'gestiones'
      },

      { 
        label: 'Jugadores', 
        icon: Users2, 
        page: 'jugadores',
        module: 'jugadores'
      },
      { 
        label: 'Eq.Técnico', 
        icon: SquareUserRound, 
        page: 'eqtecnico',
        module: 'eqtecnico'
      },
      { 
        label: 'Jueces', 
        icon: UserRoundCog, 
        page: 'jueces',
        module: 'jueces'
      },
      { 
        label: 'Categorías', 
        icon: TrendingUp, 
        page: 'categorias',
        module: 'categorias'
      },
      { 
        label: 'Clubes', 
        icon: Volleyball, 
        page: 'club',
        module: 'club'
      },
      {
        label: 'Equipos',
        icon: Shield,
        page: 'equipos',
        module: 'equipos'
      },
      { 
        label: 'Campeonatos', 
        icon: Trophy, 
        page: 'campeonatos',
        module: 'campeonatos'
      },
      { 
        label: 'Canchas', 
        icon: MapIcon, 
        page: 'canchas',
        module: 'canchas'
      },
      {
        label: 'Partidos',
        icon: Activity,
        page: 'partidos',
        module: 'partidos'
      },
      {
        label: 'Cronograma',
        icon: Calendar,
        page: 'generar-fixture',
        module: 'campeonatos' // Mismo permiso que campeonatos
      },
      {
        label: 'Prog. Partidos',
        icon: CalendarCog,
        page: 'gestion-partidos',
        module: 'partidos'
      },
      {
        label: 'Inscripciones',
        icon: UserPlus,
        page: 'gestion-inscripciones',
        module: 'campeonatos' // Mismo permiso que campeonatos
      },
      {
        label: 'Reportes',
        icon: FileText,
        page: 'reportes',
        module: 'reportes'
      },
      {
        label: 'Asociación',
        icon: Building2,
        page: 'asociacion',
        module: 'asociacion'
      },
      {
        label: 'Posiciones',
        icon: Medal,
        page: 'tabla-posiciones',
        module: 'campeonatos' // Mismo permiso que campeonatos
      },
      /*{
        label: 'Configuración',
        icon: Settings,
        page: 'configuracion',
        module: 'configuracion'
      }*/
    ];

    // ✅ Filtrar items según permisos
    const filteredItems = items.filter(item => {
      const canAccess = puedeAccederModulo(item.module);
      console.log(`📋 ${item.label}: ${canAccess ? '✅' : '❌'}`);
      return canAccess;
    });

    console.log('✅ Items visibles:', filteredItems.length);
    return filteredItems;
  }, [userRol]); // ✅ Recalcular cuando cambie el rol

  const handleConfirmLogout = () => {
    handleLogout();
    setShowLogoutModal(false);
  };

  return (
    <>
      <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white transition-all duration-300 flex flex-col ${className || ''}`}>

        {/* Logo / Título */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          {isOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <div className="leading-none">
                <span className="text-white font-black text-xl tracking-tight">DOT</span>
                <span className="text-blue-400 font-black text-xl tracking-tight">SET</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">D</span>
            </div>
          )}
        </div>

        {/* Info del usuario */}
        {isOpen && usuario && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold shadow-md shrink-0">
                {usuario.persona?.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {usuario.persona?.nombre || usuario.email || 'Usuario'}
                </p>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full capitalize font-medium">
                  {userRol || 'Sin rol'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Menú de navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.length > 0 ? (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;

              return (
                <button
                  key={item.page}
                  onClick={() => onPageChange(item.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:bg-white/8 hover:text-white'
                  }`}
                  title={!isOpen ? item.label : ''}
                >
                  <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {isOpen && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {isOpen && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center text-slate-500 text-sm p-4">
              {isOpen && 'Sin módulos accesibles'}
            </div>
          )}
        </nav>

        {/* Cerrar Sesión */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-red-500/15 hover:text-red-300 rounded-lg transition-all duration-150"
            title={!isOpen ? 'Salir' : ''}
          >
            <LogOut size={19} />
            {isOpen && <span className="text-sm font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Modal de Confirmación de Logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}