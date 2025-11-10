// ===============================================
// ARCHIVO: src/components/LogoutModal.jsx
// MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN
// ===============================================

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function LogoutModal({ isOpen, onClose, onConfirm }) {
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fade-in">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cerrar Sesión</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6">
          <p className="text-gray-600">
            ¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
          </p>
        </div>

        {/* Footer con botones */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}