// ===============================================
// ARCHIVO: src/pages/PlanillaFIVB.jsx
// Planilla de Anotación FIVB - Carga datos desde MongoDB
// ===============================================

import React, { useState, useEffect } from 'react';
import { Printer, Download, RefreshCw, Search, ArrowLeft, Loader2, ClipboardList } from 'lucide-react';
import { planillaService } from '../services/planillaService';
import { API_BASE } from '../services/api.config';
import { useAsociacion } from '../hooks/useAsociacion';

// ──────────────────────────────────────────────────────────
// Selector de partido (pantalla inicial)
// ──────────────────────────────────────────────────────────
function SelectorPartido({ idPartido, setIdPartido, onCargar, onCargarId, loading, error }) {
  const [campeonatos, setCampeonatos]         = useState([]);
  const [idCampeonatoSel, setIdCampeonatoSel] = useState('');
  const [partidos, setPartidos]               = useState([]);
  const [cargandoCamp, setCargandoCamp]       = useState(false);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [busqueda, setBusqueda]               = useState('');

  const headers = () => {
    const token = sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  // Cargar lista de campeonatos al montar
  useEffect(() => {
    const cargar = async () => {
      setCargandoCamp(true);
      try {
        const res  = await fetch(`${API_BASE}/campeonato`, { headers: headers() });
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.data || data.campeonatos || []);
        setCampeonatos(lista);
      } catch (e) {
        console.error('Error cargando campeonatos:', e);
      } finally {
        setCargandoCamp(false);
      }
    };
    cargar();
  }, []);

  // Cargar partidos cuando cambia el campeonato seleccionado
  useEffect(() => {
    if (!idCampeonatoSel) { setPartidos([]); return; }
    const cargar = async () => {
      setCargandoPartidos(true);
      try {
        const res  = await fetch(`${API_BASE}/fixture/campeonato/${idCampeonatoSel}/todos`, { headers: headers() });
        const data = await res.json();
        // el endpoint retorna { success, data: { partidos: [...] } }
        const lista = data.data?.partidos || data.data || [];
        setPartidos(lista);
      } catch (e) {
        console.error('Error cargando partidos:', e);
        setPartidos([]);
      } finally {
        setCargandoPartidos(false);
      }
    };
    cargar();
  }, [idCampeonatoSel]);

  const filtrados = partidos.filter(p => {
    const txt   = busqueda.toLowerCase();
    const local = p.equipoLocal?.nombre  || '';
    const visit = p.equipoVisitante?.nombre || '';
    return local.toLowerCase().includes(txt) || visit.toLowerCase().includes(txt) || String(p.id_partido).includes(txt);
  });

  const estadoChip = (estado) => {
    switch (estado) {
      case 'finalizado': return 'bg-green-100 text-green-700';
      case 'en_juego':   return 'bg-blue-100 text-blue-700';
      case 'programado': return 'bg-gray-100 text-gray-500';
      default:           return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatFecha = (fechaHora) => {
    if (!fechaHora) return 'Sin fecha';
    const d = new Date(fechaHora);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
         + ' ' + d.toTimeString().slice(0, 5);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList size={28} className="text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planilla FIVB</h1>
          <p className="text-sm text-gray-500">Selecciona el campeonato y el partido</p>
        </div>
      </div>

      {/* Paso 1: Campeonato */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">1. Seleccionar Campeonato</p>
        {cargandoCamp ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
            <Loader2 className="animate-spin" size={16} /> Cargando campeonatos...
          </div>
        ) : (
          <select
            value={idCampeonatoSel}
            onChange={(e) => { setIdCampeonatoSel(e.target.value); setBusqueda(''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">— Elige un campeonato —</option>
            {campeonatos.map(c => (
              <option key={c.id_campeonato} value={c.id_campeonato}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Paso 2: Lista de partidos */}
      {idCampeonatoSel && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700 flex-1">2. Seleccionar Partido</p>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar equipo..."
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {cargandoPartidos ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm">Cargando partidos...</span>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {partidos.length === 0 ? 'No hay partidos en este campeonato' : 'Sin resultados'}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {filtrados.map((p) => (
                <button
                  key={p.id_partido}
                  onClick={() => onCargarId(String(p.id_partido))}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-gray-400 w-8 shrink-0 text-center">#{p.id_partido}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {p.equipoLocal?.nombre || '—'}
                      <span className="text-gray-400 font-normal mx-1">vs</span>
                      {p.equipoVisitante?.nombre || '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex gap-2 flex-wrap">
                      <span>{formatFecha(p.fecha_hora)}</span>
                      {p.cancha?.nombre && <span>· {p.cancha.nombre}</span>}
                      {p.campeonatoCategoria?.categoria?.nombre && <span>· {p.campeonatoCategoria.categoria.nombre}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${estadoChip(p.p_estado)}`}>
                    {p.p_estado}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Acceso rápido por ID (colapsado) */}
      <details className="bg-white rounded-xl shadow-sm border border-gray-200">
        <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none hover:text-gray-700">
          Ingresar ID de partido manualmente
        </summary>
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <input
            type="number"
            value={idPartido}
            onChange={(e) => setIdPartido(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCargar()}
            placeholder="Ej: 1, 2, 3..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={onCargar}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            {loading ? 'Cargando...' : 'Cargar'}
          </button>
        </div>
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </details>
    </div>
  );
}

export function PlanillaFIVB() {
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idPartido, setIdPartido] = useState('');
  const [partidoCargado, setPartidoCargado] = useState(false);
  const [mostrarPlanilla, setMostrarPlanilla] = useState(false);

  // Datos del partido
  const [datosPartido, setDatosPartido] = useState({
    competicion: '',
    ciudad: '',
    codigo: '',
    lugar: '',
    partidoNum: '',
    division: 'M',
    categoria: 'Sen',
    categoriaNombre: '',
    fecha: '',
    hora: '',
    equipoA: { nombre: '', abreviatura: 'A' },
    equipoB: { nombre: '', abreviatura: 'B' },
  });

  // Sets con puntos y rotaciones
  const [sets, setSets] = useState([
    createEmptySet(1, 'A'),
    createEmptySet(2, 'B'),
    createEmptySet(3, 'A'),
    createEmptySet(4, 'B'),
    createEmptySet(5, 'A'),
  ]);

  // Resultados
  const [resultados, setResultados] = useState({
    sets: [
      { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
      { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
      { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
      { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
      { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    ],
    totalA: { t: '', s: '', g: '' },
    totalB: { t: '', s: '', g: '' },
    ganador: '',
    marcadorFinal: '',
  });

  // Sanciones
  const [sanciones, setSanciones] = useState([
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
  ]);

  // Árbitros y firmas
  const [arbitros, setArbitros] = useState({
    primero: '',
    segundo: '',
    anotador: '',
    capA: '',
    capB: '',
  });

  const [observaciones, setObservaciones] = useState('');
  const { asociacion } = useAsociacion();
  const [zoom, setZoom] = useState(1);
  const [debugMongo, setDebugMongo] = useState(null); // null=no cargado, true=OK, string=error

  // Sincronizar ciudad cuando asociacion carga después de que cargar() ya corrió
  useEffect(() => {
    if (asociacion?.ciudad && partidoCargado) {
      setDatosPartido(prev => prev.ciudad ? prev : { ...prev, ciudad: asociacion.ciudad });
    }
  }, [asociacion, partidoCargado]);

  // Bloquear scroll del body cuando la planilla está activa + calcular zoom inicial
  useEffect(() => {
    if (!mostrarPlanilla) return;
    const hojaW = 297 * 3.78; // ~1123px
    const zoomInicial = Math.round(Math.min(1, (window.innerWidth - 40) / hojaW) * 10) / 10;
    setZoom(Math.max(0.7, zoomInicial)); // mínimo 70% para que no sea ilegible
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mostrarPlanilla]);

  const zoomIn  = () => setZoom(z => Math.min(1.5, +( z + 0.1).toFixed(1)));
  const zoomOut = () => setZoom(z => Math.max(0.5, +( z - 0.1).toFixed(1)));
  const zoomReset = () => {
    const hojaW = 297 * 3.78;
    setZoom(Math.max(0.7, Math.round(Math.min(1, (window.innerWidth - 40) / hojaW) * 10) / 10));
  };

  // Helper para crear set vacío
  function createEmptySet(numero, saqueInicial) {
    return {
      numero,
      saqueInicial,
      puntosTachadosA: [],
      puntosTachadosB: [],
      puntajeFinalA: 0,
      puntajeFinalB: 0,
      rotacionesA: createEmptyRotaciones(),
      rotacionesB: createEmptyRotaciones(),
      horaInicio: '',
      horaFin: '',
    };
  }

  function createEmptyRotaciones() {
    return ['I', 'II', 'III', 'IV', 'V', 'VI'].map((pos) => ({
      posicion: pos,
      numero: '',
      jugador: '',
      libero: '',
      saques: Array(8).fill(false),
    }));
  }

  // Cargar datos del partido (idOverride permite pasar el ID directamente desde la lista)
  const cargarPartido = async (idOverride) => {
    const idFinal = idOverride || idPartido;
    if (!idFinal) {
      setError('Ingrese un ID de partido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (idOverride) setIdPartido(idOverride);

      let infoPostgres = null;
      let planillaCompleta = null;
      let setsDirectos = null;
      let errPg = null;
      let errMongo = null;
      let errSets = null;

      let formacionesDirectas = null;
      [infoPostgres, planillaCompleta, setsDirectos, formacionesDirectas] = await Promise.all([
        planillaService.getInfoPartidoPostgres(idFinal).catch(e => { errPg = e.message; return null; }),
        planillaService.getPlanillaCompleta(idFinal).catch(e => { errMongo = e.message; return null; }),
        planillaService.getSetsPartido(idFinal).catch(e => { errSets = e.message; return null; }),
        planillaService.getFormacionesPartido(idFinal).catch(() => null),
      ]);

      const pg    = infoPostgres?.data || {};
      const mongo = planillaCompleta?.data || {};
      const setsRaw = (mongo.sets?.length ? mongo.sets : null)
                   || (setsDirectos?.data?.length ? setsDirectos.data : null)
                   || [];

      console.log('📋 PG:', pg);
      console.log('📋 Planilla completa:', mongo, '| error:', errMongo);
      console.log('📋 Sets directos:', setsDirectos, '| error:', errSets);
      console.log('📋 Sets usados:', setsRaw);

      if (setsRaw.length > 0) {
        setDebugMongo(`${setsRaw.length} set(s) cargados desde MongoDB`);
      } else if (errMongo) {
        setDebugMongo(`Sin datos MongoDB: ${errMongo}`);
      } else {
        setDebugMongo('Sin puntajes por set en MongoDB');
      }

      // Necesitamos al menos los datos de PostgreSQL para mostrar la planilla
      if (!infoPostgres?.data) {
        const detalle = errPg ? ` (${errPg})` : '';
        setError(`No se encontraron datos del partido #${idFinal} en PostgreSQL${detalle}`);
        return;
      }

      // Nombres de equipo: PostgreSQL > MongoDB
      const nombreA = pg.equipo_local?.nombre     || mongo.equipos?.local?.nombre     || 'Equipo A';
      const nombreB = pg.equipo_visitante?.nombre  || mongo.equipos?.visitante?.nombre || 'Equipo B';

      const catNombre = pg.categoria?.nombre || '';
      const catRadio  = catNombre.toLowerCase().includes('jun') ? 'Jun' : 'Sen';

      setDatosPartido({
        competicion:     pg.campeonato?.nombre   || '',
        ciudad:          asociacion?.ciudad       || '',
        codigo:          pg.id_partido            || idFinal,
        lugar:           pg.cancha?.nombre        || '',
        partidoNum:      pg.id_partido            || idFinal,
        division:        pg.categoria?.genero === 'F' ? 'F' : 'M',
        categoria:       catRadio,
        categoriaNombre: catNombre,
        fecha:           pg.fecha_partido         || '',
        hora:            pg.hora_partido          || '',
        equipoA: { nombre: nombreA, abreviatura: 'A' },
        equipoB: { nombre: nombreB, abreviatura: 'B' },
      });

      // Árbitros: PostgreSQL (asignación formal) > MongoDB (árbitro que usó la app)
      const arbPostgres = pg.arbitros || {};
      const arbMongo    = mongo.arbitraje || {};
      setArbitros({
        primero:  arbPostgres.primero  || arbMongo.primer_arbitro?.nombre_completo  || '',
        segundo:  arbPostgres.segundo  || arbMongo.segundo_arbitro?.nombre_completo || '',
        anotador: arbPostgres.anotador || arbMongo.anotador?.nombre                 || '',
        capA:     mongo.aprobaciones?.capitan_local?.nombre                         || '',
        capB:     mongo.aprobaciones?.capitan_visitante?.nombre                     || '',
      });

      // Mapa dorsal→nombre para Local y Visitante (desde planteles de MongoDB)
      const plantillaLocal     = mongo.equipos?.local?.plantilla     || [];
      const plantillaVisitante = mongo.equipos?.visitante?.plantilla || [];
      const mapDorsalLocal     = {};
      const mapDorsalVisitante = {};
      plantillaLocal.forEach(j     => { mapDorsalLocal[j.numero_dorsal]     = j.nombre_completo || ''; });
      plantillaVisitante.forEach(j => { mapDorsalVisitante[j.numero_dorsal] = j.nombre_completo || ''; });

      // Sets ganados: contar directamente por puntaje en cada set (ignora campo ganador y PostgreSQL)
      // Solo incluye sets con al menos 1 punto jugado para evitar sets vacíos del sistema
      const setsConPuntos = setsRaw.filter(s => ((s.puntos_local ?? 0) + (s.puntos_visitante ?? 0)) > 0);
      const setsLocal     = setsConPuntos.length > 0
        ? setsConPuntos.filter(s => (s.puntos_local ?? 0) > (s.puntos_visitante ?? 0)).length
        : (pg.sets_local ?? 0);
      const setsVisitante = setsConPuntos.length > 0
        ? setsConPuntos.filter(s => (s.puntos_visitante ?? 0) > (s.puntos_local ?? 0)).length
        : (pg.sets_visitante ?? 0);
      const marcadorLocal = pg.marcador_local ?? 0;
      const marcadorVisit = pg.marcador_visitante ?? 0;

      // Cuadrícula de puntos tachados: viene de los eventos detallados de MongoDB
      let setsActualizados = [
        createEmptySet(1, 'A'), createEmptySet(2, 'B'), createEmptySet(3, 'A'),
        createEmptySet(4, 'B'), createEmptySet(5, 'A'),
      ];

      // Puntajes finales por set: planilla completa > sets directos
      const puntajesPorSet = {};
      setsRaw.forEach(s => {
        const idx = (s.numero_set || 1) - 1;
        if (idx >= 0 && idx < 5) {
          const pl = s.puntos_local   ?? 0;
          const pv = s.puntos_visitante ?? 0;
          // Ignorar sets sin puntos (sets vacíos creados por el app al finalizar)
          if (pl === 0 && pv === 0) return;
          puntajesPorSet[idx] = { local: pl, visitante: pv };
          setsActualizados[idx].puntajeFinalA = pl;
          setsActualizados[idx].puntajeFinalB = pv;

          // Puntos tachados desde eventos embebidos (solo en planilla completa)
          if (s.eventos && Array.isArray(s.eventos)) {
            s.eventos.forEach(ev => {
              if (ev.tipo_evento === 'punto' && ev.marcador) {
                const eq = ev.punto?.resultado?.equipo_anota;
                if (eq === 'local' && !setsActualizados[idx].puntosTachadosA.includes(ev.marcador.local))
                  setsActualizados[idx].puntosTachadosA.push(ev.marcador.local);
                if (eq === 'visitante' && !setsActualizados[idx].puntosTachadosB.includes(ev.marcador.visitante))
                  setsActualizados[idx].puntosTachadosB.push(ev.marcador.visitante);
              }
            });
          }

          // Formación inicial del set → rotaciones
          // Prioridad: embebida en planilla completa > endpoint directo de formaciones
          const fiDirecta = (formacionesDirectas?.data || []).find(f => f.numero_set === (idx + 1));
          const fi = s.formacion_inicial || fiDirecta;
          if (fi) {
            const POSICIONES = ['I', 'II', 'III', 'IV', 'V', 'VI'];
            if (fi.formacion_local) {
              setsActualizados[idx].rotacionesA = POSICIONES.map(pos => {
                const dorsal = fi.formacion_local[`posicion_${pos}`];
                return {
                  posicion: pos,
                  numero:   dorsal != null ? String(dorsal) : '',
                  jugador:  dorsal != null ? (mapDorsalLocal[dorsal] || '') : '',
                  libero:   '',
                  saques:   Array(8).fill(false),
                };
              });
            }
            if (fi.formacion_visitante) {
              setsActualizados[idx].rotacionesB = POSICIONES.map(pos => {
                const dorsal = fi.formacion_visitante[`posicion_${pos}`];
                return {
                  posicion: pos,
                  numero:   dorsal != null ? String(dorsal) : '',
                  jugador:  dorsal != null ? (mapDorsalVisitante[dorsal] || '') : '',
                  libero:   '',
                  saques:   Array(8).fill(false),
                };
              });
            }
          }
        }
      });

      setSets(setsActualizados);

      setResultados((prev) => {
        const nuevosSets = prev.sets.map((s, idx) => ({
          ...s,
          gA: puntajesPorSet[idx] !== undefined ? puntajesPorSet[idx].local     : '',
          gB: puntajesPorSet[idx] !== undefined ? puntajesPorSet[idx].visitante  : '',
        }));
        return {
          ...prev,
          sets: nuevosSets,
          ganador:       setsLocal > setsVisitante ? nombreA : setsVisitante > setsLocal ? nombreB : '',
          marcadorFinal: setsLocal || setsVisitante ? `${setsLocal} : ${setsVisitante}` : '',
          totalA: { ...prev.totalA, g: setsLocal,     s: marcadorLocal },
          totalB: { ...prev.totalB, g: setsVisitante, s: marcadorVisit },
        };
      });

      setPartidoCargado(true);
      setMostrarPlanilla(true);
    } catch (err) {
      console.error('Error cargando partido:', err);
      setError(err.message || 'Error al cargar el partido');
    } finally {
      setLoading(false);
    }
  };

  // Toggle punto (manual)
  const togglePunto = (setIdx, equipo, punto) => {
    setSets((prev) => {
      const nuevosSets = [...prev];
      const campo = equipo === 'A' ? 'puntosTachadosA' : 'puntosTachadosB';

      if (nuevosSets[setIdx][campo].includes(punto)) {
        nuevosSets[setIdx][campo] = nuevosSets[setIdx][campo].filter((p) => p !== punto);
      } else {
        nuevosSets[setIdx][campo] = [...nuevosSets[setIdx][campo], punto];
      }

      return nuevosSets;
    });
  };

  // Toggle saque
  const toggleSaque = (setIdx, equipo, rotIdx, saqueIdx) => {
    setSets((prev) => {
      const nuevosSets = [...prev];
      const campo = equipo === 'A' ? 'rotacionesA' : 'rotacionesB';
      nuevosSets[setIdx][campo][rotIdx].saques[saqueIdx] =
        !nuevosSets[setIdx][campo][rotIdx].saques[saqueIdx];
      return nuevosSets;
    });
  };

  // Imprimir
  const handleImprimir = () => {
    window.print();
  };

  // Volver
  const handleVolver = () => {
    setMostrarPlanilla(false);
    setPartidoCargado(false);
  };

  // Componente SetBox
  const SetBox = ({ setIdx, setData }) => {
    const esSetImpar = setIdx % 2 === 0;
    const teamALabel = esSetImpar ? 'A' : 'B';
    const teamBLabel = esSetImpar ? 'B' : 'A';

    return (
      <div style={{ marginBottom: '5px' }}>
        {/* Denominación SET N */}
        <div style={{
          background: '#1e3a5f',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '9px',
          padding: '2px 0',
          letterSpacing: '1px',
          border: '2px solid #000',
          borderBottom: 'none',
        }}>
          SET {setIdx + 1}
        </div>

      <div className="set-box" style={{ marginBottom: 0 }}>
        {/* Lateral izquierdo */}
        <div className="set-lat">
          <div>
            In:{' '}
            <input
              value={setData.horaInicio}
              onChange={(e) => {
                const nuevosSets = [...sets];
                nuevosSets[setIdx].horaInicio = e.target.value;
                setSets(nuevosSets);
              }}
              style={{ width: '25px', borderBottom: '1px solid black' }}
            />
          </div>
          <div>S</div>
        </div>

        {/* Equipo A */}
        <div className="col">
          <div className="equipo-head">
            <div
              className={`bola ${setData.saqueInicial === 'A' ? 'bola-activa' : ''}`}
              onClick={() => {
                const nuevosSets = [...sets];
                nuevosSets[setIdx].saqueInicial = 'A';
                setSets(nuevosSets);
              }}
            >
              {teamALabel}
            </div>
            <input
              value={datosPartido.equipoA.nombre}
              readOnly
              placeholder="Equipo"
              style={{ fontSize: '9px' }}
            />
          </div>
          <div className="rot-grid">
            {setData.rotacionesA.map((rot, rotIdx) => (
              <div key={rotIdx} className="jug-col">
                <div className="cell-gray">{rot.posicion}</div>
                <div className="cell-std">
                  <input
                    value={rot.numero}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesA[rotIdx].numero = e.target.value;
                      setSets(nuevosSets);
                    }}
                    placeholder="#"
                  />
                </div>
                <div className="cell-std">
                  <input
                    value={rot.jugador}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesA[rotIdx].jugador = e.target.value;
                      setSets(nuevosSets);
                    }}
                  />
                </div>
                <div className="cell-std">
                  <input
                    value={rot.libero}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesA[rotIdx].libero = e.target.value;
                      setSets(nuevosSets);
                    }}
                  />
                </div>
                <div className="saques">
                  {rot.saques.map((activo, sqIdx) => (
                    <div
                      key={sqIdx}
                      className={`sq ${activo ? 'ok' : ''}`}
                      onClick={() => toggleSaque(setIdx, 'A', rotIdx, sqIdx)}
                    >
                      <span>{sqIdx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Puntos Equipo A */}
        <div className="pts-col">
          {Array.from({ length: 48 }, (_, i) => i + 1).map((punto) => (
            <div
              key={punto}
              className={`pt ${setData.puntosTachadosA.includes(punto) ? 'tachado' : ''}`}
              onClick={() => togglePunto(setIdx, 'A', punto)}
            >
              {punto}
            </div>
          ))}
        </div>

        {/* Puntos Equipo B */}
        <div className="pts-col der">
          {Array.from({ length: 48 }, (_, i) => i + 1).map((punto) => (
            <div
              key={punto}
              className={`pt ${setData.puntosTachadosB.includes(punto) ? 'tachado' : ''}`}
              onClick={() => togglePunto(setIdx, 'B', punto)}
            >
              {punto}
            </div>
          ))}
        </div>

        {/* Equipo B */}
        <div className="col">
          <div className="equipo-head">
            <div
              className={`bola ${setData.saqueInicial === 'B' ? 'bola-activa' : ''}`}
              onClick={() => {
                const nuevosSets = [...sets];
                nuevosSets[setIdx].saqueInicial = 'B';
                setSets(nuevosSets);
              }}
            >
              {teamBLabel}
            </div>
            <input
              value={datosPartido.equipoB.nombre}
              readOnly
              placeholder="Equipo"
              style={{ fontSize: '9px' }}
            />
          </div>
          <div className="rot-grid">
            {setData.rotacionesB.map((rot, rotIdx) => (
              <div key={rotIdx} className="jug-col">
                <div className="cell-gray">{rot.posicion}</div>
                <div className="cell-std">
                  <input
                    value={rot.numero}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesB[rotIdx].numero = e.target.value;
                      setSets(nuevosSets);
                    }}
                    placeholder="#"
                  />
                </div>
                <div className="cell-std">
                  <input
                    value={rot.jugador}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesB[rotIdx].jugador = e.target.value;
                      setSets(nuevosSets);
                    }}
                  />
                </div>
                <div className="cell-std">
                  <input
                    value={rot.libero}
                    onChange={(e) => {
                      const nuevosSets = [...sets];
                      nuevosSets[setIdx].rotacionesB[rotIdx].libero = e.target.value;
                      setSets(nuevosSets);
                    }}
                  />
                </div>
                <div className="saques">
                  {rot.saques.map((activo, sqIdx) => (
                    <div
                      key={sqIdx}
                      className={`sq ${activo ? 'ok' : ''}`}
                      onClick={() => toggleSaque(setIdx, 'B', rotIdx, sqIdx)}
                    >
                      <span>{sqIdx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lateral derecho */}
        <div className="set-lat der">
          <div>
            Fin:{' '}
            <input
              value={setData.horaFin}
              onChange={(e) => {
                const nuevosSets = [...sets];
                nuevosSets[setIdx].horaFin = e.target.value;
                setSets(nuevosSets);
              }}
              style={{ width: '25px', borderBottom: '1px solid black' }}
            />
          </div>
        </div>
      </div>
      </div>
    );
  };

  // Si no está mostrando planilla, mostrar selector
  if (!mostrarPlanilla) {
    return (
      <SelectorPartido
        idPartido={idPartido}
        setIdPartido={setIdPartido}
        onCargar={cargarPartido}
        onCargarId={(id) => cargarPartido(id)}
        loading={loading}
        error={error}
      />
    );
  }

  // Mostrar planilla FIVB completa
  return (
    <>
      {/* Barra de herramientas (no se imprime) */}
      <div className="planilla-toolbar no-print">
        <button onClick={handleVolver} className="btn-toolbar">
          <ArrowLeft size={18} /> Volver
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span className="toolbar-title" style={{ fontSize: '13px' }}>
            {datosPartido.equipoA.nombre !== 'Equipo A' || datosPartido.equipoB.nombre !== 'Equipo B'
              ? `${datosPartido.equipoA.nombre} vs ${datosPartido.equipoB.nombre}`
              : `Planilla FIVB — Partido #${datosPartido.codigo}`}
          </span>
          {datosPartido.competicion && (
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{datosPartido.competicion}</span>
          )}
          {debugMongo && (
            <span style={{
              fontSize: '9px',
              padding: '1px 6px',
              borderRadius: '8px',
              background: debugMongo.startsWith('Sin') ? '#7c2d12' : '#14532d',
              color: '#fef2f2',
            }}>
              {debugMongo}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Controles de zoom */}
          <button onClick={zoomOut} className="btn-toolbar" style={{ padding: '4px 10px', minWidth: '28px', fontSize: '16px', lineHeight: 1 }} title="Reducir">−</button>
          <button onClick={zoomReset} style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', minWidth: '38px', textAlign: 'center' }} title="Restablecer zoom">{Math.round(zoom * 100)}%</button>
          <button onClick={zoomIn}  className="btn-toolbar" style={{ padding: '4px 10px', minWidth: '28px', fontSize: '16px', lineHeight: 1 }} title="Ampliar">+</button>

          <div style={{ width: '1px', height: '20px', background: '#374151', margin: '0 8px' }} />

          <button onClick={handleImprimir} className="btn-toolbar btn-primary">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {/* Planilla FIVB */}
      <div className="planilla-container">
        <div className="hoja" style={{ zoom }}>
          {/* Header */}
          <div className="header">
            <div className="header-info col">
              <div className="fila">
                <b>Competicion:</b>{' '}
                <input
                  className="linea"
                  value={datosPartido.competicion}
                  onChange={(e) =>
                    setDatosPartido({ ...datosPartido, competicion: e.target.value })
                  }
                />
              </div>
              <div className="fila" style={{ marginTop: '2px' }}>
                Ciudad:{' '}
                <input
                  className="linea"
                  value={datosPartido.ciudad}
                  onChange={(e) =>
                    setDatosPartido({ ...datosPartido, ciudad: e.target.value })
                  }
                />{' '}
                Cod:{' '}
                <input
                  className="linea"
                  style={{ width: '30px' }}
                  value={datosPartido.codigo}
                  readOnly
                />
              </div>
              <div className="fila" style={{ marginTop: '2px' }}>
                Lugar:{' '}
                <input
                  className="linea"
                  value={datosPartido.lugar}
                  onChange={(e) =>
                    setDatosPartido({ ...datosPartido, lugar: e.target.value })
                  }
                />{' '}
                Partido:{' '}
                <input
                  className="linea"
                  style={{ width: '30px' }}
                  value={datosPartido.partidoNum}
                  readOnly
                />
              </div>
              <div className="fila" style={{ marginTop: '5px', fontSize: '9px' }}>
                Div:{' '}
                <input
                  type="radio"
                  checked={datosPartido.division === 'M'}
                  onChange={() => setDatosPartido({ ...datosPartido, division: 'M' })}
                />
                M{' '}
                <input
                  type="radio"
                  checked={datosPartido.division === 'F'}
                  onChange={() => setDatosPartido({ ...datosPartido, division: 'F' })}
                />
                F | Cat:{' '}
                <input
                  className="linea"
                  style={{ width: '55px' }}
                  value={datosPartido.categoriaNombre || datosPartido.categoria}
                  onChange={(e) => setDatosPartido({ ...datosPartido, categoriaNombre: e.target.value })}
                />
              </div>
            </div>
            <div className="header-logo">FIVB</div>
            <div className="header-info col center">
              <b style={{ fontSize: '9px' }}>FEDERATION INTERNATIONALE DE VOLLEYBALL</b>
              {asociacion?.nombre && (
                <div style={{ fontSize: '8px', color: '#444', marginTop: '1px' }}>
                  {asociacion.nombre}{asociacion.ciudad ? ` — ${asociacion.ciudad}` : ''}
                </div>
              )}
              <div
                style={{
                  borderTop: '2px solid black',
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '4px',
                  paddingTop: '2px',
                  fontWeight: 'bold',
                  fontSize: '10px',
                }}
              >
                PLANILLA DE ANOTACION
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px', fontSize: '9px' }}>
                <span>
                  Fecha:{' '}
                  <input
                    className="linea"
                    style={{ width: '65px' }}
                    value={datosPartido.fecha}
                    onChange={(e) => setDatosPartido({ ...datosPartido, fecha: e.target.value })}
                  />
                </span>
                <span>
                  Hora:{' '}
                  <input
                    className="linea"
                    style={{ width: '35px' }}
                    value={datosPartido.hora}
                    onChange={(e) => setDatosPartido({ ...datosPartido, hora: e.target.value })}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Sets 1-4 */}
          <div className="grid-2">
            <div className="col">
              <SetBox setIdx={0} setData={sets[0]} />
              <SetBox setIdx={2} setData={sets[2]} />
            </div>
            <div className="col">
              <SetBox setIdx={1} setData={sets[1]} />
              <SetBox setIdx={3} setData={sets[3]} />
            </div>
          </div>

          {/* Bloque inferior */}
          <div className="bloque-inferior" style={{ marginTop: '5px' }}>
            {/* Columna izquierda: Set 5 + Sanciones */}
            <div className="inf-col-izq">
              <SetBox setIdx={4} setData={sets[4]} />

              <div
                className="caja-restante"
                style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}
              >
                <div style={{ borderRight: '1px solid black', padding: 0 }}>
                  <div className="titulo-caja">SANCIONES</div>
                  <table className="t-fina">
                    <thead>
                      <tr>
                        <th>A</th>
                        <th>C</th>
                        <th>E</th>
                        <th>D</th>
                        <th>Eq</th>
                        <th>S</th>
                        <th>P</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sanciones.map((sancion, idx) => (
                        <tr key={idx}>
                          {['A', 'C', 'E', 'D', 'Eq', 'S', 'P'].map((campo) => (
                            <td key={campo}>
                              <input
                                value={sancion[campo]}
                                onChange={(e) => {
                                  const nuevas = [...sanciones];
                                  nuevas[idx][campo] = e.target.value;
                                  setSanciones(nuevas);
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="titulo-caja">OBSERVACIONES</div>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    style={{
                      width: '100%',
                      flexGrow: 1,
                      border: 'none',
                      resize: 'none',
                      padding: '2px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha: Resultados + Firmas */}
            <div className="inf-col-der">
              <div
                className="caja-restante"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 1fr',
                  border: '2px solid #000',
                  height: '100%',
                }}
              >
                {/* Aprobacion */}
                <div
                  style={{
                    borderRight: '1px solid black',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div className="titulo-caja">APROBACION</div>
                  <div
                    style={{
                      padding: '2px',
                      fontSize: '9px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div>Arb. Nombre - Pais</div>
                    <div style={{ borderBottom: '1px solid #ccc' }}>
                      1°:{' '}
                      <input
                        style={{ width: '80%' }}
                        value={arbitros.primero}
                        onChange={(e) =>
                          setArbitros({ ...arbitros, primero: e.target.value })
                        }
                      />
                    </div>
                    <div style={{ borderBottom: '1px solid #ccc' }}>
                      2°:{' '}
                      <input
                        style={{ width: '80%' }}
                        value={arbitros.segundo}
                        onChange={(e) =>
                          setArbitros({ ...arbitros, segundo: e.target.value })
                        }
                      />
                    </div>
                    <div style={{ borderBottom: '1px solid #ccc' }}>
                      Anot:{' '}
                      <input
                        style={{ width: '80%' }}
                        value={arbitros.anotador}
                        onChange={(e) =>
                          setArbitros({ ...arbitros, anotador: e.target.value })
                        }
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '5px',
                      }}
                    >
                      Cap A:{' '}
                      <input
                        style={{ width: '20px', borderBottom: '1px solid black' }}
                        value={arbitros.capA}
                        onChange={(e) =>
                          setArbitros({ ...arbitros, capA: e.target.value })
                        }
                      />
                      Cap B:{' '}
                      <input
                        style={{ width: '20px', borderBottom: '1px solid black' }}
                        value={arbitros.capB}
                        onChange={(e) =>
                          setArbitros({ ...arbitros, capB: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Resultados */}
                <div
                  style={{
                    borderRight: '1px solid black',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div className="titulo-caja">RESULTADOS</div>
                  <table className="t-fina">
                    <thead>
                      <tr>
                        <th colSpan="3">{datosPartido.equipoA.nombre || 'Equipo A'}</th>
                        <th>S</th>
                        <th colSpan="3">{datosPartido.equipoB.nombre || 'Equipo B'}</th>
                      </tr>
                      <tr>
                        <th>T</th>
                        <th>S</th>
                        <th>G</th>
                        <th></th>
                        <th>G</th>
                        <th>S</th>
                        <th>T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.sets.map((set, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              value={set.tA}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].tA = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              value={set.sA}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].sA = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td style={{ background: set.gA === '' ? '#fffbcc' : 'transparent' }}>
                            <input
                              value={set.gA}
                              placeholder="—"
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].gA = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td>{idx + 1}</td>
                          <td style={{ background: set.gB === '' ? '#fffbcc' : 'transparent' }}>
                            <input
                              value={set.gB}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].gB = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              value={set.sB}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].sB = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              value={set.tB}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].tB = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: '#eee' }}>
                        <td>
                          <input
                            value={resultados.totalA.t}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalA: { ...resultados.totalA, t: e.target.value },
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={resultados.totalA.s}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalA: { ...resultados.totalA, s: e.target.value },
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={resultados.totalA.g}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalA: { ...resultados.totalA, g: e.target.value },
                              })
                            }
                          />
                        </td>
                        <td>T</td>
                        <td>
                          <input
                            value={resultados.totalB.g}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalB: { ...resultados.totalB, g: e.target.value },
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={resultados.totalB.s}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalB: { ...resultados.totalB, s: e.target.value },
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={resultados.totalB.t}
                            onChange={(e) =>
                              setResultados({
                                ...resultados,
                                totalB: { ...resultados.totalB, t: e.target.value },
                              })
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2px',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      borderTop: '1px solid black',
                      marginTop: 'auto',
                    }}
                  >
                    GANADOR:{' '}
                    <input
                      style={{ width: '80px' }}
                      value={resultados.ganador}
                      onChange={(e) =>
                        setResultados({ ...resultados, ganador: e.target.value })
                      }
                    />{' '}
                    <input
                      style={{ width: '40px' }}
                      value={resultados.marcadorFinal}
                      onChange={(e) =>
                        setResultados({ ...resultados, marcadorFinal: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Firmas */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="titulo-caja">FIRMAS</div>
                  <div
                    style={{
                      flexGrow: 1,
                      padding: '5px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                    }}
                  >
                    <div>
                      Capitanes:{' '}
                      <div style={{ borderBottom: '1px solid black', height: '10px' }}></div>
                    </div>
                    <div>
                      Entrenadores:{' '}
                      <div style={{ borderBottom: '1px solid black', height: '10px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de la planilla */}
      <style>{`
        :root {
          --borde-negro: 2px solid #000;
          --borde-fino: 1px solid #000;
          --fondo-gris: #e6e6e6;
          --fuente: 'Arial Narrow', 'Roboto Condensed', sans-serif;
          --altura-set: 165px;
          --altura-header: 75px;
        }

        .planilla-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1001;
          background: #1f2937;
          color: white;
          padding: 6px 20px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .btn-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: #374151;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-toolbar:hover {
          background: #4b5563;
        }

        .btn-toolbar.btn-primary {
          background: #2563eb;
        }

        .btn-toolbar.btn-primary:hover {
          background: #1d4ed8;
        }

        .toolbar-title {
          font-weight: 600;
        }

        .planilla-container {
          position: fixed;
          top: 48px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          background: #444;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .hoja {
          width: 297mm;
          min-height: 200mm;
          background: white;
          padding: 5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          font-family: var(--fuente);
          font-size: 11px;
        }

        .hoja input {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          text-align: center;
          font-family: inherit;
          font-size: inherit;
          outline: none;
          padding: 0;
        }

        .fila { display: flex; width: 100%; }
        .col { display: flex; flex-direction: column; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }

        .titulo-caja {
          background: var(--fondo-gris);
          text-align: center;
          font-weight: bold;
          border-bottom: var(--borde-fino);
          font-size: 10px;
          padding: 2px;
          text-transform: uppercase;
        }

        .header {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr;
          border: var(--borde-negro);
          height: var(--altura-header);
          margin-bottom: 5px;
        }

        .header-info {
          padding: 4px;
          font-size: 10px;
        }

        .header-logo {
          font-size: 32pt;
          font-weight: 900;
          font-family: Arial;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: var(--borde-negro);
          border-right: var(--borde-negro);
        }

        .linea {
          border-bottom: 1px solid black;
          display: inline-block;
          height: 12px;
          margin-right: 5px;
        }

        .set-box {
          border: var(--borde-negro);
          height: var(--altura-set);
          margin-bottom: 5px;
          display: grid;
          grid-template-columns: 25px 1fr 30px 30px 1fr 25px;
          overflow: hidden;
        }

        .set-lat {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
          font-weight: bold;
          font-size: 9px;
          border-right: var(--borde-fino);
          display: flex;
          justify-content: space-around;
        }

        .set-lat.der {
          border-right: none;
          border-left: var(--borde-fino);
        }

        .equipo-head {
          height: 20px;
          border-bottom: var(--borde-negro);
          display: flex;
          align-items: center;
        }

        .bola {
          width: 14px;
          height: 14px;
          border: 1px solid black;
          border-radius: 50%;
          text-align: center;
          line-height: 14px;
          margin: 0 4px;
          font-weight: bold;
          cursor: pointer;
          font-size: 10px;
        }

        .bola-activa {
          background: black;
          color: white;
        }

        .rot-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          height: calc(100% - 20px);
        }

        .jug-col {
          border-right: var(--borde-fino);
          display: grid;
          grid-template-rows: 15px 18px 18px 18px 1fr;
        }

        .jug-col:last-child {
          border-right: none;
        }

        .cell-gray {
          background: var(--fondo-gris);
          border-bottom: var(--borde-fino);
          text-align: center;
          font-weight: bold;
          font-size: 8px;
        }

        .cell-std {
          border-bottom: var(--borde-fino);
        }

        .cell-std input {
          font-size: 8px;
        }

        .pts-col {
          border-left: var(--borde-negro);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-content: start;
          font-size: 6px;
        }

        .pts-col.der {
          border-right: var(--borde-negro);
        }

        .pt {
          height: 9px;
          border: 0.5px solid #ddd;
          text-align: center;
          line-height: 9px;
          cursor: pointer;
        }

        .pt.tachado {
          background: #333;
          color: white;
        }

        .saques {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(4, 1fr);
        }

        .sq {
          border-right: 1px dotted #999;
          border-bottom: 1px dotted #999;
          position: relative;
          cursor: pointer;
        }

        .sq span {
          position: absolute;
          top: 0;
          left: 0;
          font-size: 5px;
        }

        .sq.ok {
          background-color: black;
        }

        .bloque-inferior {
          display: flex;
          gap: 5px;
          flex-grow: 1;
        }

        .inf-col-izq {
          width: 50%;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .inf-col-der {
          width: 50%;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .caja-restante {
          flex-grow: 1;
          border: var(--borde-negro);
          display: flex;
          flex-direction: column;
        }

        table.t-fina {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          text-align: center;
        }

        table.t-fina td,
        table.t-fina th {
          border: 1px solid black;
          height: 16px;
        }

        table.t-fina th {
          background: var(--fondo-gris);
        }

        table.t-fina input {
          font-size: 9px;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          .planilla-container {
            position: static;
            top: auto;
            padding: 0;
            background: white;
            overflow: visible;
          }

          .hoja {
            width: 100% !important;
            zoom: 1 !important;
            border: none;
            padding: 0;
          }

          .titulo-caja,
          .cell-gray,
          .header-logo {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4 landscape;
            margin: 5mm;
          }
        }
      `}</style>
    </>
  );
}

export default PlanillaFIVB;
