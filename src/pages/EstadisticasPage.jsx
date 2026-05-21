// src/pages/EstadisticasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Trophy, Star, Zap, Shield, Wind, ChevronDown, Loader2, Users, TrendingUp } from 'lucide-react';
import { estadisticasService } from '../services/estadisticasService';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

function StatBadge({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`border rounded-lg p-3 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

function TeamCard({ label, nombre, stats }) {
  if (!stats) return (
    <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-center text-gray-400 text-sm">
      Sin datos de equipo
    </div>
  );
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-bold text-gray-900 text-lg mb-3 truncate">{nombre || stats.nombre_equipo}</div>
      <div className="grid grid-cols-2 gap-2">
        <StatBadge label="Puntos" value={stats.puntos_totales} color="blue" />
        <StatBadge label="Sets ganados" value={stats.sets_ganados} color="green" />
        <StatBadge label="Aces" value={stats.ataque?.aces ?? stats.saque?.aces_totales} color="orange" />
        <StatBadge label="Bloqueos" value={stats.bloqueo?.puntos_bloqueo} color="purple" />
        <StatBadge label="Ef. ataque" value={`${pct(stats.ataque?.exitosos, stats.ataque?.intentos)}%`} color="gray" />
        <StatBadge label="Ef. recep." value={`${pct((stats.recepcion?.perfectas ?? 0) + (stats.recepcion?.buenas ?? 0), stats.recepcion?.intentos)}%`} color="gray" />
      </div>
    </div>
  );
}

const POSICION_LABEL = { L: 'Lib.', O: 'Opuesto', CH: 'Central', PV: 'Punta', C: 'Colocador', MCA: 'MCA', S: 'Setter' };

function TablaJugadores({ jugadores, nombreLocal, nombreVisitante }) {
  const [orden, setOrden] = useState('puntos_anotados');
  const [filtroEquipo, setFiltroEquipo] = useState('todos');

  const sorted = [...jugadores]
    .filter(j => filtroEquipo === 'todos' || j.equipo === filtroEquipo)
    .sort((a, b) => {
      if (orden === 'puntos_anotados') return (b.puntos_anotados ?? 0) - (a.puntos_anotados ?? 0);
      if (orden === 'ataque')  return (b.ataque?.exitosos ?? 0) - (a.ataque?.exitosos ?? 0);
      if (orden === 'bloqueo') return (b.bloqueo?.total_puntos ?? 0) - (a.bloqueo?.total_puntos ?? 0);
      if (orden === 'aces')    return (b.saque?.aces ?? 0) - (a.saque?.aces ?? 0);
      return 0;
    });

  const thBtn = (col, label) => (
    <th
      className={`px-3 py-2 text-right cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 ${orden === col ? 'text-blue-600 font-bold' : 'text-gray-600 font-semibold'}`}
      onClick={() => setOrden(col)}
    >
      {label} {orden === col ? '▼' : ''}
    </th>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-semibold text-gray-700">Filtrar:</span>
        {['todos', 'local', 'visitante'].map(f => (
          <button
            key={f}
            onClick={() => setFiltroEquipo(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filtroEquipo === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'todos' ? 'Todos' : f === 'local' ? (nombreLocal || 'Local') : (nombreVisitante || 'Visitante')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">#</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Jugador</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Pos</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Equipo</th>
              {thBtn('puntos_anotados', 'PTS')}
              {thBtn('ataque', 'ATQ')}
              {thBtn('bloqueo', 'BLQ')}
              {thBtn('aces', 'ACE')}
              <th className="px-3 py-2 text-right text-gray-600 font-semibold">REC%</th>
              <th className="px-3 py-2 text-right text-gray-600 font-semibold">ERR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Sin jugadores registrados</td></tr>
            )}
            {sorted.map((j, i) => (
              <tr key={j._id || i} className={`border-b border-gray-100 ${j.reconocimientos?.es_mvp ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-2 font-mono text-gray-500">{j.dorsal}</td>
                <td className="px-3 py-2 font-semibold text-gray-900">
                  {j.reconocimientos?.es_mvp && <span className="mr-1 text-yellow-500" title="MVP">★</span>}
                  {j.nombre_completo}
                </td>
                <td className="px-3 py-2 text-gray-500">{POSICION_LABEL[j.posicion] || j.posicion || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${j.equipo === 'local' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {j.equipo === 'local' ? 'L' : 'V'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-bold text-blue-700">{j.puntos_anotados ?? 0}</td>
                <td className="px-3 py-2 text-right text-gray-700">{j.ataque?.exitosos ?? 0}</td>
                <td className="px-3 py-2 text-right text-gray-700">{j.bloqueo?.total_puntos ?? 0}</td>
                <td className="px-3 py-2 text-right text-gray-700">{j.saque?.aces ?? 0}</td>
                <td className="px-3 py-2 text-right text-gray-500">
                  {pct((j.recepcion?.perfectas ?? 0) + (j.recepcion?.buenas ?? 0), j.recepcion?.intentos ?? 0)}%
                </td>
                <td className="px-3 py-2 text-right text-red-500">
                  {(j.ataque?.errores ?? 0) + (j.saque?.errores ?? 0) + (j.bloqueo?.errores ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingTable({ titulo, icono: Icono, color, datos, statKey, statLabel, extraLabel }) {
  const colors = {
    blue:   { head: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-700',   row1: 'bg-yellow-50' },
    green:  { head: 'bg-green-600',  badge: 'bg-green-100 text-green-700', row1: 'bg-yellow-50' },
    purple: { head: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700', row1: 'bg-yellow-50' },
    orange: { head: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', row1: 'bg-yellow-50' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${c.head} text-white px-4 py-3 flex items-center gap-2`}>
        <Icono size={16} />
        <span className="font-bold text-sm">{titulo}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-gray-500 font-semibold w-8">#</th>
            <th className="px-3 py-2 text-left text-gray-600 font-semibold">Jugador</th>
            <th className="px-3 py-2 text-right text-gray-600 font-semibold">{statLabel}</th>
            {extraLabel && <th className="px-3 py-2 text-right text-gray-400 font-semibold">{extraLabel}</th>}
            <th className="px-3 py-2 text-right text-gray-400 font-semibold">PJ</th>
          </tr>
        </thead>
        <tbody>
          {(!datos || datos.length === 0) && (
            <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-xs">Sin datos</td></tr>
          )}
          {datos?.map((d, i) => {
            const val = typeof statKey === 'function' ? statKey(d) : d[statKey];
            return (
              <tr key={i} className={`border-b border-gray-100 ${i === 0 ? c.row1 : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-2 text-gray-400 font-mono">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </td>
                <td className="px-3 py-2 font-semibold text-gray-900 truncate max-w-[130px]">
                  {d._id?.nombre || '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${c.badge}`}>{val ?? 0}</span>
                </td>
                {extraLabel && (
                  <td className="px-3 py-2 text-right text-gray-500 text-xs">
                    {typeof extraLabel === 'function' ? extraLabel(d) : ''}
                  </td>
                )}
                <td className="px-3 py-2 text-right text-gray-400 text-xs">{d.partidos_jugados ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab 1 — Estadísticas por Partido
// ─────────────────────────────────────────────
function TabPartido() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [idCamp, setIdCamp]           = useState('');
  const [partidos, setPartidos]       = useState([]);
  const [idPartido, setIdPartido]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [loadingPartidos, setLoadingPartidos] = useState(false);
  const [datos, setDatos]             = useState(null);
  const [busqueda, setBusqueda]       = useState('');

  useEffect(() => {
    estadisticasService.getCampeonatos()
      .then(d => {
        const lista = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : Array.isArray(d.campeonatos) ? d.campeonatos : [];
        setCampeonatos(lista);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!idCamp) { setPartidos([]); setIdPartido(''); return; }
    setLoadingPartidos(true);
    estadisticasService.getPartidosCampeonato(idCamp)
      .then(d => {
        const lista = Array.isArray(d.data?.partidos) ? d.data.partidos : Array.isArray(d.data) ? d.data : [];
        setPartidos(lista.filter(p => p.p_estado === 'finalizado'));
      })
      .catch(() => setPartidos([]))
      .finally(() => setLoadingPartidos(false));
  }, [idCamp]);

  const cargar = useCallback(async () => {
    if (!idPartido) return;
    setLoading(true);
    setDatos(null);
    try {
      const [jugRes, eqRes, mvpRes] = await Promise.all([
        estadisticasService.getJugadoresPartido(idPartido),
        estadisticasService.getComparativaEquipos(idPartido),
        estadisticasService.getMVP(idPartido),
      ]);
      const partidoInfo = partidos.find(p => String(p.id_partido) === String(idPartido));
      setDatos({
        jugadores:   jugRes.data  || [],
        comparativa: eqRes.data   || { local: null, visitante: null },
        mvp:         mvpRes.data  || null,
        info:        partidoInfo  || null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [idPartido, partidos]);

  const filtrados = partidos.filter(p => {
    const txt = busqueda.toLowerCase();
    return !txt
      || (p.equipoLocal?.nombre || '').toLowerCase().includes(txt)
      || (p.equipoVisitante?.nombre || '').toLowerCase().includes(txt)
      || String(p.id_partido).includes(txt);
  });

  const nombreLocal    = datos?.info?.equipoLocal?.nombre    || datos?.comparativa?.local?.nombre_equipo    || 'Local';
  const nombreVisitante= datos?.info?.equipoVisitante?.nombre|| datos?.comparativa?.visitante?.nombre_equipo|| 'Visitante';

  return (
    <div className="space-y-5">
      {/* Selectores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" /> Seleccionar partido
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
            value={idCamp}
            onChange={e => { setIdCamp(e.target.value); setIdPartido(''); setDatos(null); }}
          >
            <option value="">— Campeonato —</option>
            {campeonatos.map(c => <option key={c.id_campeonato} value={c.id_campeonato}>{c.nombre}</option>)}
          </select>

          <div className="relative">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[260px] disabled:opacity-50"
              value={idPartido}
              onChange={e => { setIdPartido(e.target.value); setDatos(null); }}
              disabled={!idCamp || loadingPartidos}
            >
              <option value="">— Partido finalizado —</option>
              {filtrados.map(p => (
                <option key={p.id_partido} value={p.id_partido}>
                  #{p.id_partido} · {p.equipoLocal?.nombre || 'Local'} vs {p.equipoVisitante?.nombre || 'Visitante'} ({p.resultado_local ?? p.sets_local ?? '?'}-{p.resultado_visitante ?? p.sets_visitante ?? '?'})
                </option>
              ))}
            </select>
            {loadingPartidos && <Loader2 size={14} className="animate-spin absolute right-8 top-3 text-gray-400" />}
          </div>

          {idCamp && (
            <input
              type="text"
              placeholder="Buscar equipo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            />
          )}

          <button
            onClick={cargar}
            disabled={!idPartido || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
            Ver estadísticas
          </button>
        </div>
      </div>

      {/* Resultados */}
      {datos && (
        <>
          {/* MVP */}
          {datos.mvp && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
              <Star size={28} className="text-yellow-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">MVP del Partido</div>
                <div className="font-bold text-gray-900 text-lg">{datos.mvp.nombre_completo}</div>
                <div className="text-sm text-gray-600">
                  {datos.mvp.puntos_anotados} pts · {datos.mvp.ataque?.exitosos ?? 0} atq · {datos.mvp.bloqueo?.total_puntos ?? 0} blq · {datos.mvp.saque?.aces ?? 0} aces
                </div>
              </div>
            </div>
          )}

          {/* Comparativa equipos */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-gray-500" /> Comparativa de equipos
            </h3>
            {datos.comparativa?.local || datos.comparativa?.visitante ? (
              <div className="flex gap-4 flex-wrap">
                <TeamCard label="Local" nombre={nombreLocal} stats={datos.comparativa.local} />
                <TeamCard label="Visitante" nombre={nombreVisitante} stats={datos.comparativa.visitante} />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
                No hay estadísticas de equipo registradas para este partido
              </div>
            )}
          </div>

          {/* Tabla jugadores */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-gray-500" /> Estadísticas por jugador
              <span className="text-xs text-gray-400 font-normal">(click en columna para ordenar)</span>
            </h3>
            {datos.jugadores.length > 0 ? (
              <TablaJugadores
                jugadores={datos.jugadores}
                nombreLocal={nombreLocal}
                nombreVisitante={nombreVisitante}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No hay estadísticas individuales registradas para este partido.<br />
                <span className="text-xs">Las estadísticas se generan automáticamente cuando el partido es marcado con la app digital.</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab 2 — Rankings del Campeonato
// ─────────────────────────────────────────────
function TabRankings() {
  const [campeonatos, setCampeonatos]   = useState([]);
  const [idCamp, setIdCamp]             = useState('');
  const [categorias, setCategorias]     = useState([]);
  const [idCC, setIdCC]                 = useState('');
  const [loading, setLoading]           = useState(false);
  const [ranking, setRanking]           = useState(null);

  useEffect(() => {
    estadisticasService.getCampeonatos()
      .then(d => {
        const lista = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : Array.isArray(d.campeonatos) ? d.campeonatos : [];
        setCampeonatos(lista);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!idCamp) { setCategorias([]); setIdCC(''); return; }
    estadisticasService.getCategoriasCampeonato(idCamp)
      .then(d => {
        const lista = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
        setCategorias(lista);
      })
      .catch(() => setCategorias([]));
  }, [idCamp]);

  const cargar = async () => {
    if (!idCamp) return;
    setLoading(true);
    setRanking(null);
    try {
      const res = await estadisticasService.getRankingCampeonato(idCamp, idCC || null);
      setRanking(res.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Selectores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-600" /> Rankings del campeonato
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            value={idCamp}
            onChange={e => { setIdCamp(e.target.value); setIdCC(''); setRanking(null); }}
          >
            <option value="">— Campeonato —</option>
            {campeonatos.map(c => <option key={c.id_campeonato} value={c.id_campeonato}>{c.nombre}</option>)}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[160px] disabled:opacity-50"
            value={idCC}
            onChange={e => { setIdCC(e.target.value); setRanking(null); }}
            disabled={!idCamp || categorias.length === 0}
          >
            <option value="">— Todas las categorías —</option>
            {categorias.map(c => (
              <option key={c.id_cc || c.id_categoria} value={c.id_cc || ''}>
                {c.categoria?.nombre || c.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={cargar}
            disabled={!idCamp || loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Ver rankings
          </button>
        </div>

        {ranking && (
          <div className="mt-3 text-xs text-gray-500">
            Basado en <span className="font-semibold text-gray-700">{ranking.totalPartidos}</span> partido(s) con estadísticas digitales
          </div>
        )}
      </div>

      {/* Rankings */}
      {ranking && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RankingTable
            titulo="Top Anotadores"
            icono={Star}
            color="blue"
            datos={ranking.topScorers}
            statKey="puntos_totales"
            statLabel="PTS"
          />
          <RankingTable
            titulo="Top Atacantes"
            icono={Zap}
            color="orange"
            datos={ranking.topAtacantes}
            statKey="ataques_exitosos"
            statLabel="ATQ"
          />
          <RankingTable
            titulo="Top Bloqueadores"
            icono={Shield}
            color="purple"
            datos={ranking.topBloqueadores}
            statKey="bloqueos_puntos"
            statLabel="BLQ"
          />
          <RankingTable
            titulo="Top Sacadores (Aces)"
            icono={Wind}
            color="green"
            datos={ranking.topSacadores}
            statKey="aces"
            statLabel="ACES"
          />
        </div>
      )}

      {ranking && ranking.totalPartidos === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No hay estadísticas registradas para este campeonato.<br />
          <span className="text-xs">Las estadísticas se generan cuando los partidos son marcados con la app digital.</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export function EstadisticasPage() {
  const [tab, setTab] = useState('partido');

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-1">Rendimiento por partido y rankings del campeonato</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'partido',  label: 'Por Partido',         icon: BarChart3 },
          { key: 'rankings', label: 'Rankings Campeonato', icon: Trophy    },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'partido'  && <TabPartido />}
      {tab === 'rankings' && <TabRankings />}
    </div>
  );
}

export default EstadisticasPage;
