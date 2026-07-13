import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { API_BASE } from '../services/api.config';

const HEADERS = ['ci', 'nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'genero', 'estatura', 'dorsal'];
const HEADER_WIDTHS = [12, 18, 18, 18, 16, 12, 10, 8];

const TEMPLATE_ROWS = [
  ['12345678', 'Juan', 'Pérez', 'García', '1995-03-15', 'masculino', 185, 10],
  ['87654321', 'María', 'López', '', '1998-07-22', 'femenino', 170, 5],
];

const GENEROS_VALIDOS = ['masculino', 'femenino', 'otro'];

// ── Parsers ────────────────────────────────────────────────────────────────

function normalizeRow(obj, index) {
  // Normalizar claves: quitar tildes, espacios, pasar a minúsculas
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.trim()
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '_');
    clean[key] = v !== undefined && v !== null ? String(v).trim() : '';
  }
  clean._fila = index + 2;
  return clean;
}

function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
  return rows.map(normalizeRow).filter(r => r.ci || r.nombre);
}

function parseCSV(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = Object.fromEntries(headers.map((h, j) => [h, values[j] ?? '']));
    return normalizeRow(obj, i);
  }).filter(r => r.ci || r.nombre);
}

// ── Validación ──────────────────────────────────────────────────────────────

function validarFila(row) {
  const errores = [];
  if (!row.ci)                        errores.push('CI requerido');
  if (!row.nombre)                    errores.push('Nombre requerido');
  if (!row.fecha_nacimiento)          errores.push('Fecha de nacimiento requerida');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.fecha_nacimiento))
                                      errores.push('Fecha debe ser YYYY-MM-DD');
  if (!GENEROS_VALIDOS.includes((row.genero || '').toLowerCase()))
                                      errores.push('Género: masculino / femenino / otro');
  return errores;
}

// ── Componente ──────────────────────────────────────────────────────────────

export default function ImportarJugadoresModal({ isOpen, onClose, onImportado }) {
  const [filas, setFilas]               = useState([]);
  const [idClub, setIdClub]             = useState('');
  const [idNacionalidad, setIdNacionalidad] = useState('');
  const [clubes, setClubes]             = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [importing, setImporting]       = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    const token = sessionStorage.getItem('token');
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/club`, { headers: h })
      .then(r => r.json()).then(d => setClubes(Array.isArray(d) ? d : d.data ?? [])).catch(() => {});
    fetch(`${API_BASE}/nacionalidad/`, { headers: h })
      .then(r => r.json()).then(d => {
        const arr = Array.isArray(d) ? d : d.data ?? d.nacionalidades ?? [];
        setNacionalidades(arr);
        const bolivia = arr.find(n => n.pais?.toLowerCase().includes('bolivia'));
        if (bolivia) setIdNacionalidad(String(bolivia.id_nacionalidad));
      }).catch(() => {});
  }, [isOpen]);

  // ── Descargar plantilla Excel ──────────────────────────────────────────

  const descargarPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...TEMPLATE_ROWS]);
    ws['!cols'] = HEADER_WIDTHS.map(w => ({ wch: w }));

    // Estilo encabezado (negrita) — solo disponible con xlsx pro, pero los anchos sí funcionan
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jugadores');
    XLSX.writeFile(wb, 'plantilla_jugadores.xlsx');
  };

  // ── Leer archivo ──────────────────────────────────────────────────────

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = file.name.toLowerCase().endsWith('.csv')
        ? parseCSV(ev.target.result)
        : parseExcel(ev.target.result);
      setFilas(parsed);
    };

    file.name.toLowerCase().endsWith('.csv')
      ? reader.readAsText(file, 'UTF-8')
      : reader.readAsArrayBuffer(file);
  };

  // ── Importar ──────────────────────────────────────────────────────────

  const filasValidas   = filas.filter(f => validarFila(f).length === 0);
  const filasInvalidas = filas.filter(f => validarFila(f).length > 0);
  const puedeImportar  = filasValidas.length > 0 && idClub && idNacionalidad && !importing;

  const importar = async () => {
    setImporting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE}/jugadores/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          jugadores:       filasValidas,
          id_club:         Number(idClub),
          id_nacionalidad: Number(idNacionalidad),
        }),
      });
      const data = await res.json();
      setResultado(data);
      if (data.resumen?.importados > 0) onImportado?.();
    } catch {
      setResultado({ success: false, message: 'Error de conexión al importar' });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFilas([]); setResultado(null); setNombreArchivo('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-green-600" />
              Importar jugadores desde Excel
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Cargá hasta cientos de jugadores de una sola vez</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Paso 1: Plantilla */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <Download size={18} className="text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">Paso 1 — Descargá la plantilla Excel</p>
              <p className="text-xs text-green-700 mt-0.5">
                Completá el archivo con los datos y guardalo. También se acepta CSV.
              </p>
              <p className="text-xs text-green-600 mt-1 font-mono">
                {HEADERS.join('  |  ')}
              </p>
            </div>
            <button
              onClick={descargarPlantilla}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors shrink-0"
            >
              <Download size={13} /> Plantilla .xlsx
            </button>
          </div>

          {/* Paso 2: Configuración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Club de destino *</label>
              <select
                value={idClub}
                onChange={e => setIdClub(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar club...</option>
                {clubes.map(c => (
                  <option key={c.id_club} value={c.id_club}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nacionalidad por defecto *</label>
              <select
                value={idNacionalidad}
                onChange={e => setIdNacionalidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {nacionalidades.map(n => (
                  <option key={n.id_nacionalidad} value={n.id_nacionalidad}>{n.pais}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Paso 3: Archivo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Paso 2 — Seleccioná el archivo *</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); fileRef.current.files = e.dataTransfer.files; handleFile({ target: e.dataTransfer }); }}
            >
              {nombreArchivo ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <FileSpreadsheet size={22} className="text-green-600" />
                  <span className="font-medium text-sm">{nombreArchivo}</span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Arrastrá o hacé click para seleccionar</p>
                  <p className="text-xs text-gray-400 mt-1">Formatos: <strong>.xlsx</strong>, .xls, .csv</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} className="hidden" />
          </div>

          {/* Preview */}
          {filas.length > 0 && !resultado && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  {filas.length} filas detectadas
                </p>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle size={13} /> {filasValidas.length} válidas
                  </span>
                  {filasInvalidas.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                      <XCircle size={13} /> {filasInvalidas.length} con errores
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fila', 'CI', 'Nombre', 'Nacimiento', 'Género', 'Estado'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filas.slice(0, 20).map((f, i) => {
                      const errs = validarFila(f);
                      return (
                        <tr key={i} className={errs.length ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-3 py-1.5 text-gray-400">{f._fila}</td>
                          <td className="px-3 py-1.5 font-mono">{f.ci}</td>
                          <td className="px-3 py-1.5">{f.nombre} {f.apellido_paterno}</td>
                          <td className="px-3 py-1.5">{f.fecha_nacimiento}</td>
                          <td className="px-3 py-1.5">{f.genero}</td>
                          <td className="px-3 py-1.5">
                            {errs.length === 0
                              ? <CheckCircle size={14} className="text-green-500" />
                              : <span className="text-red-600 text-[10px]">{errs.join(' · ')}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filas.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-2 border-t">
                    … y {filas.length - 20} filas más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className={`rounded-xl p-4 border ${resultado.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {resultado.success ? (
                <>
                  <p className="font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {resultado.resumen.importados} jugadores importados correctamente
                    {resultado.resumen.errores > 0 && ` · ${resultado.resumen.errores} con errores`}
                  </p>
                  {resultado.errores?.length > 0 && (
                    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                      <p className="text-xs font-semibold text-red-700">Filas que no se importaron:</p>
                      {resultado.errores.map((e, i) => (
                        <p key={i} className="text-xs text-red-600">
                          • CI {e.ci} ({e.nombre}): {e.error}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} /> {resultado.message}
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Limpiar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={importar}
              disabled={!puedeImportar}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {importing
                ? <><Loader2 size={15} className="animate-spin" /> Importando...</>
                : <><Upload size={15} /> Importar {filasValidas.length > 0 ? `${filasValidas.length} jugadores` : ''}</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
