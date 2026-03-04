// ===============================================
// ARCHIVO: src/components/PlanillaFIVB.jsx
// Planilla de Anotación formato FIVB oficial
// ===============================================

import { useRef } from 'react';
import { Printer } from 'lucide-react';

// Helper para strings seguros (global para SetBox)
const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return val.nombre || '';
  return String(val);
};

// Componente para un Set individual
const SetBox = ({ numero, equipoA, equipoB, datosSet, invertirEquipos }) => {
  const teamA = safeStr(invertirEquipos ? equipoB : equipoA) || 'Equipo A';
  const teamB = safeStr(invertirEquipos ? equipoA : equipoB) || 'Equipo B';
  const letraA = invertirEquipos ? 'B' : 'A';
  const letraB = invertirEquipos ? 'A' : 'B';

  // Generar cuadrícula de puntos (1-30) - formato simple horizontal
  const renderPuntos = (puntosAnotados) => {
    const marcador = typeof puntosAnotados === 'number' ? puntosAnotados : 0;
    const filas = [];

    // 6 filas de 5 números cada una (1-5, 6-10, 11-15, 16-20, 21-25, 26-30)
    for (let fila = 0; fila < 6; fila++) {
      const celdas = [];
      for (let col = 0; col < 5; col++) {
        const num = fila * 5 + col + 1;
        const marcado = num <= marcador;
        celdas.push(
          <div key={num} className={`pt ${marcado ? 'pt-marcado' : ''}`}>
            {num}
          </div>
        );
      }
      filas.push(<div key={`fila-${fila}`} className="pts-fila">{celdas}</div>);
    }
    return filas;
  };

  // Generar columnas de rotación (I-VI)
  const renderRotaciones = (jugadores = []) => {
    const posiciones = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    return posiciones.map((pos, idx) => {
      const jugador = jugadores[idx] || {};
      return (
        <div key={pos} className="jug-col">
          <div className="cell-gray">{pos}</div>
          <div className="cell-std">{jugador.dorsal || ''}</div>
          <div className="cell-std">{jugador.nombre || ''}</div>
          <div className="cell-std"></div>
          <div className="saques">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="sq"><span>{n}</span></div>
            ))}
          </div>
        </div>
      );
    });
  };

  // Obtener puntos del set según la orientación
  const puntosA = invertirEquipos ? (datosSet?.puntos_visitante ?? '-') : (datosSet?.puntos_local ?? '-');
  const puntosB = invertirEquipos ? (datosSet?.puntos_local ?? '-') : (datosSet?.puntos_visitante ?? '-');

  return (
    <div className="set-box">
      {/* Lateral izquierdo */}
      <div className="set-lat">
        <div>In: ___</div>
        <div>S</div>
      </div>

      {/* Equipo A */}
      <div className="col">
        <div className="equipo-head">
          <div className="bola">{letraA}</div>
          <span className="equipo-nombre">{teamA}</span>
          {datosSet && <span className="marcador-set">{puntosA}</span>}
        </div>
        <div className="rot-grid">
          {renderRotaciones(datosSet?.rotacionesA)}
        </div>
      </div>

      {/* Puntos equipo A */}
      <div className="pts-col">{renderPuntos(puntosA)}</div>

      {/* Puntos equipo B */}
      <div className="pts-col der">{renderPuntos(puntosB)}</div>

      {/* Equipo B */}
      <div className="col">
        <div className="equipo-head">
          <div className="bola">{letraB}</div>
          <span className="equipo-nombre">{teamB}</span>
          {datosSet && <span className="marcador-set">{puntosB}</span>}
        </div>
        <div className="rot-grid">
          {renderRotaciones(datosSet?.rotacionesB)}
        </div>
      </div>

      {/* Lateral derecho */}
      <div className="set-lat der">
        <div>Fin: ___</div>
        <div className="set-numero">SET {numero}</div>
        {datosSet && (datosSet.puntos_local !== undefined || datosSet.puntos_visitante !== undefined) && (
          <div className="set-resultado-final">
            {invertirEquipos
              ? `${datosSet.puntos_visitante ?? '-'}-${datosSet.puntos_local ?? '-'}`
              : `${datosSet.puntos_local ?? '-'}-${datosSet.puntos_visitante ?? '-'}`
            }
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal de la Planilla FIVB
export function PlanillaFIVB({ datos, onClose }) {
  const planillaRef = useRef(null);

  // DEBUG: Ver qué datos llegan al componente
  console.log('🎯 PlanillaFIVB - datos recibidos:', datos);

  if (!datos) return null;

  const { datosGenerales, resultado, arbitraje, capitanes, planteles, sets } = datos;

  // DEBUG: Ver datos extraídos
  console.log('📋 Datos extraídos:', {
    datosGenerales,
    resultado,
    arbitraje,
    capitanes,
    planteles,
    sets
  });

  // Helper para asegurar strings seguros
  const safe = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return val.nombre || '';
    return String(val);
  };

  const handleImprimir = () => {
    window.print();
  };

  // Obtener jugadores para mostrar
  const jugadoresLocal = planteles?.local?.jugadores || [];
  const jugadoresVisitante = planteles?.visitante?.jugadores || [];

  // Helper para obtener puntos del set (puede venir como scoreA/scoreB o puntos_local/puntos_visitante)
  const getPuntosSet = (set, tipo) => {
    if (!set) return '-';
    if (tipo === 'local') {
      return set.puntos_local ?? set.scoreA ?? '-';
    }
    return set.puntos_visitante ?? set.scoreB ?? '-';
  };

  return (
    <div className="planilla-fivb-container">
      {/* Botones de acción */}
      <div className="no-print mb-4 flex gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Volver
        </button>
        <button
          onClick={handleImprimir}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Printer size={18} />
          Imprimir Planilla
        </button>
      </div>

      {/* Hoja A4 Landscape */}
      <div className="hoja" ref={planillaRef}>
        {/* ENCABEZADO */}
        <div className="header">
          <div className="header-info col">
            <div className="fila"><b>Competición:</b> <span className="linea">{safe(datosGenerales?.competicion) || '___'}</span></div>
            <div className="fila">Ciudad: <span className="linea">{safe(datosGenerales?.ciudad) || '___'}</span> Cód: <span className="linea">___</span></div>
            <div className="fila">Lugar: <span className="linea">{safe(datosGenerales?.lugar) || '___'}</span> Partido: <span className="linea">___</span></div>
            <div className="fila" style={{ marginTop: '5px', fontSize: '9px' }}>
              Div: {datosGenerales?.genero === 'M' ? '●' : '○'}M {datosGenerales?.genero === 'F' ? '●' : '○'}F |
              Cat: <span className="linea">{safe(datosGenerales?.categoria) || '___'}</span>
            </div>
          </div>
          <div className="header-logo">FIVB</div>
          <div className="header-info col center">
            <b>FEDERATION INTERNATIONALE DE VOLLEYBALL</b>
            <div className="planilla-titulo">PLANILLA DE ANOTACIÓN</div>
            <div className="fecha-hora">
              Fecha: {safe(datosGenerales?.fecha) || '___'} | Hora: {safe(datosGenerales?.hora) || '___'}
            </div>
          </div>
        </div>

        {/* SETS 1-4 en grid 2x2 */}
        <div className="grid-2">
          <div className="col">
            <SetBox
              numero={1}
              equipoA={datosGenerales?.equipoA?.nombre}
              equipoB={datosGenerales?.equipoB?.nombre}
              datosSet={sets?.[0]}
              invertirEquipos={false}
            />
            <SetBox
              numero={3}
              equipoA={datosGenerales?.equipoA?.nombre}
              equipoB={datosGenerales?.equipoB?.nombre}
              datosSet={sets?.[2]}
              invertirEquipos={false}
            />
          </div>
          <div className="col">
            <SetBox
              numero={2}
              equipoA={datosGenerales?.equipoA?.nombre}
              equipoB={datosGenerales?.equipoB?.nombre}
              datosSet={sets?.[1]}
              invertirEquipos={true}
            />
            <SetBox
              numero={4}
              equipoA={datosGenerales?.equipoA?.nombre}
              equipoB={datosGenerales?.equipoB?.nombre}
              datosSet={sets?.[3]}
              invertirEquipos={true}
            />
          </div>
        </div>

        {/* BLOQUE INFERIOR */}
        <div className="bloque-inferior">
          {/* Columna izquierda: Set 5 + Sanciones */}
          <div className="inf-col-izq">
            <SetBox
              numero={5}
              equipoA={datosGenerales?.equipoA?.nombre}
              equipoB={datosGenerales?.equipoB?.nombre}
              datosSet={sets?.[4]}
              invertirEquipos={false}
            />

            <div className="caja-sanciones">
              <div className="caja-inner">
                <div className="titulo-caja">SANCIONES</div>
                <table className="t-fina">
                  <thead>
                    <tr><th>A</th><th>C</th><th>E</th><th>D</th><th>Eq</th><th>S</th><th>P</th></tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map(i => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6, 7].map(j => <td key={j}></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="caja-obs">
                <div className="titulo-caja">OBSERVACIONES</div>
                <div className="obs-content"></div>
              </div>
            </div>
          </div>

          {/* Columna derecha: Aprobación + Resultados + Firmas */}
          <div className="inf-col-der">
            <div className="caja-resultados">
              {/* Aprobación */}
              <div className="seccion-aprobacion">
                <div className="titulo-caja">APROBACIÓN</div>
                <div className="aprobacion-content">
                  <div className="arb-linea">1° Árb: {safe(arbitraje?.primer_arbitro) || '___'}</div>
                  <div className="arb-linea">2° Árb: {safe(arbitraje?.segundo_arbitro) || '___'}</div>
                  <div className="arb-linea">Anot: {safe(arbitraje?.anotador) || '___'}</div>
                  <div className="caps-linea">
                    <span>Cap A: {capitanes?.local ? `#${safe(capitanes.local.dorsal)} ${safe(capitanes.local.nombre)}` : '___'}</span>
                    <span>Cap B: {capitanes?.visitante ? `#${safe(capitanes.visitante.dorsal)} ${safe(capitanes.visitante.nombre)}` : '___'}</span>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              <div className="seccion-resultados">
                <div className="titulo-caja">RESULTADOS</div>
                <table className="t-fina">
                  <thead>
                    <tr>
                      <th colSpan="3">{safe(datosGenerales?.equipoA?.nombre) || 'Equipo A'}</th>
                      <th>S</th>
                      <th colSpan="3">{safe(datosGenerales?.equipoB?.nombre) || 'Equipo B'}</th>
                    </tr>
                    <tr><th>T</th><th>S</th><th>G</th><th></th><th>G</th><th>S</th><th>T</th></tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(setNum => {
                      const set = sets?.[setNum - 1];
                      return (
                        <tr key={setNum}>
                          <td></td>
                          <td></td>
                          <td>{getPuntosSet(set, 'local')}</td>
                          <td className="set-num">{setNum}</td>
                          <td>{getPuntosSet(set, 'visitante')}</td>
                          <td></td>
                          <td></td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                      <td></td>
                      <td></td>
                      <td>{resultado?.sets_local ?? 0}</td>
                      <td>T</td>
                      <td>{resultado?.sets_visitante ?? 0}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div className="ganador-linea">
                  GANADOR: {(resultado?.sets_local ?? 0) > (resultado?.sets_visitante ?? 0)
                    ? safe(datosGenerales?.equipoA?.nombre) || 'Equipo A'
                    : safe(datosGenerales?.equipoB?.nombre) || 'Equipo B'} {resultado?.sets_local ?? 0} : {resultado?.sets_visitante ?? 0}
                </div>
              </div>

              {/* Firmas */}
              <div className="seccion-firmas">
                <div className="titulo-caja">FIRMAS</div>
                <div className="firmas-content">
                  <div className="firma-linea">Capitanes: _________________</div>
                  <div className="firma-linea">Entrenadores: _________________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLANTELES - Segunda hoja para impresión */}
      {(jugadoresLocal.length > 0 || jugadoresVisitante.length > 0) && (
        <div className="hoja planteles-hoja">
          <div className="header" style={{ height: 'auto', padding: '8px' }}>
            <div className="header-info col" style={{ gridColumn: 'span 3' }}>
              <h2 style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>PLANTELES DE EQUIPOS</h2>
              <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: '10px' }}>
                {safe(datosGenerales?.competicion)} - {safe(datosGenerales?.categoria)}
              </p>
            </div>
          </div>

          <div className="planteles-grid">
            {/* Equipo Local */}
            <div className="plantel-seccion">
              <div className="titulo-caja">{safe(datosGenerales?.equipoA?.nombre) || 'Equipo A'}</div>
              <table className="t-fina">
                <thead>
                  <tr><th>#</th><th>Jugador</th></tr>
                </thead>
                <tbody>
                  {jugadoresLocal.map((j, idx) => (
                    <tr key={idx}>
                      <td style={{ width: '40px', fontWeight: 'bold' }}>{safe(j.numero_dorsal)}</td>
                      <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{safe(j.nombre_completo)}</td>
                    </tr>
                  ))}
                  {jugadoresLocal.length === 0 && (
                    <tr><td colSpan="2" style={{ color: '#999' }}>Sin jugadores registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Equipo Visitante */}
            <div className="plantel-seccion">
              <div className="titulo-caja">{safe(datosGenerales?.equipoB?.nombre) || 'Equipo B'}</div>
              <table className="t-fina">
                <thead>
                  <tr><th>#</th><th>Jugador</th></tr>
                </thead>
                <tbody>
                  {jugadoresVisitante.map((j, idx) => (
                    <tr key={idx}>
                      <td style={{ width: '40px', fontWeight: 'bold' }}>{safe(j.numero_dorsal)}</td>
                      <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{safe(j.nombre_completo)}</td>
                    </tr>
                  ))}
                  {jugadoresVisitante.length === 0 && (
                    <tr><td colSpan="2" style={{ color: '#999' }}>Sin jugadores registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Estilos embebidos para impresión */}
      <style>{`
        .planilla-fivb-container {
          --borde-negro: 2px solid #000;
          --borde-fino: 1px solid #000;
          --fondo-gris: #e6e6e6;
          --fuente: 'Arial Narrow', 'Roboto Condensed', Arial, sans-serif;
          --altura-set: 155px;
          --altura-header: 70px;
        }

        .hoja {
          width: 297mm;
          min-height: 210mm;
          background: white;
          padding: 6mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          font-family: var(--fuente);
          font-size: 10px;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }

        /* UTILIDADES */
        .fila { display: flex; width: 100%; gap: 4px; align-items: center; }
        .col { display: flex; flex-direction: column; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .titulo-caja {
          background: var(--fondo-gris);
          text-align: center;
          font-weight: bold;
          border-bottom: var(--borde-fino);
          font-size: 10px;
          padding: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .linea {
          border-bottom: 1px solid black;
          display: inline-block;
          min-width: 60px;
          padding: 0 4px;
        }

        /* ENCABEZADO */
        .header {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr;
          border: var(--borde-negro);
          height: var(--altura-header);
          margin-bottom: 5px;
        }
        .header-info { padding: 4px; font-size: 9px; }
        .header-info.center { text-align: center; justify-content: center; }
        .header-logo {
          font-size: 28pt;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: var(--borde-negro);
          border-right: var(--borde-negro);
          color: #003366;
        }
        .planilla-titulo {
          border-top: 2px solid black;
          margin-top: 5px;
          padding-top: 2px;
          font-weight: bold;
        }
        .fecha-hora { margin-top: 4px; font-size: 9px; }

        /* SETS */
        .set-box {
          border: var(--borde-negro);
          height: var(--altura-set);
          margin-bottom: 5px;
          display: grid;
          grid-template-columns: 20px 1fr 65px 65px 1fr 20px;
          overflow: hidden;
        }

        .set-lat {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
          font-weight: bold;
          font-size: 7px;
          border-right: var(--borde-fino);
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 2px;
          background: #f8f8f8;
        }
        .set-lat.der { border-right: none; border-left: var(--borde-fino); }
        .set-numero { transform: rotate(180deg); font-size: 9px; }
        .set-resultado-final {
          transform: rotate(180deg);
          font-size: 9px;
          font-weight: bold;
          color: #0066cc;
          background: #e6f0ff;
          padding: 2px 3px;
          border-radius: 3px;
        }

        .equipo-head {
          height: 18px;
          border-bottom: var(--borde-negro);
          display: flex;
          align-items: center;
          padding: 0 4px;
          gap: 4px;
          background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
        }
        .equipo-nombre { font-weight: bold; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
        .marcador-set {
          background: #0066cc;
          color: white;
          font-weight: bold;
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 3px;
          margin-left: auto;
        }
        .bola {
          width: 14px;
          height: 14px;
          border: 2px solid black;
          border-radius: 50%;
          text-align: center;
          line-height: 10px;
          font-weight: bold;
          font-size: 9px;
          flex-shrink: 0;
          background: white;
        }

        /* Rotaciones */
        .rot-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          height: calc(100% - 18px);
        }
        .jug-col {
          border-right: var(--borde-fino);
          display: grid;
          grid-template-rows: 14px 16px 16px 16px 1fr;
        }
        .jug-col:last-child { border-right: none; }
        .cell-gray {
          background: var(--fondo-gris);
          border-bottom: var(--borde-fino);
          text-align: center;
          font-weight: bold;
          font-size: 8px;
          line-height: 14px;
        }
        .cell-std {
          border-bottom: var(--borde-fino);
          text-align: center;
          font-size: 8px;
          line-height: 16px;
        }

        /* Puntos */
        .pts-col {
          border-left: var(--borde-negro);
          display: flex;
          flex-direction: column;
          padding: 3px;
          gap: 2px;
          justify-content: space-evenly;
        }
        .pts-col.der { border-right: var(--borde-negro); border-left: var(--borde-fino); }
        .pts-fila {
          display: flex;
          gap: 2px;
          flex: 1;
        }
        .pt {
          flex: 1;
          border: 1px solid #666;
          border-radius: 3px;
          text-align: center;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          min-width: 0;
        }
        .pt-marcado {
          background: #222;
          color: #fff;
          font-weight: bold;
          border-color: #000;
        }

        /* Saques */
        .saques {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(4, 1fr);
          border-top: 1px solid #ccc;
        }
        .sq {
          border-right: 1px dotted #999;
          border-bottom: 1px dotted #999;
          position: relative;
          font-size: 6px;
          background: #fefefe;
        }
        .sq span { position: absolute; top: 1px; left: 2px; color: #666; }

        /* BLOQUE INFERIOR */
        .bloque-inferior {
          display: flex;
          gap: 6px;
          flex-grow: 1;
          margin-top: 6px;
        }
        .inf-col-izq { width: 50%; display: flex; flex-direction: column; gap: 6px; }
        .inf-col-der { width: 50%; display: flex; flex-direction: column; gap: 6px; }

        /* Sanciones */
        .caja-sanciones {
          flex-grow: 1;
          border: var(--borde-negro);
          display: grid;
          grid-template-columns: 1.2fr 1fr;
        }
        .caja-inner { border-right: 1px solid black; }
        .caja-obs { display: flex; flex-direction: column; }
        .obs-content { flex-grow: 1; padding: 4px; }

        /* Resultados */
        .caja-resultados {
          flex-grow: 1;
          border: var(--borde-negro);
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          height: 100%;
        }
        .seccion-aprobacion { border-right: 1px solid black; display: flex; flex-direction: column; }
        .seccion-resultados { border-right: 1px solid black; display: flex; flex-direction: column; }
        .seccion-firmas { display: flex; flex-direction: column; }

        .aprobacion-content { padding: 6px; font-size: 9px; display: flex; flex-direction: column; gap: 6px; }
        .arb-linea { border-bottom: 1px solid #ccc; padding: 3px 0; }
        .caps-linea { display: flex; justify-content: space-between; margin-top: 6px; flex-wrap: wrap; gap: 4px; }

        .firmas-content { flex-grow: 1; padding: 10px; display: flex; flex-direction: column; justify-content: space-around; }
        .firma-linea { font-size: 9px; }

        /* Tablas */
        .t-fina { width: 100%; border-collapse: collapse; font-size: 9px; text-align: center; }
        .t-fina td, .t-fina th { border: 1px solid black; height: 18px; }
        .t-fina th { background: var(--fondo-gris); font-weight: bold; }
        .set-num { font-weight: bold; background: #f0f0f0; }
        .total-row { background: #ddd; font-weight: bold; }
        .ganador-linea {
          text-align: center;
          padding: 6px;
          font-weight: bold;
          font-size: 11px;
          border-top: 2px solid black;
          margin-top: auto;
          background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
        }

        /* Planteles */
        .planteles-hoja {
          margin-top: 20px;
          min-height: auto;
        }
        .planteles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 10px;
        }
        .plantel-seccion {
          border: var(--borde-negro);
        }
        .plantel-seccion .t-fina td {
          height: 20px;
        }

        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .planilla-fivb-container { padding: 0; }
          .hoja {
            width: 100%;
            height: 100%;
            box-shadow: none;
            padding: 5mm;
          }
          .titulo-caja, .cell-gray, .header-logo, .total-row, .pt-marcado {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: A4 landscape; margin: 3mm; }
        }

        @media screen and (max-width: 1400px) {
          .hoja {
            width: 100%;
            transform: scale(0.75);
            transform-origin: top center;
          }
        }

        @media screen and (max-width: 1000px) {
          .hoja {
            width: 100%;
            transform: scale(0.6);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  );
}

export default PlanillaFIVB;
