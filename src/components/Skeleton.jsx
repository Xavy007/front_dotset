// ===============================================
// ARCHIVO: src/components/Skeleton.jsx
// Componentes de skeleton loading reutilizables
// ===============================================

// Bloque base animado
export function SkeletonBlock({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

// Skeleton para una fila de tabla
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-2.5">
          <SkeletonBlock className={`h-4 ${i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-1/2' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton completo para tabla (header + filas)
export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex px-4 py-2.5 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows skeleton */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>

      {/* Footer skeleton */}
      <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-7 w-48" />
      </div>
    </div>
  );
}

// Skeleton para tarjeta de estadística
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-2/3" />
        <SkeletonBlock className="h-6 w-1/3" />
      </div>
    </div>
  );
}

// Skeleton para grid de 3 stats cards
export function StatsGridSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4 mb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton para página completa (stats + tabla)
export function PageSkeleton({ statCount = 3, tableRows = 8, tableCols = 5 }) {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton count={statCount} />
      <TableSkeleton rows={tableRows} cols={tableCols} />
    </div>
  );
}
