// ===============================================
// ARCHIVO: src/components/ConfirmModal.jsx
// Modal de confirmación estilizado
// ===============================================

import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning'
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Ícono */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {isDanger
              ? <Trash2 size={26} className="text-red-600" />
              : <AlertTriangle size={26} className="text-yellow-600" />
            }
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center">{title}</h3>
          <p className="text-sm text-gray-500 text-center mt-2">{message}</p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
