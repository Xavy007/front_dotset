// ===============================================
// ARCHIVO: src/components/Sidebar.jsx
// SIDEBAR CON PERMISOS POR ROL
// ===============================================

import React, { useMemo } from 'react';
import { Menu } from 'lucide-react';
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
  FileText,
  Calendar,
  CalendarCog,
  CalendarRange,
  UserPlus,
  Medal,
  Building2
} from 'lucide-react';
import { puedeAccederModulo } from '../utils/permissions';

export function Sidebar({ isOpen, isMobile, currentPage, onPageChange, onToggle, userRol, className }) {

  // ✅ Items del menú con control de acceso basado en el rol
  const menuItems = useMemo(() => {
    console.log('🔍 Calculando menú para rol:', userRol);
    
    const items = [
      // — General —
      { label: 'Dashboard',      icon: BarChart3,     page: 'dashboard',            module: 'dashboard'   },

      // — Configuración base —
      { label: 'Asociación',     icon: Building2,     page: 'asociacion',           module: 'asociacion'  },
      { label: 'Categorías',     icon: TrendingUp,    page: 'categorias',           module: 'categorias'  },
      { label: 'Canchas',        icon: MapIcon,       page: 'canchas',              module: 'canchas'     },

      // — Personas —
      { label: 'Clubes',         icon: Volleyball,    page: 'club',                 module: 'club'        },
      { label: 'Jugadores',      icon: Users2,        page: 'jugadores',            module: 'jugadores'   },
      { label: 'Eq. Técnico',    icon: SquareUserRound, page: 'eqtecnico',          module: 'eqtecnico'   },
      { label: 'Jueces',         icon: UserRoundCog,  page: 'jueces',               module: 'jueces'      },

      // — Campeonato —
      { label: 'Gestiones',      icon: CalendarRange, page: 'gestiones',            module: 'gestiones'   },
      { label: 'Campeonatos',    icon: Trophy,        page: 'campeonatos',          module: 'campeonatos' },
      { label: 'Equipos',        icon: Shield,        page: 'equipos',              module: 'equipos'     },
      { label: 'Inscripciones',  icon: UserPlus,      page: 'gestion-inscripciones', module: 'campeonatos' },
      { label: 'Cronograma',     icon: Calendar,      page: 'generar-fixture',      module: 'campeonatos' },
      { label: 'Prog. Partidos', icon: CalendarCog,   page: 'gestion-partidos',     module: 'partidos'    },
      { label: 'Partidos',       icon: Activity,      page: 'partidos',             module: 'partidos'    },
      { label: 'Posiciones',     icon: Medal,         page: 'tabla-posiciones',     module: 'campeonatos' },
      { label: 'Estadísticas',  icon: BarChart3,     page: 'estadisticas',         module: 'estadisticas' },

      // — Administración —
      { label: 'Usuarios',       icon: User,          page: 'usuarios',             module: 'usuarios'    },
      { label: 'Reportes',       icon: FileText,      page: 'reportes',             module: 'reportes'    },
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

  const asideClass = isMobile
    ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 relative`;

  return (
    <>
      <aside className={`${asideClass} bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white flex flex-col ${className || ''}`}>

        {/* Logo / Título + botón toggle */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white font-black text-sm">D</span>
            </div>
            {isOpen && (
              <div className="leading-none">
                <span className="text-white font-black text-xl tracking-tight">DOT</span>
                <span className="text-blue-400 font-black text-xl tracking-tight">SET</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <Menu size={18} />
          </button>
        </div>

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

      </aside>
    </>
  );
}