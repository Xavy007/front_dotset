import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Menu } from 'lucide-react';
import { LogoutModal } from '../utils/LogoutModal';

export function Header({ usuario, onLogout, onToggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const ref = useRef(null);

  const nombre = usuario?.nombre || usuario?.email || 'Usuario';
  const rol    = usuario?.rol    || '';
  const inicial = nombre.charAt(0).toUpperCase();

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
        {/* Botón hamburguesa — solo visible en mobile */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={22} />
        </button>

        {/* Menú de usuario */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {inicial}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{rol}</p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">{nombre}</p>
                <p className="text-xs text-gray-400 capitalize">{rol}</p>
              </div>
              <button
                onClick={() => { setOpen(false); setShowLogout(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal fuera del header para que no quede recortado */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); onLogout?.(); }}
      />
    </>
  );
}
