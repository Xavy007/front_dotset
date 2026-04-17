import { useState, useEffect } from 'react';
import { MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { fixtureService } from '../services/fixtureService';
import { campeonatoService } from '../services/campeonatoService';
import ModalAsignarRecursos from '../components/ModalAsignarRecursos';
import { toast } from 'sonner';
import { SERVER_URL } from '../services/api.config';

export const PartidosPage = () => {
  // Estado para filtros
  const [campeonatos, setCampeonatos] = useState([]);
  const [selectedCampeonato, setSelectedCampeonato] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para datos
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para UI
  const [expandedDate, setExpandedDate] = useState(null);
  const [editingPartido, setEditingPartido] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar campeonatos al montar componente
  useEffect(() => {
    cargarCampeonatos();
  }, []);

  // Cargar partidos cuando cambia el campeonato o fecha
  useEffect(() => {
    if (selectedCampeonato) {
      cargarPartidos();
    }
  }, [selectedCampeonato, selectedDate]);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      console.log('Campeonatos cargados:', response);
      if (response.success) {
        setCampeonatos(response.data);
        // Seleccionar el primero por defecto
        if (response.data.length > 0) {
          setSelectedCampeonato(response.data[0].id_campeonato);
        }
      }
    } catch (error) {
      console.error('Error cargando campeonatos:', error);
      setError('Error al cargar campeonatos');
    }
  };

  const cargarPartidos = async () => {
    if (!selectedCampeonato) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Cargando partidos para campeonato:', selectedCampeonato, 'fecha:', selectedDate);
      const response = await fixtureService.obtenerTodosLosPartidos(
        selectedCampeonato,
        selectedDate || null
      );
      console.log('Partidos cargados:', response);

      if (response.success) {
        setPartidos(response.data.partidos || []);
      } else {
        setError('No se pudieron cargar los partidos');
      }
    } catch (error) {
      console.error('Error cargando partidos:', error);
      setError('Error al cargar partidos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPartidos = () => {
    let filtered = partidos;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.equipoLocal?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.equipoVisitante?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cancha?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPartidosByDate = () => {
    const filtered = getFilteredPartidos();
    const byDate = {};

    filtered.forEach(partido => {
      let dateKey;
      if (partido.fecha_hora) {
        const fecha = new Date(partido.fecha_hora);
        dateKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        dateKey = 'Sin fecha';
      }

      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(partido);
    });

    // Ordenar por fecha
    const sortedKeys = Object.keys(byDate).sort((a, b) => {
      if (a === 'Sin fecha') return 1;
      if (b === 'Sin fecha') return -1;
      return new Date(a) - new Date(b);
    });

    const sorted = {};
    sortedKeys.forEach(key => {
      sorted[key] = byDate[key];
    });

    return sorted;
  };

  const handleGuardarRecursos = async (data) => {
    if (!editingPartido) return;

    try {
      console.log('Guardando recursos para partido:', editingPartido.id_partido, data);

      const response = await fixtureService.actualizarPartido(editingPartido.id_partido, data);

      if (response.success) {
        console.log('Partido actualizado exitosamente');
        // Recargar partidos
        await cargarPartidos();
        setShowModal(false);
        setEditingPartido(null);
      } else {
        toast.error('Error al actualizar partido');
      }
    } catch (error) {
      console.error('Error actualizando partido:', error);
      toast.error('Error al actualizar partido: ' + error.message);
    }
  };

  const openEditModal = (partido) => {
    setEditingPartido(partido);
    setShowModal(true);
  };

  const formatFecha = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const fecha = new Date(dateString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatHora = (dateString) => {
    if (!dateString) return '--:--';
    const fecha = new Date(dateString);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoriaColor = (categoriaNombre) => {
    if (!categoriaNombre) return 'bg-gray-100 text-gray-700';

    const nombre = categoriaNombre.toLowerCase();
    if (nombre.includes('masculino') || nombre.includes('varones')) {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    } else if (nombre.includes('femenino') || nombre.includes('damas')) {
      return 'bg-pink-100 text-pink-700 border-pink-300';
    } else if (nombre.includes('mixto')) {
      return 'bg-purple-100 text-purple-700 border-purple-300';
    } else if (nombre.includes('infantil') || nombre.includes('junior')) {
      return 'bg-green-100 text-green-700 border-green-300';
    } else {
      return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const partidosByDate = getPartidosByDate();
  const dates = Object.keys(partidosByDate);

  const stats = {
    total: partidos.length,
    asignados: partidos.filter(p => p.id_cancha && p.fecha_hora).length,
    pendientes: partidos.filter(p => !p.id_cancha || !p.fecha_hora).length,
    conJueces: partidos.filter(p => p.asignacionJueces).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📅 Calendario de Partidos
          </h1>
          <p className="text-gray-600">
            Visualiza todos los partidos del campeonato en todas las categorías
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-lg p-6 mb-6 mx-6 rounded-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Campeonato */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏆 Campeonato
              </label>
              <select
                value={selectedCampeonato}
                onChange={(e) => setSelectedCampeonato(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-semibold"
              >
                <option value="">Selecciona un campeonato</option>
                {campeonatos.map(camp => (
                  <option key={camp.id_campeonato} value={camp.id_campeonato}>
                    {camp.nombre} - {camp.anno}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Fecha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📆 Fecha (opcional)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Buscador */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Equipo o cancha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {selectedCampeonato && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mx-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-semibold">Total Partidos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-semibold">Asignados</p>
              <p className="text-3xl font-bold text-green-600">{stats.asignados}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm font-semibold">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm font-semibold">Con Árbitros</p>
              <p className="text-3xl font-bold text-purple-600">{stats.conJueces}</p>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-12 mx-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <span className="ml-4 text-gray-600 font-semibold">Cargando partidos...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 mx-6 rounded-lg">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Sin campeonato seleccionado */}
        {!selectedCampeonato && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mx-6">
            <p className="text-gray-600 text-lg">
              👆 Selecciona un campeonato para ver los partidos
            </p>
          </div>
        )}

        {/* Lista de partidos agrupados por fecha */}
        {selectedCampeonato && !loading && dates.length > 0 && (
          <div className="space-y-4 mx-6 pb-6">
            {dates.map(date => (
              <div key={date} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header de fecha */}
                <button
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all border-b-2 border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">
                        {date === 'Sin fecha' ? '📋' : new Date(date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-xl font-bold text-gray-900 block">
                        {formatFecha(date === 'Sin fecha' ? null : date)}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {partidosByDate[date].length} partido(s)
                      </span>
                    </div>
                  </div>
                  {expandedDate === date ? (
                    <ChevronUp className="text-gray-600" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-600" size={24} />
                  )}
                </button>

                {/* Contenido: Cards de partidos en grid horizontal */}
                {expandedDate === date && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white overflow-x-auto">
                    <div className="flex gap-4 min-w-max">
                      {partidosByDate[date].map((partido) => {
                        const tieneAsignacion = partido.id_cancha && partido.fecha_hora;

                        // Debug: ver estructura completa del partido
                        console.log('🔍 PARTIDO COMPLETO:', JSON.stringify(partido, null, 2));

                        // Intentar todas las rutas posibles para obtener la categoría
                        let categoriaNombre = 'Sin categoría';

                        // Ruta 1: partido.campeonatoCategoria.categoria.nombre
                        if (partido.campeonatoCategoria?.categoria?.nombre) {
                          categoriaNombre = partido.campeonatoCategoria.categoria.nombre;
                          console.log('✅ Categoría encontrada (Ruta 1):', categoriaNombre);
                        }
                        // Ruta 2: partido.jornada.fase.campeonatoCategoria.categoria.nombre
                        else if (partido.jornada?.fase?.campeonatoCategoria?.categoria?.nombre) {
                          categoriaNombre = partido.jornada.fase.campeonatoCategoria.categoria.nombre;
                          console.log('✅ Categoría encontrada (Ruta 2):', categoriaNombre);
                        }
                        // Ruta 3: partido.jornada.grupo.campeonatoCategoria.categoria.nombre
                        else if (partido.jornada?.grupo?.campeonatoCategoria?.categoria?.nombre) {
                          categoriaNombre = partido.jornada.grupo.campeonatoCategoria.categoria.nombre;
                          console.log('✅ Categoría encontrada (Ruta 3):', categoriaNombre);
                        }
                        else {
                          console.log('❌ No se encontró categoría. Estructura:', {
                            campeonatoCategoria: partido.campeonatoCategoria,
                            jornada_fase: partido.jornada?.fase,
                            jornada_grupo: partido.jornada?.grupo
                          });
                        }

                        // Debug: ver logos
                        console.log('🖼️ Logo Local:', partido.equipoLocal?.club?.logo);
                        console.log('🖼️ Logo Visitante:', partido.equipoVisitante?.club?.logo);

                        return (
                          <div
                            key={partido.id_partido}
                            className={`rounded-xl hover:shadow-lg transition-all w-[300px] flex-shrink-0 ${
                              tieneAsignacion
                                ? 'bg-white border-2 border-green-500'
                                : 'bg-yellow-50 border-2 border-yellow-400'
                            }`}
                          >
                            <div className="p-4">
                              {/* Hora y Categoría */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-bold">
                                  {formatHora(partido.fecha_hora)}
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getCategoriaColor(categoriaNombre)}`}>
                                  {categoriaNombre}
                                </span>
                              </div>

                              {/* Equipos enfrentados */}
                              <div className="flex items-center justify-between mb-3">
                                {/* Equipo Local */}
                                <div className="flex flex-col items-center flex-1">
                                  <div className="w-14 h-14 mb-2 flex items-center justify-center">
                                    {partido.equipoLocal?.club?.logo ? (
                                      <img
                                        src={partido.equipoLocal.club.logo.startsWith('http')
                                          ? partido.equipoLocal.club.logo
                                          : `${SERVER_URL}${partido.equipoLocal.club.logo.startsWith('/') ? partido.equipoLocal.club.logo : '/' + partido.equipoLocal.club.logo}`}
                                        alt={partido.equipoLocal.nombre}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23e5e7eb"/%3E%3Ctext x="24" y="32" text-anchor="middle" font-size="20"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 text-center truncate w-full px-1">
                                    {partido.equipoLocal?.nombre || 'Equipo A'}
                                  </span>
                                </div>

                                {/* VS o Resultado */}
                                <div className="px-3 flex flex-col items-center">
                                  {partido.resultado ? (
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-gray-900">
                                        {partido.sets_local || 0} - {partido.sets_visitante || 0}
                                      </div>
                                      <div className="text-[9px] text-gray-500">SETS</div>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-bold text-gray-400">VS</span>
                                  )}
                                </div>

                                {/* Equipo Visitante */}
                                <div className="flex flex-col items-center flex-1">
                                  <div className="w-14 h-14 mb-2 flex items-center justify-center">
                                    {partido.equipoVisitante?.club?.logo ? (
                                      <img
                                        src={partido.equipoVisitante.club.logo.startsWith('http')
                                          ? partido.equipoVisitante.club.logo
                                          : `${SERVER_URL}${partido.equipoVisitante.club.logo.startsWith('/') ? partido.equipoVisitante.club.logo : '/' + partido.equipoVisitante.club.logo}`}
                                        alt={partido.equipoVisitante.nombre}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23e5e7eb"/%3E%3Ctext x="24" y="32" text-anchor="middle" font-size="20"%3E🏐%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">🏐</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 text-center truncate w-full px-1">
                                    {partido.equipoVisitante?.nombre || 'Equipo B'}
                                  </span>
                                </div>
                              </div>

                              {/* Cancha */}
                              <div className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded-lg">
                                <MapPin className="text-green-600 flex-shrink-0" size={12} />
                                <span className={`text-[10px] font-medium truncate ${partido.cancha ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                                  {partido.cancha?.nombre || 'Sin cancha'}
                                </span>
                              </div>

                              {/* Árbitros */}
                              {partido.asignacionJueces && (
                                <div className="mb-2 bg-purple-50 p-2 rounded-lg">
                                  <div className="text-[9px] font-bold text-purple-700 mb-1">ÁRBITROS</div>
                                  {partido.asignacionJueces.arbitro1 && (
                                    <div className="text-[10px] text-gray-700">
                                      👨‍⚖️ {partido.asignacionJueces.arbitro1.persona?.ap || 'Árbitro 1'}
                                    </div>
                                  )}
                                  {partido.asignacionJueces.arbitro2 && (
                                    <div className="text-[10px] text-gray-700">
                                      👨‍⚖️ {partido.asignacionJueces.arbitro2.persona?.ap || 'Árbitro 2'}
                                    </div>
                                  )}
                                  {partido.asignacionJueces.planillero && (
                                    <div className="text-[10px] text-gray-700">
                                      📋 {partido.asignacionJueces.planillero.persona?.ap || 'Planillero'}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Botón de asignar */}
                              <button
                                onClick={() => openEditModal(partido)}
                                className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                                  tieneAsignacion
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                              >
                                {tieneAsignacion ? '⚙️ Asignar' : '⚙️ Asignar'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sin partidos */}
        {selectedCampeonato && !loading && dates.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mx-6">
            <p className="text-gray-600 text-lg">
              No hay partidos {selectedDate ? 'para la fecha seleccionada' : 'registrados'}
            </p>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Ver todos los partidos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Asignar Recursos */}
      {showModal && editingPartido && (
        <ModalAsignarRecursos
          partido={editingPartido}
          onClose={() => {
            setShowModal(false);
            setEditingPartido(null);
          }}
          onGuardar={handleGuardarRecursos}
        />
      )}
    </div>
  );
};

export default PartidosPage;
