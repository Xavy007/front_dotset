// ===============================================
// ARCHIVO: src/pages/ReportesPage.jsx
// Reportes: Rol de Partidos, Tabla de Posiciones, Planillas
// ===============================================

import { useState, useEffect } from 'react';
import {
  FileText, Printer, Calendar, Trophy, Medal,
  Loader2, Search, ChevronRight, Clock, MapPin
} from 'lucide-react';
import { campeonatoService } from '../services/campeonatoService';
import { categoriaService } from '../services/categoriaService';
import { tablaPosicionesService } from '../services/tablaPosicionesService';
import { planillaService } from '../services/planillaService';
import PlanillaFIVB from '../components/PlanillaFIVB';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export function ReportesPage() {
  // Tab activo
  const [activeTab, setActiveTab] = useState('rol-partidos');

  // Filtros generales
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);

  // Estados para cada seccion
  const [partidos, setPartidos] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [partidosFinalizados, setPartidosFinalizados] = useState([]);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para planilla seleccionada
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
  const [datosPlanilla, setDatosPlanilla] = useState(null);
  const [loadingPlanilla, setLoadingPlanilla] = useState(false);

  // Tabs disponibles
  const tabs = [
    { id: 'rol-partidos', label: 'Rol de Partidos', icon: Calendar },
    { id: 'tabla-posiciones', label: 'Tabla de Posiciones', icon: Trophy },
    { id: 'planillas', label: 'Planillas', icon: FileText },
  ];

  // ==================== CARGAR DATOS INICIALES ====================

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  useEffect(() => {
    if (campeonatoSeleccionado) {
      cargarCategorias();
    }
  }, [campeonatoSeleccionado]);

  useEffect(() => {
    if (categoriaSeleccionada) {
      cargarJornadas();
      if (activeTab === 'tabla-posiciones') {
        cargarPosiciones();
      }
      if (activeTab === 'planillas') {
        cargarPartidosFinalizados();
      }
    }
  }, [categoriaSeleccionada]);

  useEffect(() => {
    if (jornadaSeleccionada && activeTab === 'rol-partidos') {
      cargarPartidosJornada();
    }
  }, [jornadaSeleccionada]);

  useEffect(() => {
    if (categoriaSeleccionada) {
      if (activeTab === 'tabla-posiciones') {
        cargarPosiciones();
      } else if (activeTab === 'planillas') {
        cargarPartidosFinalizados();
      } else if (activeTab === 'rol-partidos' && jornadaSeleccionada) {
        cargarPartidosJornada();
      }
    }
  }, [activeTab]);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      if (response.success && response.data) {
        setCampeonatos(response.data);
      }
    } catch (err) {
      console.error('Error al cargar campeonatos:', err);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await categoriaService.getCategoriasByCampeonato(campeonatoSeleccionado.id_campeonato);
      if (response.success && response.data) {
        setCategorias(response.data);
        if (response.data.length > 0) {
          setCategoriaSeleccionada(response.data[0]);
        }
      }
    } catch (err) {
      console.error('Error al cargar categorias:', err);
      setCategorias([]);
    }
  };

  const cargarJornadas = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/jornadas/campeonato-categoria/${categoriaSeleccionada.id_cc}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          }
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        setJornadas(data.data);
        if (data.data.length > 0) {
          setJornadaSeleccionada(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error al cargar jornadas:', err);
      setJornadas([]);
    }
  };

  const cargarPartidosJornada = async () => {
    if (!jornadaSeleccionada || !categoriaSeleccionada) return;
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      // Cargar todos los partidos del id_cc y filtrar por jornada
      const response = await fetch(
        `${API_BASE}/fixture/cc/${categoriaSeleccionada.id_cc}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          }
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        // Filtrar por jornada seleccionada
        const partidosFiltrados = data.data.filter(
          p => p.jornada?.id_jornada === jornadaSeleccionada.id_jornada
        );
        setPartidos(partidosFiltrados);
      } else {
        setPartidos([]);
      }
    } catch (err) {
      console.error('Error al cargar partidos:', err);
      setPartidos([]);
      setError('Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const cargarPosiciones = async () => {
    if (!campeonatoSeleccionado || !categoriaSeleccionada) return;
    setLoading(true);
    setError(null);
    try {
      const idCategoria = categoriaSeleccionada.categoria?.id_categoria || categoriaSeleccionada.id_categoria;
      const response = await tablaPosicionesService.getPorCampeonatoCategoria(
        campeonatoSeleccionado.id_campeonato,
        idCategoria
      );
      if (response.success && response.data) {
        setPosiciones(response.data);
      } else {
        setPosiciones([]);
      }
    } catch (err) {
      console.error('Error al cargar posiciones:', err);
      setPosiciones([]);
      setError('Error al cargar tabla de posiciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarPartidosFinalizados = async () => {
    if (!categoriaSeleccionada) return;
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/fixture/cc/${categoriaSeleccionada.id_cc}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          }
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        const finalizados = data.data.filter(p => p.estado === 'finalizado');
        setPartidosFinalizados(finalizados);
      } else {
        setPartidosFinalizados([]);
      }
    } catch (err) {
      console.error('Error al cargar partidos finalizados:', err);
      setPartidosFinalizados([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarPlanilla = async (idPartido) => {
    setLoadingPlanilla(true);
    try {
      const [partidoDigital, infoPostgres, eventos, setsResponse] = await Promise.all([
        planillaService.getPartidoDigital(idPartido).catch(e => { console.error('Error partidoDigital:', e); return null; }),
        planillaService.getInfoPartidoPostgres(idPartido).catch(e => { console.error('Error infoPostgres:', e); return null; }),
        planillaService.getEventosPartido(idPartido).catch(e => { console.error('Error eventos:', e); return null; }),
        planillaService.getSetsPartido(idPartido).catch(e => { console.error('Error sets:', e); return null; }),
      ]);

      console.log('🔍 Respuesta de sets endpoint:', setsResponse);

      const pg = infoPostgres?.data || {};
      const mongo = partidoDigital?.data || {};
      const setsFromMongo = setsResponse?.data || [];

      console.log('📦 Datos cargados:', { pg, mongo, setsFromMongo, setsResponse });

      // Helper para extraer string de forma SEGURA - nunca devuelve objeto
      const safeString = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'object') {
          // Si es un objeto con propiedad nombre, extraer el nombre
          if (value.nombre !== undefined) {
            return typeof value.nombre === 'string' ? value.nombre : String(value.nombre || '');
          }
          return '';
        }
        return String(value);
      };

      // Extraer datos de forma segura - el backend ahora envía campos string
      const categoriaNombre = safeString(pg.categoria?.nombre);
      const categoriaGenero = safeString(pg.categoria?.genero);
      const campeonatoNombre = safeString(pg.campeonato?.nombre) || safeString(mongo.info_general?.campeonato);
      const canchaNombre = safeString(pg.cancha?.nombre);
      const canchaCiudad = safeString(pg.cancha?.ciudad);

      // Equipos - campos ya formateados desde el backend
      const equipoLocalNombre = safeString(pg.equipo_local?.nombre) || safeString(mongo.equipos?.local?.nombre) || 'Equipo A';
      const equipoLocalClub = safeString(pg.equipo_local?.club?.nombre);
      const equipoVisitanteNombre = safeString(pg.equipo_visitante?.nombre) || safeString(mongo.equipos?.visitante?.nombre) || 'Equipo B';
      const equipoVisitanteClub = safeString(pg.equipo_visitante?.club?.nombre);

      // Mapear árbitros - MongoDB puede tener un ARRAY de objetos [{tipo, nombre}]
      // o un objeto {primer_arbitro: {nombre}} o PostgreSQL {primero: "..."}
      let arbitrajeData = { primer_arbitro: '', segundo_arbitro: '', anotador: '' };

      if (Array.isArray(mongo.arbitraje)) {
        // MongoDB array format: [{tipo: "primer_arbitro", nombre: "..."}, ...]
        mongo.arbitraje.forEach(arb => {
          if (arb.tipo === 'primer_arbitro') arbitrajeData.primer_arbitro = arb.nombre || '';
          if (arb.tipo === 'segundo_arbitro') arbitrajeData.segundo_arbitro = arb.nombre || '';
          if (arb.tipo === 'anotador') arbitrajeData.anotador = arb.nombre || '';
        });
      } else if (mongo.arbitraje) {
        // MongoDB object format: {primer_arbitro: {nombre}, ...}
        arbitrajeData.primer_arbitro = mongo.arbitraje.primer_arbitro?.nombre || mongo.arbitraje.primer_arbitro || '';
        arbitrajeData.segundo_arbitro = mongo.arbitraje.segundo_arbitro?.nombre || mongo.arbitraje.segundo_arbitro || '';
        arbitrajeData.anotador = mongo.arbitraje.anotador?.nombre || mongo.arbitraje.anotador || '';
      }

      // Fallback a PostgreSQL si no hay datos de MongoDB
      if (!arbitrajeData.primer_arbitro) arbitrajeData.primer_arbitro = pg.arbitros?.primero || '';
      if (!arbitrajeData.segundo_arbitro) arbitrajeData.segundo_arbitro = pg.arbitros?.segundo || '';
      if (!arbitrajeData.anotador) arbitrajeData.anotador = pg.arbitros?.anotador || '';

      // Mapear capitanes - pueden estar en mongo.capitanes o en los jugadores con es_capitan: true
      const jugadoresLocalesMongo = mongo.planteles?.local?.jugadores || [];
      const jugadoresVisitantesMongo = mongo.planteles?.visitante?.jugadores || [];

      // Buscar capitán en la lista de jugadores
      const capitanLocal = jugadoresLocalesMongo.find(j => j.es_capitan);
      const capitanVisitante = jugadoresVisitantesMongo.find(j => j.es_capitan);

      const capitanesData = {
        local: mongo.capitanes?.local ? {
          nombre: mongo.capitanes.local.nombre || '',
          dorsal: mongo.capitanes.local.dorsal || '',
        } : capitanLocal ? {
          nombre: capitanLocal.nombre_completo || '',
          dorsal: capitanLocal.numero_dorsal || '',
        } : null,
        visitante: mongo.capitanes?.visitante ? {
          nombre: mongo.capitanes.visitante.nombre || '',
          dorsal: mongo.capitanes.visitante.dorsal || '',
        } : capitanVisitante ? {
          nombre: capitanVisitante.nombre_completo || '',
          dorsal: capitanVisitante.numero_dorsal || '',
        } : null,
      };

      // Mapear planteles desde MongoDB - normalizar nombres de campos
      const plantelesData = {
        local: {
          jugadores: (mongo.planteles?.local?.jugadores || []).map(j => ({
            numero_dorsal: j.numero_dorsal || j.dorsal || '',
            nombre_completo: j.nombre_completo || j.nombre || '',
          })),
        },
        visitante: {
          jugadores: (mongo.planteles?.visitante?.jugadores || []).map(j => ({
            numero_dorsal: j.numero_dorsal || j.dorsal || '',
            nombre_completo: j.nombre_completo || j.nombre || '',
          })),
        },
      };

      // Construir sets desde el endpoint separado de MongoDB o desde mongo.sets
      // La estructura es: {puntos_local, puntos_visitante, numero_set, ganador}
      let setsData = [];

      // Priorizar los sets del endpoint separado
      if (setsFromMongo && setsFromMongo.length > 0) {
        setsData = setsFromMongo.map(set => ({
          numero_set: set.numero_set,
          puntos_local: set.puntos_local,
          puntos_visitante: set.puntos_visitante,
          ganador: set.ganador,
        })).sort((a, b) => a.numero_set - b.numero_set);
      } else if (mongo.sets && mongo.sets.length > 0) {
        // Fallback a mongo.sets si existe
        setsData = mongo.sets;
      }

      const resultadoData = mongo.resultado || {
        sets_local: pg.sets_local || 0,
        sets_visitante: pg.sets_visitante || 0
      };

      // Si no hay detalles de sets pero hay resultado, crear placeholder
      if (setsData.length === 0 && (resultadoData.sets_local > 0 || resultadoData.sets_visitante > 0)) {
        const totalSets = (resultadoData.sets_local || 0) + (resultadoData.sets_visitante || 0);
        for (let i = 0; i < totalSets; i++) {
          setsData.push({ puntos_local: '-', puntos_visitante: '-' });
        }
      }

      console.log('📊 Datos cargados para planilla:', {
        arbitraje: arbitrajeData,
        capitanes: capitanesData,
        planteles: plantelesData,
        sets: setsData,
        resultado: resultadoData
      });

      setDatosPlanilla({
        idPartido,
        postgres: pg,
        mongo: mongo,
        eventos: eventos?.data || [],
        datosGenerales: {
          competicion: campeonatoNombre,
          ciudad: canchaCiudad,
          lugar: canchaNombre,
          fecha: safeString(pg.fecha_partido) || (pg.fecha_hora ? String(pg.fecha_hora).split('T')[0] : ''),
          hora: safeString(pg.hora_partido),
          categoria: categoriaNombre,
          genero: categoriaGenero,
          equipoA: {
            nombre: equipoLocalNombre,
            club: equipoLocalClub,
          },
          equipoB: {
            nombre: equipoVisitanteNombre,
            club: equipoVisitanteClub,
          },
        },
        resultado: resultadoData,
        arbitraje: arbitrajeData,
        capitanes: capitanesData,
        planteles: plantelesData,
        sets: setsData,
      });

      setPlanillaSeleccionada(idPartido);
    } catch (err) {
      console.error('Error al cargar planilla:', err);
      setError('Error al cargar la planilla del partido');
    } finally {
      setLoadingPlanilla(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  // ==================== RENDER MEDALLA ====================

  const renderPosicionMedalla = (pos) => {
    if (pos === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full">
          <Medal className="text-yellow-800" size={18} />
        </div>
      );
    } else if (pos === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
          <Medal className="text-gray-600" size={18} />
        </div>
      );
    } else if (pos === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-amber-600 rounded-full">
          <Medal className="text-amber-900" size={18} />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-gray-700 font-bold">
        {pos}
      </div>
    );
  };

  // ==================== RENDER ROL DE PARTIDOS ====================

  const renderRolPartidos = () => (
    <div>
      {/* Selector de Jornada */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Jornada</label>
        <select
          value={jornadaSeleccionada?.id_jornada || ''}
          onChange={(e) => {
            const jornada = jornadas.find(j => j.id_jornada === parseInt(e.target.value));
            setJornadaSeleccionada(jornada);
          }}
          disabled={jornadas.length === 0}
          className="w-full max-w-xs px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona una jornada</option>
          {jornadas.map((j) => (
            <option key={j.id_jornada} value={j.id_jornada}>
              {j.nombre || `Jornada ${j.numero}`}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Partidos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : partidos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay partidos en esta jornada</p>
        </div>
      ) : (
        <div className="space-y-4 print-section">
          <div className="print-header hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold">{String(campeonatoSeleccionado?.nombre || '')}</h2>
            <p>{String(categoriaSeleccionada?.categoria?.nombre || categoriaSeleccionada?.nombre || '')} - {String(jornadaSeleccionada?.nombre || `Jornada ${jornadaSeleccionada?.numero || ''}`)}</p>
          </div>

          {partidos.map((partido) => {
            const localNombre = String(partido.equipo_local?.nombre || 'Local');
            const localClub = String(partido.equipo_local?.club?.nombre || '');
            const visitanteNombre = String(partido.equipo_visitante?.nombre || 'Visitante');
            const visitanteClub = String(partido.equipo_visitante?.club?.nombre || '');

            return (
            <div key={partido.id_partido} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="text-right flex-1">
                      <p className="font-semibold text-gray-900">{localNombre}</p>
                      <p className="text-sm text-gray-500">{localClub}</p>
                    </div>
                    <div className="text-center px-4">
                      {partido.estado === 'finalizado' ? (
                        <div className="text-2xl font-bold text-blue-600">
                          {partido.sets_local || 0} - {partido.sets_visitante || 0}
                        </div>
                      ) : (
                        <div className="text-lg text-gray-400">VS</div>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">{visitanteNombre}</p>
                      <p className="text-sm text-gray-500">{visitanteClub}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {partido.hora_partido || 'Por definir'}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {typeof partido.cancha?.nombre === 'string' ? partido.cancha.nombre : 'Por definir'}
                  </div>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                    partido.estado === 'finalizado' ? 'bg-green-100 text-green-800' :
                    partido.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {partido.estado === 'finalizado' ? 'Finalizado' :
                     partido.estado === 'en_curso' ? 'En Curso' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          )})}

          <div className="mt-6 no-print">
            <button
              onClick={handleImprimir}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Imprimir Rol de Partidos
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== RENDER TABLA DE POSICIONES ====================

  const renderTablaPosiciones = () => (
    <div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : posiciones.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay datos en la tabla de posiciones</p>
        </div>
      ) : (
        <div className="print-section">
          <div className="print-header hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold">{campeonatoSeleccionado?.nombre}</h2>
            <p>Tabla de Posiciones - {String(categoriaSeleccionada?.categoria?.nombre || categoriaSeleccionada?.nombre || '')}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-3 py-3 text-center w-12">Pos</th>
                  <th className="px-3 py-3 text-left">Equipo</th>
                  <th className="px-3 py-3 text-center w-12">PJ</th>
                  <th className="px-3 py-3 text-center w-12">G</th>
                  <th className="px-3 py-3 text-center w-12">P</th>
                  <th className="px-3 py-3 text-center w-14">SG</th>
                  <th className="px-3 py-3 text-center w-14">SP</th>
                  <th className="px-3 py-3 text-center w-14">DS</th>
                  <th className="px-3 py-3 text-center w-14">PF</th>
                  <th className="px-3 py-3 text-center w-14">PC</th>
                  <th className="px-3 py-3 text-center w-14">DP</th>
                  <th className="px-3 py-3 text-center w-16 bg-blue-800">PTS</th>
                </tr>
              </thead>
              <tbody>
                {posiciones.map((pos, index) => (
                  <tr key={pos.id_tabla || index} className={`border-b hover:bg-blue-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        {renderPosicionMedalla(pos.posicion)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-gray-900">{pos.equipo?.nombre || 'Equipo'}</div>
                      <div className="text-sm text-gray-500">{pos.equipo?.club?.nombre || ''}</div>
                    </td>
                    <td className="px-3 py-3 text-center">{pos.partidos_jugados || 0}</td>
                    <td className="px-3 py-3 text-center text-green-600 font-medium">{pos.ganados || 0}</td>
                    <td className="px-3 py-3 text-center text-red-600 font-medium">{pos.perdidos || 0}</td>
                    <td className="px-3 py-3 text-center">{pos.sets_ganados || 0}</td>
                    <td className="px-3 py-3 text-center">{pos.sets_perdidos || 0}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={pos.diferencia_sets > 0 ? 'text-green-600' : pos.diferencia_sets < 0 ? 'text-red-600' : ''}>
                        {pos.diferencia_sets > 0 ? '+' : ''}{pos.diferencia_sets || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">{pos.puntos_favor || 0}</td>
                    <td className="px-3 py-3 text-center">{pos.puntos_contra || 0}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={pos.diferencia_puntos > 0 ? 'text-green-600' : pos.diferencia_puntos < 0 ? 'text-red-600' : ''}>
                        {pos.diferencia_puntos > 0 ? '+' : ''}{pos.diferencia_puntos || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                        {pos.puntos || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Sistema de puntos:</strong> Victoria = 2 pts | Derrota = 1 pt | WO = 2 pts (ganador), 0 pts (perdedor)</p>
          </div>

          <div className="mt-6 no-print">
            <button
              onClick={handleImprimir}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Imprimir Tabla de Posiciones
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== RENDER PLANILLAS ====================

  const renderListaPlanillas = () => (
    <div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : partidosFinalizados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay partidos finalizados con planilla disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partidosFinalizados.map((partido) => {
            const localNombre = String(partido.equipo_local?.nombre || 'Local');
            const visitanteNombre = String(partido.equipo_visitante?.nombre || 'Visitante');

            return (
            <div
              key={partido.id_partido}
              onClick={() => cargarPlanilla(partido.id_partido)}
              className="bg-white border rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Finalizado
                </span>
                <span className="text-xs text-gray-500">
                  {partido.fecha_partido || 'Sin fecha'}
                </span>
              </div>

              <div className="text-center mb-3">
                <div className="font-semibold text-gray-900">{localNombre}</div>
                <div className="text-2xl font-bold text-blue-600 my-2">
                  {partido.resultado_local ?? partido.sets_local ?? 0} - {partido.resultado_visitante ?? partido.sets_visitante ?? 0}
                </div>
                <div className="font-semibold text-gray-900">{visitanteNombre}</div>
              </div>

              <div className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800">
                Ver Planilla <ChevronRight size={16} />
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );

  const renderPlanillaDetalle = () => {
    if (loadingPlanilla) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      );
    }

    if (!datosPlanilla) return null;

    // Usar el componente PlanillaFIVB
    return (
      <PlanillaFIVB
        datos={datosPlanilla}
        onClose={() => {
          setPlanillaSeleccionada(null);
          setDatosPlanilla(null);
        }}
      />
    );
  };

  const renderPlanillas = () => {
    if (planillaSeleccionada) {
      return renderPlanillaDetalle();
    }
    return renderListaPlanillas();
  };

  // ==================== RENDER PRINCIPAL ====================

  return (
    <div>
      {/* Header */}
      <div className="mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          Reportes
        </h1>
        <p className="text-gray-600 mt-1">Imprime rol de partidos, tablas de posiciones y planillas</p>
      </div>

      {/* Filtros de Campeonato y Categoria */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Campeonato</label>
            <select
              value={campeonatoSeleccionado?.id_campeonato || ''}
              onChange={(e) => {
                const camp = campeonatos.find(c => c.id_campeonato === parseInt(e.target.value));
                setCampeonatoSeleccionado(camp);
                setCategoriaSeleccionada(null);
                setJornadaSeleccionada(null);
                setPartidos([]);
                setPosiciones([]);
                setPartidosFinalizados([]);
              }}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un campeonato</option>
              {campeonatos.map((camp) => (
                <option key={camp.id_campeonato} value={camp.id_campeonato}>
                  {camp.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
            <select
              value={categoriaSeleccionada?.id_cc || ''}
              onChange={(e) => {
                const cat = categorias.find(c => c.id_cc === parseInt(e.target.value));
                setCategoriaSeleccionada(cat);
                setJornadaSeleccionada(null);
              }}
              disabled={!campeonatoSeleccionado}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{campeonatoSeleccionado ? 'Selecciona una categoria' : 'Primero selecciona un campeonato'}</option>
              {categorias.map((cat) => (
                <option key={cat.id_cc} value={cat.id_cc}>
                  {cat.categoria?.nombre || cat.nombre} - {cat.categoria?.genero || cat.genero}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-sm border-b no-print">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPlanillaSeleccionada(null);
                setDatosPlanilla(null);
              }}
              className={`px-6 py-4 flex items-center gap-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-b-lg shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 no-print">
            {error}
          </div>
        )}

        {!campeonatoSeleccionado || !categoriaSeleccionada ? (
          <div className="text-center py-12 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Selecciona un campeonato y categoria para ver los reportes</p>
          </div>
        ) : (
          <>
            {activeTab === 'rol-partidos' && renderRolPartidos()}
            {activeTab === 'tabla-posiciones' && renderTablaPosiciones()}
            {activeTab === 'planillas' && renderPlanillas()}
          </>
        )}
      </div>

      {/* Estilos de impresion */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-section {
            padding: 20px;
          }

          .print-header {
            display: block !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportesPage;
