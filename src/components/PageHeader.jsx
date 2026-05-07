// ===============================================
// ARCHIVO: src/components/PageHeader.jsx
// Cabecera de página reutilizable
// ===============================================

export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
            <Icon size={20} className="text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-200 shrink-0"
        >
          {action.icon && <action.icon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
