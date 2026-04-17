// ===============================================
// ARCHIVO: src/components/DataTable.jsx
// TABLA ELEGANTE CON PAGINACIÓN
// ===============================================

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Edit2, Inbox } from 'lucide-react';
import { TableSkeleton } from './Skeleton';

export default function DataTable({
  data = [],
  columns = [],
  itemsPerPage: defaultItemsPerPage = 10,
  onEdit = null,
  onDelete = null,
  loading = false
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Genera los números de página con elipsis para no desbordar
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  if (loading) {
    return <TableSkeleton rows={itemsPerPage} cols={columns.length + (onEdit || onDelete ? 1 : 0)} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
        <div className="flex flex-col items-center text-center gap-3">
          <Inbox size={48} className="text-gray-300" />
          <p className="text-gray-500 font-medium">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Headers */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {currentData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`transition-colors hover:bg-blue-50/40 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    className="px-4 py-2 text-gray-700"
                  >
                    {typeof column.render === 'function'
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: info + items por página + paginación */}
      <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
        {/* Info y selector */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {startIndex + 1}–{Math.min(endIndex, data.length)} de <span className="font-medium text-gray-700">{data.length}</span>
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[5, 10, 25, 50].map(n => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((page, i) =>
              page === '...'
                ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400 select-none">…</span>
                : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
            )}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
