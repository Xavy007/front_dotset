// ===============================================
// ARCHIVO: src/pages/PlanillaFIVB.jsx
// Planilla de Anotación FIVB - Carga datos desde MongoDB
// ===============================================

import React, { useState, useEffect } from 'react';
import { Printer, Download, RefreshCw, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { planillaService } from '../services/planillaService';

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

  // Cargar datos del partido
  const cargarPartido = async () => {
    if (!idPartido) {
      setError('Ingrese un ID de partido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Intentar cargar desde MongoDB
      const [partidoDigital, infoPostgres] = await Promise.all([
        planillaService.getPartidoDigital(idPartido).catch(() => null),
        planillaService.getInfoPartidoPostgres(idPartido).catch(() => null),
      ]);

      console.log('Partido Digital:', partidoDigital);
      console.log('Info PostgreSQL:', infoPostgres);

      // Procesar datos del partido
      if (infoPostgres?.data || partidoDigital?.data) {
        const pg = infoPostgres?.data || {};
        const mongo = partidoDigital?.data || {};

        // Datos generales
        setDatosPartido({
          competicion: pg.campeonato?.nombre || mongo.info_general?.campeonato || '',
          ciudad: pg.cancha?.ciudad || '',
          codigo: pg.id_partido || idPartido,
          lugar: pg.cancha?.nombre || '',
          partidoNum: pg.numero_partido || idPartido,
          division: pg.categoria?.genero === 'F' ? 'F' : 'M',
          categoria: 'Sen',
          fecha: pg.p_fecha || mongo.info_general?.hora_inicio_real || '',
          hora: pg.p_hora || '',
          equipoA: {
            nombre: pg.equipo_local?.nombre || mongo.equipos?.local?.nombre || 'Equipo A',
            abreviatura: 'A',
          },
          equipoB: {
            nombre: pg.equipo_visitante?.nombre || mongo.equipos?.visitante?.nombre || 'Equipo B',
            abreviatura: 'B',
          },
        });

        // Procesar sets si hay datos en MongoDB
        if (mongo.resultado) {
          const setsLocal = mongo.resultado.sets_local || 0;
          const setsVisitante = mongo.resultado.sets_visitante || 0;

          setResultados((prev) => ({
            ...prev,
            ganador: setsLocal > setsVisitante ? datosPartido.equipoA.nombre : datosPartido.equipoB.nombre,
            marcadorFinal: `${setsLocal} : ${setsVisitante}`,
            totalA: { ...prev.totalA, g: setsLocal },
            totalB: { ...prev.totalB, g: setsVisitante },
          }));
        }

        // Cargar eventos para llenar los puntos
        try {
          const eventos = await planillaService.getEventosPartido(idPartido);
          if (eventos?.data && Array.isArray(eventos.data)) {
            procesarEventos(eventos.data);
          }
        } catch (e) {
          console.log('No se pudieron cargar eventos:', e);
        }

        setPartidoCargado(true);
        setMostrarPlanilla(true);
      } else {
        setError('No se encontraron datos para este partido');
      }
    } catch (err) {
      console.error('Error cargando partido:', err);
      setError(err.message || 'Error al cargar el partido');
    } finally {
      setLoading(false);
    }
  };

  // Procesar eventos para marcar puntos
  const procesarEventos = (eventos) => {
    const nuevosSets = [...sets];

    eventos.forEach((evento) => {
      if (evento.tipo_evento === 'punto' && evento.marcador) {
        const setIdx = (evento.numero_set || 1) - 1;
        if (setIdx >= 0 && setIdx < 5) {
          const equipoAnota = evento.punto?.resultado?.equipo_anota;
          const marcador = evento.marcador;

          if (equipoAnota === 'local') {
            if (!nuevosSets[setIdx].puntosTachadosA.includes(marcador.local)) {
              nuevosSets[setIdx].puntosTachadosA.push(marcador.local);
            }
            nuevosSets[setIdx].puntajeFinalA = Math.max(nuevosSets[setIdx].puntajeFinalA, marcador.local);
          } else if (equipoAnota === 'visitante') {
            if (!nuevosSets[setIdx].puntosTachadosB.includes(marcador.visitante)) {
              nuevosSets[setIdx].puntosTachadosB.push(marcador.visitante);
            }
            nuevosSets[setIdx].puntajeFinalB = Math.max(nuevosSets[setIdx].puntajeFinalB, marcador.visitante);
          }
        }
      }
    });

    setSets(nuevosSets);

    // Actualizar resultados por set
    const nuevosResultados = { ...resultados };
    nuevosSets.forEach((set, idx) => {
      nuevosResultados.sets[idx].gA = set.puntajeFinalA || '';
      nuevosResultados.sets[idx].gB = set.puntajeFinalB || '';
    });
    setResultados(nuevosResultados);
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
      <div className="set-box">
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
          <div style={{ transform: 'rotate(180deg)' }}>SET {setIdx + 1}</div>
        </div>
      </div>
    );
  };

  // Si no está mostrando planilla, mostrar selector
  if (!mostrarPlanilla) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Planilla FIVB - Cargar Partido</h1>

        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID del Partido
            </label>
            <input
              type="number"
              value={idPartido}
              onChange={(e) => setIdPartido(e.target.value)}
              placeholder="Ej: 1, 2, 3..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={cargarPartido}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Cargando...
              </>
            ) : (
              <>
                <Search size={20} />
                Cargar Partido
              </>
            )}
          </button>

          <div className="mt-4 text-sm text-gray-500">
            <p>Ingresa el ID del partido para cargar los datos y generar la planilla FIVB.</p>
          </div>
        </div>
      </div>
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
        <span className="toolbar-title">
          Planilla FIVB - Partido #{datosPartido.codigo}
        </span>
        <button onClick={handleImprimir} className="btn-toolbar btn-primary">
          <Printer size={18} /> Imprimir
        </button>
      </div>

      {/* Planilla FIVB */}
      <div className="planilla-container">
        <div className="hoja">
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
                  type="radio"
                  checked={datosPartido.categoria === 'Sen'}
                  onChange={() => setDatosPartido({ ...datosPartido, categoria: 'Sen' })}
                />
                Sen{' '}
                <input
                  type="radio"
                  checked={datosPartido.categoria === 'Jun'}
                  onChange={() => setDatosPartido({ ...datosPartido, categoria: 'Jun' })}
                />
                Jun
              </div>
            </div>
            <div className="header-logo">FIVB</div>
            <div className="header-info col center">
              <b>FEDERATION INTERNATIONALE DE VOLLEYBALL</b>
              <div
                style={{
                  borderTop: '2px solid black',
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '5px',
                  paddingTop: '2px',
                  fontWeight: 'bold',
                }}
              >
                PLANILLA DE ANOTACION
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
                          <td>
                            <input
                              value={set.gA}
                              onChange={(e) => {
                                const nuevos = { ...resultados };
                                nuevos.sets[idx].gA = e.target.value;
                                setResultados(nuevos);
                              }}
                            />
                          </td>
                          <td>{idx + 1}</td>
                          <td>
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
          z-index: 1000;
          background: #1f2937;
          color: white;
          padding: 10px 20px;
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
          margin-top: 60px;
          padding: 20px;
          background: #555;
          min-height: calc(100vh - 60px);
          display: flex;
          justify-content: center;
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
            margin-top: 0;
            padding: 0;
            background: white;
          }

          .hoja {
            width: 100%;
            height: 100%;
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
