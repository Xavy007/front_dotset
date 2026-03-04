// ===============================================
// ARCHIVO: src/pages/PlanillaPartido.jsx
// ===============================================

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function PlanillaPartido() {
  const navigate = useNavigate();
  const { idPartido } = useParams();
  const [datosPartido, setDatosPartido] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para datos editables de la planilla
  const [datosGenerales, setDatosGenerales] = useState({
    competicion: '',
    ciudad: '',
    codigo: '',
    lugar: '',
    partidoNum: '',
    division: 'M',
    categoria: 'Sen',
    equipoA: '',
    equipoB: ''
  });

  const [sanciones, setSanciones] = useState([
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' },
    { A: '', C: '', E: '', D: '', Eq: '', S: '', P: '' }
  ]);

  const [observaciones, setObservaciones] = useState('');
  
  const [arbitros, setArbitros] = useState({
    primero: '',
    segundo: '',
    anotador: '',
    capA: '',
    capB: ''
  });

  const [resultados, setResultados] = useState({
    set1: { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    set2: { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    set3: { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    set4: { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    set5: { tA: '', sA: '', gA: '', gB: '', sB: '', tB: '' },
    totalA: { t: '', s: '', g: '' },
    totalB: { t: '', s: '', g: '' },
    ganador: '',
    marcador: '3 : 0'
  });

  // Estados para los 5 sets
  const [sets, setSets] = useState([
    { puntosTachadosA: [], puntosTachadosB: [], rotacionesA: initRotaciones(), rotacionesB: initRotaciones(), inicioA: '', finA: '', saqueInicial: 'A' },
    { puntosTachadosA: [], puntosTachadosB: [], rotacionesA: initRotaciones(), rotacionesB: initRotaciones(), inicioA: '', finA: '', saqueInicial: 'B' },
    { puntosTachadosA: [], puntosTachadosB: [], rotacionesA: initRotaciones(), rotacionesB: initRotaciones(), inicioA: '', finA: '', saqueInicial: 'A' },
    { puntosTachadosA: [], puntosTachadosB: [], rotacionesA: initRotaciones(), rotacionesB: initRotaciones(), inicioA: '', finA: '', saqueInicial: 'B' },
    { puntosTachadosA: [], puntosTachadosB: [], rotacionesA: initRotaciones(), rotacionesB: initRotaciones(), inicioA: '', finA: '', saqueInicial: 'A' }
  ]);

  function initRotaciones() {
    return ['I', 'II', 'III', 'IV', 'V', 'VI'].map(() => ({
      numero: '',
      jugador: '',
      jugadorLib: '',
      saques: [false, false, false, false, false, false, false, false]
    }));
  }

  const API_URL_PARTIDO = 'http://localhost:8080/api/partidos';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    if (idPartido) {
      cargarDatosPartido();
    }
  }, [idPartido]);

  const cargarDatosPartido = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL_PARTIDO}/${idPartido}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        const partido = data.data || data.partido || data;
        setDatosPartido(partido);
        
        // Pre-llenar datos si existen
        setDatosGenerales(prev => ({
          ...prev,
          equipoA: partido.equipoLocal?.nombre || '',
          equipoB: partido.equipoVisitante?.nombre || '',
          lugar: partido.cancha?.nombre || '',
          competicion: partido.campeonato?.nombre || ''
        }));
      }
    } catch (err) {
      console.error('Error al cargar partido:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const togglePunto = (setIdx, equipo, puntoIdx) => {
    setSets(prev => {
      const newSets = [...prev];
      const campo = equipo === 'A' ? 'puntosTachadosA' : 'puntosTachadosB';
      const actual = newSets[setIdx][campo];
      
      if (actual.includes(puntoIdx)) {
        newSets[setIdx][campo] = actual.filter(p => p !== puntoIdx);
      } else {
        newSets[setIdx][campo] = [...actual, puntoIdx];
      }
      
      return newSets;
    });
  };

  const toggleSaque = (setIdx, equipo, rotIdx, saqueIdx) => {
    setSets(prev => {
      const newSets = [...prev];
      const campo = equipo === 'A' ? 'rotacionesA' : 'rotacionesB';
      newSets[setIdx][campo][rotIdx].saques[saqueIdx] = !newSets[setIdx][campo][rotIdx].saques[saqueIdx];
      return newSets;
    });
  };

  const updateRotacion = (setIdx, equipo, rotIdx, field, value) => {
    setSets(prev => {
      const newSets = [...prev];
      const campo = equipo === 'A' ? 'rotacionesA' : 'rotacionesB';
      newSets[setIdx][campo][rotIdx][field] = value;
      return newSets;
    });
  };

  const toggleSaqueInicial = (setIdx, equipo) => {
    setSets(prev => {
      const newSets = [...prev];
      newSets[setIdx].saqueInicial = equipo;
      return newSets;
    });
  };

  // Componente de Set reutilizable
  const SetBox = ({ setIndex, setNum, saqueInicial }) => {
    const setData = sets[setIndex];
    const equipoA = datosGenerales.equipoA || 'A';
    const equipoB = datosGenerales.equipoB || 'B';

    // Generar 48 puntos (12 columnas x 4 filas)
    const renderPuntos = (equipo) => {
      const puntosTachados = equipo === 'A' ? setData.puntosTachadosA : setData.puntosTachadosB;
      const puntos = [];
      
      for (let i = 0; i < 12; i++) {
        const p1 = i + 1;
        const p2 = i + 13;
        const p3 = i + 25;
        const p4 = i + 37;
        
        [p1, p2, p3, p4].forEach(p => {
          puntos.push(
            <div
              key={`${equipo}-${p}`}
              className={`pt ${puntosTachados.includes(p) ? 'tachado' : ''}`}
              onClick={() => togglePunto(setIndex, equipo, p)}
            >
              {p}
            </div>
          );
        });
      }
      
      return puntos;
    };

    const renderRotaciones = (equipo) => {
      const rotaciones = equipo === 'A' ? setData.rotacionesA : setData.rotacionesB;
      const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI'];
      
      return romanos.map((rom, rotIdx) => (
        <div key={`${equipo}-rot-${rotIdx}`} className="jug-col">
          <div className="cell-gray">{rom}</div>
          <div className="cell-std">
            <input
              placeholder="#"
              value={rotaciones[rotIdx].numero}
              onChange={(e) => updateRotacion(setIndex, equipo, rotIdx, 'numero', e.target.value)}
            />
          </div>
          <div className="cell-std">
            <input
              value={rotaciones[rotIdx].jugador}
              onChange={(e) => updateRotacion(setIndex, equipo, rotIdx, 'jugador', e.target.value)}
            />
          </div>
          <div className="cell-std">
            <input
              value={rotaciones[rotIdx].jugadorLib}
              onChange={(e) => updateRotacion(setIndex, equipo, rotIdx, 'jugadorLib', e.target.value)}
            />
          </div>
          <div className="saques">
            {[...Array(8)].map((_, saqueIdx) => (
              <div
                key={saqueIdx}
                className={`sq ${rotaciones[rotIdx].saques[saqueIdx] ? 'ok' : ''}`}
                onClick={() => toggleSaque(setIndex, equipo, rotIdx, saqueIdx)}
              >
                <span>{saqueIdx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      ));
    };

    return (
      <div className="set-box">
        <div className="set-lat">
          <div>In: <input style={{ width: '20px', borderBottom: '1px solid black' }} value={setData.inicioA} onChange={(e) => {
            setSets(prev => {
              const newSets = [...prev];
              newSets[setIndex].inicioA = e.target.value;
              return newSets;
            });
          }} /></div>
          <div>S</div>
        </div>
        
        <div className="col">
          <div className="equipo-head">
            <div
              className="bola"
              style={saqueInicial === 'A' ? { background: 'black', color: 'white' } : {}}
              onClick={() => toggleSaqueInicial(setIndex, 'A')}
            >
              A
            </div>
            <input placeholder="Equipo A" value={equipoA} disabled />
          </div>
          <div className="rot-grid">{renderRotaciones('A')}</div>
        </div>
        
        <div className="pts-col">{renderPuntos('A')}</div>
        <div className="pts-col der">{renderPuntos('B')}</div>
        
        <div className="col">
          <div className="equipo-head">
            <div
              className="bola"
              style={saqueInicial === 'B' ? { background: 'black', color: 'white' } : {}}
              onClick={() => toggleSaqueInicial(setIndex, 'B')}
            >
              B
            </div>
            <input placeholder="Equipo B" value={equipoB} disabled />
          </div>
          <div className="rot-grid">{renderRotaciones('B')}</div>
        </div>
        
        <div className="set-lat der">
          <div>Fin: <input style={{ width: '20px', borderBottom: '1px solid black' }} value={setData.finA} onChange={(e) => {
            setSets(prev => {
              const newSets = [...prev];
              newSets[setIndex].finA = e.target.value;
              return newSets;
            });
          }} /></div>
          <div style={{ transform: 'rotate(180deg)' }}>SET {setNum}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="planilla-container">
      <style>{`
        :root {
          --borde-negro: 2px solid #000;
          --borde-fino: 1px solid #000;
          --fondo-gris: #e6e6e6;
          --fuente: 'Arial Narrow', 'Roboto Condensed', sans-serif;
          --altura-set: 165px;
          --altura-header: 75px;
        }

        @page { 
          size: A4 landscape; 
          margin: 5mm; 
        }

        .planilla-container {
          font-family: var(--fuente);
          font-size: 11px;
          background: #555;
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
        }

        .planilla-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .planilla-controls button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-imprimir {
          background: #3b82f6;
          color: white;
        }

        .btn-imprimir:hover {
          background: #2563eb;
        }

        .btn-volver {
          background: #6b7280;
          color: white;
        }

        .btn-volver:hover {
          background: #4b5563;
        }

        .hoja {
          width: 297mm;
          height: 200mm;
          background: white;
          padding: 5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        input {
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

        textarea {
          width: 100%;
          flex-grow: 1;
          border: none;
          resize: none;
          padding: 2px;
          font-family: inherit;
          outline: none;
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
        .borde-box { border: var(--borde-negro); box-sizing: border-box; }

        .header {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr;
          border: var(--borde-negro);
          height: var(--altura-header);
          margin-bottom: 5px;
        }
        .header-info { padding: 4px; font-size: 10px; }
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
        .jug-col:last-child { border-right: none; }
        .cell-gray {
          background: var(--fondo-gris);
          border-bottom: var(--borde-fino);
          text-align: center;
          font-weight: bold;
        }
        .cell-std { border-bottom: var(--borde-fino); }

        .pts-col {
          border-left: var(--borde-negro);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-content: start;
          font-size: 6px;
        }
        .pts-col.der { border-right: var(--borde-negro); }
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
        .sq.ok { background-color: black; }

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
        table.t-fina th { background: var(--fondo-gris); }

        @media print {
          .planilla-container {
            background: white;
            padding: 0;
          }
          .planilla-controls {
            display: none !important;
          }
          .hoja {
            width: 100%;
            height: 100%;
            border: none;
            padding: 0;
            box-shadow: none;
          }
          .titulo-caja,
          .cell-gray,
          .header-logo {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Controles (NO se imprimen) */}
      <div className="planilla-controls print:hidden">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Volver
        </button>
        <button className="btn-imprimir" onClick={handleImprimir}>
          <Printer size={18} />
          Imprimir Planilla
        </button>
      </div>

      {/* Hoja A4 */}
      <div className="hoja">
        {/* ENCABEZADO */}
        <div className="header">
          <div className="header-info col">
            <div className="fila">
              <b>Competición:</b>{' '}
              <input
                className="linea"
                value={datosGenerales.competicion}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, competicion: e.target.value })}
              />
            </div>
            <div className="fila" style={{ marginTop: '2px' }}>
              Ciudad:{' '}
              <input
                className="linea"
                value={datosGenerales.ciudad}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, ciudad: e.target.value })}
              />{' '}
              Cód:{' '}
              <input
                className="linea"
                style={{ width: '30px' }}
                value={datosGenerales.codigo}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, codigo: e.target.value })}
              />
            </div>
            <div className="fila" style={{ marginTop: '2px' }}>
              Lugar:{' '}
              <input
                className="linea"
                value={datosGenerales.lugar}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, lugar: e.target.value })}
              />{' '}
              Partido:{' '}
              <input
                className="linea"
                style={{ width: '30px' }}
                value={datosGenerales.partidoNum}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, partidoNum: e.target.value })}
              />
            </div>
            <div className="fila" style={{ marginTop: '5px', fontSize: '9px' }}>
              Div:{' '}
              <input
                type="radio"
                checked={datosGenerales.division === 'M'}
                onChange={() => setDatosGenerales({ ...datosGenerales, division: 'M' })}
              />{' '}
              M{' '}
              <input
                type="radio"
                checked={datosGenerales.division === 'F'}
                onChange={() => setDatosGenerales({ ...datosGenerales, division: 'F' })}
              />{' '}
              F | Cat:{' '}
              <input
                type="radio"
                checked={datosGenerales.categoria === 'Sen'}
                onChange={() => setDatosGenerales({ ...datosGenerales, categoria: 'Sen' })}
              />{' '}
              Sen{' '}
              <input
                type="radio"
                checked={datosGenerales.categoria === 'Jun'}
                onChange={() => setDatosGenerales({ ...datosGenerales, categoria: 'Jun' })}
              />{' '}
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
                fontWeight: 'bold'
              }}
            >
              PLANILLA DE ANOTACIÓN
            </div>
          </div>
        </div>

        {/* SETS 1-4 */}
        <div className="grid-2">
          <div className="col">
            <SetBox setIndex={0} setNum={1} saqueInicial={sets[0].saqueInicial} />
            <SetBox setIndex={2} setNum={3} saqueInicial={sets[2].saqueInicial} />
          </div>
          <div className="col">
            <SetBox setIndex={1} setNum={2} saqueInicial={sets[1].saqueInicial} />
            <SetBox setIndex={3} setNum={4} saqueInicial={sets[3].saqueInicial} />
          </div>
        </div>

        {/* BLOQUE INFERIOR */}
        <div className="bloque-inferior" style={{ marginTop: '5px' }}>
          {/* COLUMNA IZQUIERDA: SET 5 + SANCIONES */}
          <div className="inf-col-izq">
            <SetBox setIndex={4} setNum={5} saqueInicial={sets[4].saqueInicial} />

            <div className="caja-restante" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
              <div style={{ borderRight: '1px solid black', padding: 0 }}>
                <div className="titulo-caja">SANCIONES</div>
                <table className="t-fina">
                  <tbody>
                    <tr>
                      <th>A</th>
                      <th>C</th>
                      <th>E</th>
                      <th>D</th>
                      <th>Eq</th>
                      <th>S</th>
                      <th>P</th>
                    </tr>
                    {sanciones.map((sancion, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            value={sancion.A}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].A = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.C}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].C = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.E}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].E = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.D}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].D = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.Eq}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].Eq = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.S}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].S = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={sancion.P}
                            onChange={(e) => {
                              const newSanciones = [...sanciones];
                              newSanciones[idx].P = e.target.value;
                              setSanciones(newSanciones);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="titulo-caja">OBSERVACIONES</div>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: APROBACIÓN + RESULTADOS + FIRMAS */}
          <div className="inf-col-der">
            <div
              className="caja-restante"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', border: 'var(--borde-negro)', height: '100%' }}
            >
              {/* APROBACIÓN */}
              <div style={{ borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
                <div className="titulo-caja">APROBACIÓN</div>
                <div style={{ padding: '2px', fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>Arb. Nombre - País</div>
                  <div style={{ borderBottom: '1px solid #ccc' }}>
                    1°:{' '}
                    <input
                      style={{ width: '80%' }}
                      value={arbitros.primero}
                      onChange={(e) => setArbitros({ ...arbitros, primero: e.target.value })}
                    />
                  </div>
                  <div style={{ borderBottom: '1px solid #ccc' }}>
                    2°:{' '}
                    <input
                      style={{ width: '80%' }}
                      value={arbitros.segundo}
                      onChange={(e) => setArbitros({ ...arbitros, segundo: e.target.value })}
                    />
                  </div>
                  <div style={{ borderBottom: '1px solid #ccc' }}>
                    Anot:{' '}
                    <input
                      style={{ width: '80%' }}
                      value={arbitros.anotador}
                      onChange={(e) => setArbitros({ ...arbitros, anotador: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    Cap A:{' '}
                    <input
                      style={{ width: '20px', borderBottom: '1px solid black' }}
                      value={arbitros.capA}
                      onChange={(e) => setArbitros({ ...arbitros, capA: e.target.value })}
                    />
                    Cap B:{' '}
                    <input
                      style={{ width: '20px', borderBottom: '1px solid black' }}
                      value={arbitros.capB}
                      onChange={(e) => setArbitros({ ...arbitros, capB: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* RESULTADOS */}
              <div style={{ borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
                <div className="titulo-caja">RESULTADOS</div>
                <table className="t-fina">
                  <tbody>
                    <tr>
                      <th colSpan="3">Equipo A</th>
                      <th>S</th>
                      <th colSpan="3">Equipo B</th>
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
                    {[1, 2, 3, 4, 5].map((set) => {
                      const setKey = `set${set}`;
                      return (
                        <tr key={set}>
                          <td>
                            <input
                              value={resultados[setKey].tA}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], tA: e.target.value }
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={resultados[setKey].sA}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], sA: e.target.value }
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={resultados[setKey].gA}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], gA: e.target.value }
                                })
                              }
                            />
                          </td>
                          <td>{set}</td>
                          <td>
                            <input
                              value={resultados[setKey].gB}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], gB: e.target.value }
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={resultados[setKey].sB}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], sB: e.target.value }
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={resultados[setKey].tB}
                              onChange={(e) =>
                                setResultados({
                                  ...resultados,
                                  [setKey]: { ...resultados[setKey], tB: e.target.value }
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#eee' }}>
                      <td>
                        <input
                          value={resultados.totalA.t}
                          onChange={(e) => setResultados({ ...resultados, totalA: { ...resultados.totalA, t: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          value={resultados.totalA.s}
                          onChange={(e) => setResultados({ ...resultados, totalA: { ...resultados.totalA, s: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          value={resultados.totalA.g}
                          onChange={(e) => setResultados({ ...resultados, totalA: { ...resultados.totalA, g: e.target.value } })}
                        />
                      </td>
                      <td>T</td>
                      <td>
                        <input
                          value={resultados.totalB.g}
                          onChange={(e) => setResultados({ ...resultados, totalB: { ...resultados.totalB, g: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          value={resultados.totalB.s}
                          onChange={(e) => setResultados({ ...resultados, totalB: { ...resultados.totalB, s: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          value={resultados.totalB.t}
                          onChange={(e) => setResultados({ ...resultados, totalB: { ...resultados.totalB, t: e.target.value } })}
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
                    marginTop: 'auto'
                  }}
                >
                  GANADOR:{' '}
                  <input
                    style={{ width: '50px' }}
                    value={resultados.ganador}
                    onChange={(e) => setResultados({ ...resultados, ganador: e.target.value })}
                  />{' '}
                  <input
                    style={{ width: '50px' }}
                    value={resultados.marcador}
                    onChange={(e) => setResultados({ ...resultados, marcador: e.target.value })}
                  />
                </div>
              </div>

              {/* FIRMAS */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="titulo-caja">FIRMAS</div>
                <div
                  style={{
                    flexGrow: 1,
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around'
                  }}
                >
                  <div>
                    Capitanes: <div style={{ borderBottom: '1px solid black', height: '10px' }}></div>
                  </div>
                  <div>
                    Entrenadores: <div style={{ borderBottom: '1px solid black', height: '10px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanillaPartido;
