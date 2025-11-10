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
  VolleyballIcon, 
  Trophy, 
  MapIcon, 
  Activity, 
  Settings, 
  LogOut,
  FileText
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
        icon: VolleyballIcon, 
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
        label: 'Reportes', 
        icon: FileText, 
        page: 'reportes',
        module: 'reportes'
      },
      { 
        label: 'Configuración', 
        icon: Settings, 
        page: 'configuracion',
        module: 'configuracion'
      }
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
      <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col ${className || ''}`}>
        
        {/* Logo / Título */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <div className="text-2xl font-bold">
            {isOpen ? '📊 PuntoSet' : '📊'}
          </div>
        </div>

        {/* ✅ Info del usuario */}
        {isOpen && usuario && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {usuario.persona?.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {usuario.persona?.nombre || usuario.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {userRol || 'Sin rol'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Menú de navegación filtrado */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.length > 0 ? (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              
              return (
                <button
                  key={item.page}
                  onClick={() => onPageChange(item.page)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  title={!isOpen ? item.label : ''}
                >
                  <Icon size={20} />
                  {isOpen && <span>{item.label}</span>}
                </button>
              );
            })
          ) : (
            <div className="text-center text-gray-400 text-sm p-4">
              {isOpen && 'No tienes acceso a ningún módulo'}
            </div>
          )}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
            title={!isOpen ? 'Salir' : ''}
          >
            <LogOut size={20} />
            {isOpen && <span>Salir</span>}
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