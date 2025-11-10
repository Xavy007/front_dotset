import React from 'react';

export default function ChartSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Ventas este mes</h2>
      <div className="h-64 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Gráfico de ventas</p>
          <p className="text-sm text-gray-400">(integra recharts para visualizaciones reales)</p>
        </div>
      </div>
    </div>
  );
}