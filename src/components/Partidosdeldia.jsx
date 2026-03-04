import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trophy, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

// URL del servidor para archivos estáticos (logos, imágenes)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export default function PartidosDelDia() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartidosDelDia();
  }, []);

  const fetchPartidosDelDia = async () => {
    try {
      setLoading(true);

      // Obtener fecha actual en formato YYYY-MM-DD
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];

      // Fetch partidos
      const response = await fetch(`${API_BASE_URL}/fixture/partidos?fecha=${fechaHoy}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al cargar partidos');
      }

      const responseData = await response.json();

      // Extraer array de partidos (puede venir como array directo o como {data: []})
      const data = Array.isArray(responseData) ? responseData :
                   (responseData?.data && Array.isArray(responseData.data) ? responseData.data : []);

      // Filtrar partidos del día actual
      const partidosHoy = data.filter(partido => {
        if (!partido.fecha_hora) return false;
        const fechaPartido = new Date(partido.fecha_hora).toISOString().split('T')[0];
        return fechaPartido === fechaHoy;
      });

      // Ordenar por hora
      partidosHoy.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

      setPartidos(partidosHoy);
    } catch (error) {
      console.error('Error al cargar partidos del día:', error);
      setPartidos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatHora = (fecha) => {
    if (!fecha) return '--:--';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-BO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'programado': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programado' },
      'en_curso': { bg: 'bg-green-100', text: 'text-green-800', label: 'En Curso' },
      'finalizado': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Finalizado' },
      'suspendido': { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendido' },
      'cancelado': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
    };

    const estadoInfo = estados[estado] || estados['programado'];

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.bg} ${estadoInfo.text}`}>
        {estadoInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Partidos de Hoy
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-blue-600" />
        Partidos de Hoy
        <span className="ml-auto text-sm font-normal text-gray-500">
          {new Date().toLocaleDateString('es-BO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </h2>

      {partidos.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No hay partidos programados para hoy</p>
          <p className="text-gray-500 text-sm mt-1">Los próximos partidos aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {partidos.map((partido) => (
            <div
              key={partido.id_partido}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">
                    {formatHora(partido.fecha_hora)}
                  </span>
                </div>
                {getEstadoBadge(partido.estado || 'programado')}
              </div>

              {/* Equipos */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(partido.equipoLocal?.club?.logo || partido.equipo1?.club?.logo || partido.equipo_local?.club?.logo) ? (
                      <img
                        src={(() => {
                          const logo = partido.equipoLocal?.club?.logo || partido.equipo1?.club?.logo || partido.equipo_local?.club?.logo;
                          return logo.startsWith('http') ? logo : `${SERVER_URL}${logo.startsWith('/') ? logo : '/' + logo}`;
                        })()}
                        alt="Logo equipo 1"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23e5e7eb"/%3E%3Ctext x="16" y="22" text-anchor="middle" font-size="14"%3E🏐%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">🏐</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-900">
                      {partido.equipoLocal?.nombre || partido.equipo1?.nombre_equipo || partido.equipo_local?.nombre_equipo || 'Equipo 1'}
                    </span>
                  </div>
                  {partido.sets_equipo1 !== null && partido.sets_equipo1 !== undefined && (
                    <span className="text-lg font-bold text-gray-900">{partido.sets_equipo1}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(partido.equipoVisitante?.club?.logo || partido.equipo2?.club?.logo || partido.equipo_visitante?.club?.logo) ? (
                      <img
                        src={(() => {
                          const logo = partido.equipoVisitante?.club?.logo || partido.equipo2?.club?.logo || partido.equipo_visitante?.club?.logo;
                          return logo.startsWith('http') ? logo : `${SERVER_URL}${logo.startsWith('/') ? logo : '/' + logo}`;
                        })()}
                        alt="Logo equipo 2"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23e5e7eb"/%3E%3Ctext x="16" y="22" text-anchor="middle" font-size="14"%3E🏐%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">🏐</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-900">
                      {partido.equipoVisitante?.nombre || partido.equipo2?.nombre_equipo || partido.equipo_visitante?.nombre_equipo || 'Equipo 2'}
                    </span>
                  </div>
                  {partido.sets_equipo2 !== null && partido.sets_equipo2 !== undefined && (
                    <span className="text-lg font-bold text-gray-900">{partido.sets_equipo2}</span>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {partido.cancha?.nombre_cancha && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{partido.cancha.nombre_cancha}</span>
                  </div>
                )}
                {partido.campeonato?.nombre_campeonato && (
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span className="truncate">{partido.campeonato.nombre_campeonato}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}