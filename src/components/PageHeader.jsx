// ===============================================
// ARCHIVO: src/components/PageHeader.jsx
// Cabecera de página reutilizable
// ===============================================

export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Icon size={22} className="text-blue-600" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shrink-0"
        >
          {action.icon && <action.icon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
