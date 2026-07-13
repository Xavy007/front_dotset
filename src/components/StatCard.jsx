// ===============================================
// ARCHIVO: src/components/StatCard.jsx
// Tarjeta de estadística con ícono en círculo
// ===============================================

// color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
const colorMap = {
  blue:   { border: 'border-t-blue-500',   grad: 'from-blue-500 to-blue-600',   icon: 'text-white', value: 'text-blue-700'   },
  green:  { border: 'border-t-emerald-500', grad: 'from-emerald-500 to-green-600', icon: 'text-white', value: 'text-emerald-700' },
  yellow: { border: 'border-t-amber-400',  grad: 'from-amber-400 to-orange-500', icon: 'text-white', value: 'text-amber-700'  },
  red:    { border: 'border-t-red-500',    grad: 'from-red-500 to-rose-600',    icon: 'text-white', value: 'text-red-700'    },
  gray:   { border: 'border-t-slate-400',  grad: 'from-slate-400 to-slate-500', icon: 'text-white', value: 'text-slate-700'  },
  purple: { border: 'border-t-violet-500', grad: 'from-violet-500 to-purple-600', icon: 'text-white', value: 'text-violet-700' },
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading = false, compact = false }) {
  const c = colorMap[color] || colorMap.blue;

  if (loading) {
    return compact ? (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-3 py-2 flex items-center gap-2 animate-pulse">
        <div className="w-6 h-6 rounded-md bg-gray-200 shrink-0" />
        <div className="space-y-1">
          <div className="h-2 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-gray-300 shadow-sm p-4 flex items-center gap-4 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-100 border-l-4 ${c.border.replace('border-t-', 'border-l-')} shadow-sm px-3 py-2 flex items-center gap-2.5 hover:shadow-md transition-shadow`}>
        {Icon && (
          <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${c.grad} flex items-center justify-center shrink-0`}>
            <Icon size={14} className={c.icon} />
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">{title}</p>
          <p className={`text-base font-bold ${c.value} leading-tight`}>{value ?? '—'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-t-4 ${c.border} shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={20} className={c.icon} />
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-bold ${c.value} mt-0.5 leading-none`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

// Helper para renderizar un grid de stats
export function StatsRow({ children, cols = 4, compact = false }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {children}
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4 mb-6`}>
      {children}
    </div>
  );
}
