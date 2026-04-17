// ===============================================
// ARCHIVO: src/components/StatCard.jsx
// Tarjeta de estadística con ícono en círculo
// ===============================================

// color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
const colorMap = {
  blue:   { bg: 'bg-blue-100',   icon: 'text-blue-600',   value: 'text-blue-700'   },
  green:  { bg: 'bg-green-100',  icon: 'text-green-600',  value: 'text-green-700'  },
  yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600', value: 'text-yellow-700' },
  red:    { bg: 'bg-red-100',    icon: 'text-red-600',    value: 'text-red-700'    },
  gray:   { bg: 'bg-gray-100',   icon: 'text-gray-500',   value: 'text-gray-700'   },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', value: 'text-purple-700' },
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading = false }) {
  const c = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 animate-pulse">
        <div className={`w-12 h-12 rounded-full ${c.bg} shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {Icon && (
        <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={22} className={c.icon} />
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold ${c.value} mt-0.5`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

// Helper para renderizar un grid de stats
export function StatsRow({ children, cols = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4 mb-6`}>
      {children}
    </div>
  );
}
