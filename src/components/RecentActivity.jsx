import React from 'react';

export default function RecentActivity() {
  const recentActivity = [
    { id: 1, user: 'Juan García', action: 'Completó pedido #2341', time: 'Hace 2 horas' },
    { id: 2, user: 'María López', action: 'Se registró en la plataforma', time: 'Hace 4 horas' },
    { id: 3, user: 'Pedro Ruiz', action: 'Actualizó perfil', time: 'Hace 6 horas' },
    { id: 4, user: 'Ana Martínez', action: 'Descargó reporte', time: 'Hace 8 horas' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h2>
      <div className="space-y-4">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-2">
            <p className="text-sm font-semibold text-gray-900">{activity.user}</p>
            <p className="text-xs text-gray-600">{activity.action}</p>
            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}