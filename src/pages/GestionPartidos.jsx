// src/pages/GestionPartidos.jsx

import { useState, useEffect } from 'react';
import { campeonatoService } from '../services/campeonatoService';
import { categoriaService } from '../services/categoriaService';
import { fixtureService } from '../services/fixtureService';
import ModalAsignarRecursos from '../components/ModalAsignarRecursos';
import { toast } from 'sonner';
import { SERVER_URL } from '../services/api.config';

export default function GestionPartidos() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  const [fixture, setFixture] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [jornadaActual, setJornadaActual] = useState(null);

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  useEffect(() => {
    if (campeonatoSeleccionado) {
      cargarCategorias();
    }
  }, [campeonatoSeleccionado]);

  useEffect(() => {
    if (campeonatoSeleccionado && categoriaSeleccionada) {
      cargarFixture();
    }
  }, [campeonatoSeleccionado, categoriaSeleccionada]);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      if (response.success) {
        setCampeonatos(response.data.filter(c => c.estado !== 'cancelado'));
      }
    } catch (error) {
      console.error('Error cargando campeonatos:', error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await categoriaService.getCategoriasByCampeonato(campeonatoSeleccionado);
      if (response.success) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarFixture = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fixtureService.obtenerFixture(campeonatoSeleccionado, categoriaSeleccionada);

      if (response.success) {
        setFixture(response.data);
        setJornadas(response.data.jornadas || []);

        // Determinar jornada actual (la primera que tenga partidos programados)
        const jornadaActiva = response.data.jornadas?.find(j =>
          j.partidos.some(p => p.p_estado === 'programado' || p.p_estado === 'en_juego')
        );
        setJornadaActual(jornadaActiva?.numero || 1);
      }
    } catch (error) {
      setError(error.message || 'Error al cargar fixture');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalAsignar = (partido) => {
    setPartidoSeleccionado(partido);
    setShowModalAsignar(true);
  };

  const handleGuardarAsignacion = async (datos) => {
    try {
      const response = await fixtureService.actualizarPartido(partidoSeleccionado.id_partido, datos);

      if (response.success) {
        setShowModalAsignar(false);
        cargarFixture(); // Recargar para mostrar cambios
        toast.success('Partido actualizado exitosamente');
      }
    } catch (error) {
      toast.error('Error al actualizar partido: ' + error.message);
    }
  };

  const partidosFiltrados = jornadaActual
    ? jornadas.find(j => j.numero === jornadaActual)?.partidos?.filter(p => {
        if (filtroEstado === 'todos') return true;
        return p.p_estado === filtroEstado;
      }) || []
    : [];

  const getEstadoBadge = (estado) => {
    const estados = {
      programado: { bg: 'bg-blue-100', text: 'text-blue-700', label: '📅 Programado' },
      en_juego: { bg: 'bg-green-100', text: 'text-green-700', label: '▶️ En Juego' },
      finalizado: { bg: 'bg-gray-100', text: 'text-gray-700', label: '✅ Finalizado' },
      suspendido: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏸️ Suspendido' },
      wo: { bg: 'bg-red-100', text: 'text-red-700', label: '🚫 W.O.' }
    };

    const config = estados[estado] || estados.programado;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Gestión de Partidos
          </h1>
          <p className="text-gray-600">
            Asigna canchas, árbitros y horarios a los partidos
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-lg p-6 mb-6 mx-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleccionar Campeonato */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campeonato
              </label>
              <select
                value={campeonatoSeleccionado}
                onChange={(e) => setCampeonatoSeleccionado(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">Seleccionar...</option>
                {campeonatos.map((c) => (
                  <option key={c.id_campeonato} value={c.id_campeonato}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Seleccionar Categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                disabled={!campeonatoSeleccionado}
              >
                <option value="">Seleccionar...</option>
                {categorias.map((cat) => (
                  <option key={cat.id_cc} value={cat.id_cc}>
                    {cat.categoria?.nombre || cat.Categoria?.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando partidos...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg mb-6">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Contenido Principal */}
        {!loading && fixture && (
          <>
            {/* Estadísticas */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-6 mb-6 text-white mx-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Total Partidos</p>
                  <p className="text-3xl font-bold">{fixture.total_partidos || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total Jornadas</p>
                  <p className="text-3xl font-bold">{fixture.total_jornadas || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Programados</p>
                  <p className="text-3xl font-bold">
                    {jornadas.flatMap(j => j.partidos).filter(p => p.p_estado === 'programado').length}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Finalizados</p>
                  <p className="text-3xl font-bold">
                    {jornadas.flatMap(j => j.partidos).filter(p => p.p_estado === 'finalizado').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Navegación de Jornadas */}
            <div className="bg-white shadow-lg p-6 mb-6 mx-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  📅 Seleccionar Jornada
                </h2>

                {/* Filtro por Estado */}
                <div className="flex gap-2">
                  {['todos', 'programado', 'en_juego', 'finalizado'].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => setFiltroEstado(estado)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        filtroEstado === estado
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {estado === 'todos' ? 'Todos' : estado.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {jornadas.map((jornada) => (
                  <button
                    key={jornada.numero}
                    onClick={() => setJornadaActual(jornada.numero)}
                    className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      jornadaActual === jornada.numero
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Jornada {jornada.numero}
                    <span className="ml-2 text-sm opacity-75">
                      ({jornada.partidos.length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Partidos */}
            <div className="bg-white shadow-lg p-6 mx-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🏐 Partidos de la Jornada {jornadaActual}
              </h2>

              {partidosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No hay partidos en esta jornada
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {partidosFiltrados.map((partido) => {
                    const tieneCancha = partido.cancha;
                    const tieneAsignacion = tieneCancha;

                    return (
                      <div
                        key={partido.id_partido}
                        className={`rounded-xl hover:shadow-lg transition-all relative ${
                          tieneAsignacion
                            ? 'bg-white border-l-4 border-green-500 shadow-md'
                            : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200'
                        }`}
                      >
                        {tieneAsignacion ? (
                          // Diseño para partidos ASIGNADOS (compacto mejorado)
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              {/* Info del Partido */}
                              <div className="flex-1">
                                {/* Equipos con logos */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex items-center gap-2">
                                    {partido.equipoLocal?.club?.logo ? (
                                      <img
                                        src={partido.equipoLocal.club.logo.startsWith('http')
                                          ? partido.equipoLocal.club.logo
                                          : `${SERVER_URL}${partido.equipoLocal.club.logo.startsWith('/') ? partido.equipoLocal.club.logo : '/' + partido.equipoLocal.club.logo}`}
                                        alt={partido.equipoLocal.nombre}
                                        className="w-10 h-10 object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23e5e7eb"/%3E%3Ctext x="20" y="28" text-anchor="middle" font-size="18"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                    <span className="font-bold text-base text-gray-900">
                                      {partido.equipoLocal?.nombre || 'Equipo Local'}
                                    </span>
                                  </div>

                                  <span className="text-gray-400 font-bold">VS</span>

                                  <div className="flex items-center gap-2">
                                    {partido.equipoVisitante?.club?.logo ? (
                                      <img
                                        src={partido.equipoVisitante.club.logo.startsWith('http')
                                          ? partido.equipoVisitante.club.logo
                                          : `${SERVER_URL}${partido.equipoVisitante.club.logo.startsWith('/') ? partido.equipoVisitante.club.logo : '/' + partido.equipoVisitante.club.logo}`}
                                        alt={partido.equipoVisitante.nombre}
                                        className="w-10 h-10 object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23e5e7eb"/%3E%3Ctext x="20" y="28" text-anchor="middle" font-size="18"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                    <span className="font-bold text-base text-gray-900">
                                      {partido.equipoVisitante?.nombre || 'Equipo Visitante'}
                                    </span>
                                  </div>

                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300 whitespace-nowrap">
                                    ✓ COMPLETO
                                  </span>
                                  {getEstadoBadge(partido.p_estado)}
                                </div>

                                {/* Información compacta en grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <span className="text-blue-600">📅</span>
                                    <span className="font-medium">
                                      {new Date(partido.fecha_hora).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short'
                                      })} - {new Date(partido.fecha_hora).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-green-600">🏟️</span>
                                    <span className="text-green-700 font-semibold truncate">
                                      {partido.cancha?.nombre || 'Sin cancha'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-purple-600">👨‍⚖️</span>
                                    <span className="text-gray-700 font-medium truncate">
                                      {partido.asignacionJueces?.arbitro1
                                        ? `${partido.asignacionJueces.arbitro1.persona?.ap}`
                                        : 'Sin árbitros'}
                                    </span>
                                  </div>

                                  {partido.asignacionJueces?.planillero && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-amber-600">📋</span>
                                      <span className="text-gray-700 font-medium truncate">
                                        {partido.asignacionJueces.planillero.persona?.ap}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Observaciones si existen */}
                                {partido.observaciones && (
                                  <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded text-xs text-gray-700">
                                    <span className="font-semibold">📝</span> {partido.observaciones}
                                  </div>
                                )}
                              </div>

                              {/* Botón Editar */}
                              <button
                                onClick={() => handleAbrirModalAsignar(partido)}
                                className="px-4 py-2 font-semibold rounded-lg transition-all shadow whitespace-nowrap bg-green-600 text-white hover:bg-green-700 text-sm"
                              >
                                ✏️ Editar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Diseño para partidos SIN ASIGNAR (compacto)
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              {/* Info del Partido */}
                              <div className="flex-1">
                                {/* Equipos con logos */}
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="flex items-center gap-2">
                                    {partido.equipoLocal?.club?.logo ? (
                                      <img
                                        src={partido.equipoLocal.club.logo.startsWith('http')
                                          ? partido.equipoLocal.club.logo
                                          : `${SERVER_URL}${partido.equipoLocal.club.logo.startsWith('/') ? partido.equipoLocal.club.logo : '/' + partido.equipoLocal.club.logo}`}
                                        alt={partido.equipoLocal.nombre}
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23e5e7eb"/%3E%3Ctext x="16" y="22" text-anchor="middle" font-size="14"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                    <span className="font-bold text-lg text-gray-900">
                                      {partido.equipoLocal?.nombre || 'Equipo Local'}
                                    </span>
                                  </div>

                                  <span className="text-gray-400 font-bold text-xl">VS</span>

                                  <div className="flex items-center gap-2">
                                    {partido.equipoVisitante?.club?.logo ? (
                                      <img
                                        src={partido.equipoVisitante.club.logo.startsWith('http')
                                          ? partido.equipoVisitante.club.logo
                                          : `${SERVER_URL}${partido.equipoVisitante.club.logo.startsWith('/') ? partido.equipoVisitante.club.logo : '/' + partido.equipoVisitante.club.logo}`}
                                        alt={partido.equipoVisitante.nombre}
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23e5e7eb"/%3E%3Ctext x="16" y="22" text-anchor="middle" font-size="14"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                    <span className="font-bold text-lg text-gray-900">
                                      {partido.equipoVisitante?.nombre || 'Equipo Visitante'}
                                    </span>
                                  </div>

                                  {getEstadoBadge(partido.p_estado)}
                                </div>

                                {/* Información de asignación */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <span className="font-semibold">📅 Fecha:</span>
                                    <span>
                                      {new Date(partido.fecha_hora).toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-gray-600">
                                    <span className="font-semibold">🕐 Hora:</span>
                                    <span>
                                      {new Date(partido.fecha_hora).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <span className="font-semibold text-gray-600">🏟️ Cancha:</span>
                                    <span className="text-orange-600 font-medium">Sin asignar</span>
                                  </div>
                                </div>
                              </div>

                              {/* Botón Asignar */}
                              <button
                                onClick={() => handleAbrirModalAsignar(partido)}
                                className="px-5 py-3 font-semibold rounded-xl transition-all shadow-md whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                              >
                                ⚙️ Asignar Recursos
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de Asignación */}
        {showModalAsignar && partidoSeleccionado && (
          <ModalAsignarRecursos
            partido={partidoSeleccionado}
            onClose={() => setShowModalAsignar(false)}
            onGuardar={handleGuardarAsignacion}
          />
        )}
      </div>
    </div>
  );
}
