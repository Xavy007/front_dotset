// ===============================================
// ARCHIVO: src/components/InscripcionParticipacionModal.jsx
// Componente Modal para inscribir jugadores en campeonatos/categorías
// ===============================================

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export default function InscripcionParticipacionModal({
  isOpen,
  onClose,
  jugador,
  categoriasPermitidas = [],
  todasCategorias = [],
  onSuccess
}) {
  // ===== ESTADO =====
  const [campeonatos, setCampeonatos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCampeonato, setSelectedCampeonato] = useState(null);
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [errors, setErrors] = useState({});

  // ===== CARGAR DATOS =====
  useEffect(() => {
    if (isOpen) {
      fetchCampeonatos();
    }
  }, [isOpen]);

  const fetchCampeonatos = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/campeonatos');
      if (!res.ok) throw new Error('Error cargando campeonatos');
      const data = await res.json();
      
      const arr = Array.isArray(data) ? data : (data?.campeonatos || data?.data || []);
      setCampeonatos(arr);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: 'Error cargando campeonatos' });
    }
  };

  const fetchEquipos = async (id_categoria, id_campeonato) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/equipos?id_categoria=${id_categoria}&id_campeonato=${id_campeonato}`
      );
      if (!res.ok) throw new Error('Error cargando equipos');
      const data = await res.json();
      
      const arr = Array.isArray(data) ? data : (data?.equipos || data?.data || []);
      setEquipos(arr);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ===== MANEJADORES =====

  const handleCampeonatoChange = (id) => {
    setSelectedCampeonato(id);
    setSelectedCategorias([]);
    setInscripciones([]);
  };

  const toggleCategoria = (id_categoria) => {
    setSelectedCategorias(prev => {
      if (prev.includes(id_categoria)) {
        // Remover categoría
        const nuevas = prev.filter(c => c !== id_categoria);
        // Remover inscripciones de esta categoría
        setInscripciones(inscripciones.filter(i => i.id_categoria !== id_categoria));
        return nuevas;
      } else {
        // Agregar categoría
        return [...prev, id_categoria];
      }
    });
  };

  const agregarInscripcion = (id_categoria) => {
    const categoria = categoriasPermitidas.find(c => c.id_categoria === id_categoria);
    
    // Validar que no haya duplicada
    if (inscripciones.find(i => i.id_categoria === id_categoria)) {
      setErrors(prev => ({
        ...prev,
        [id_categoria]: 'Ya hay una inscripción para esta categoría'
      }));
      return;
    }

    // Obtener valores del formulario
    const id_equipo = document.getElementById(`equipo_${id_categoria}`)?.value;
    const dorsal = document.getElementById(`dorsal_${id_categoria}`)?.value;

    // Validar equipo
    if (!id_equipo) {
      setErrors(prev => ({ ...prev, [id_categoria]: 'Selecciona un equipo' }));
      return;
    }

    // Validar dorsal
    if (!dorsal) {
      setErrors(prev => ({ ...prev, [id_categoria]: 'Ingresa el dorsal' }));
      return;
    }

    if (dorsal < 1 || dorsal > 99) {
      setErrors(prev => ({ ...prev, [id_categoria]: 'Dorsal debe estar entre 1 y 99' }));
      return;
    }

    // Obtener datos del equipo
    const equipo = equipos.find(e => e.id_equipo === parseInt(id_equipo));
    const posicion = document.getElementById(`posicion_${id_categoria}`)?.value || null;

    // Crear inscripción
    const nuevaInscripcion = {
      id_categoria,
      id_equipo: parseInt(id_equipo),
      dorsal: parseInt(dorsal),
      posicion,
      categoria_nombre: categoria?.nombre,
      equipo_nombre: equipo?.nombre
    };

    setInscripciones([...inscripciones, nuevaInscripcion]);
    setErrors(prev => ({ ...prev, [id_categoria]: null }));
  };

  const removerInscripcion = (id_categoria) => {
    setInscripciones(inscripciones.filter(i => i.id_categoria !== id_categoria));
  };

  const handleGuardar = async () => {
    if (inscripciones.length === 0) {
      setErrors({ general: 'Debes agregar al menos una inscripción' });
      return;
    }

    setLoading(true);
    try {
      const promesas = inscripciones.map(inscripcion =>
        fetch('http://localhost:8080/api/participaciones/inscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_jugador: jugador.id_jugador,
            id_campeonato: selectedCampeonato,
            id_categoria: inscripcion.id_categoria,
            id_equipo: inscripcion.id_equipo,
            dorsal: inscripcion.dorsal,
            posicion: inscripcion.posicion
          })
        }).then(res => {
          if (!res.ok) throw new Error('Error guardando inscripción');
          return res.json();
        })
      );

      const resultados = await Promise.all(promesas);
      
      alert(`✅ ${resultados.length} inscripción(es) creada(s) exitosamente`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: error.message || 'Error al guardar las inscripciones' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCampeonato(null);
    setSelectedCategorias([]);
    setInscripciones([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b">
          <div>
            <h2 className="text-2xl font-bold">
              Inscribir: {jugador?.nombre} {jugador?.ap}
            </h2>
            <p className="text-blue-100 text-sm">
              Puedes seleccionar hasta {categoriasPermitidas.length} categoría(s)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-white/20 p-2 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-6">
          {/* Error General */}
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle size={20} />
              {errors.general}
            </div>
          )}

          {/* INFORMACIÓN DE CATEGORÍAS PERMITIDAS */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">📋 Categorías Permitidas</h3>
            <div className="flex flex-wrap gap-2">
              {categoriasPermitidas.map(cat => (
                <span key={cat.id_categoria} className="bg-blue-200 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                  {cat.nombre}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ℹ️ Solo puedes inscribir en estas categorías según tu edad
            </p>
          </div>

          {/* 1. SELECCIONAR CAMPEONATO */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              1️⃣ Selecciona Campeonato
            </label>
            <select
              value={selectedCampeonato || ''}
              onChange={(e) => handleCampeonatoChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Selecciona campeonato --</option>
              {campeonatos.map(c => (
                <option key={c.id_campeonato} value={c.id_campeonato}>
                  {c.nombre} ({c.gestion || 'Sin año'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. SELECCIONAR CATEGORÍAS */}
          {selectedCampeonato && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                2️⃣ Selecciona Categoría(s)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categoriasPermitidas.map(cat => (
                  <button
                    key={cat.id_categoria}
                    onClick={() => toggleCategoria(cat.id_categoria)}
                    className={`p-3 border-2 rounded transition ${
                      selectedCategorias.includes(cat.id_categoria)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-400'
                    }`}
                  >
                    <div className="text-sm font-bold">{cat.nombre}</div>
                    <div className="text-xs text-gray-600">
                      {cat.edad_inicio}-{cat.edad_limite} años
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. CONFIGURAR INSCRIPCIONES */}
          {selectedCategorias.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-gray-700 mb-3">
                3️⃣ Configura inscripción por categoría
              </h3>

              {selectedCategorias.map(id_categoria => {
                const categoria = categoriasPermitidas.find(c => c.id_categoria === id_categoria);
                const inscrito = inscripciones.find(i => i.id_categoria === id_categoria);
                const error = errors[id_categoria];

                return (
                  <div key={id_categoria} className="bg-white p-4 rounded border border-gray-200">
                    {/* HEADER DE CATEGORÍA */}
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-800">{categoria?.nombre}</h4>
                      {inscrito && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600 font-bold">✅ Agregada</span>
                          <button
                            onClick={() => removerInscripcion(id_categoria)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {!inscrito ? (
                      <div className="space-y-3">
                        {/* Equipo */}
                        <div>
                          <label className="text-xs font-bold text-gray-700">Equipo</label>
                          <select
                            id={`equipo_${id_categoria}`}
                            onChange={() => fetchEquipos(id_categoria, selectedCampeonato)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">-- Selecciona equipo --</option>
                            {equipos
                              .filter(e => e.id_categoria === id_categoria)
                              .map(e => (
                                <option key={e.id_equipo} value={e.id_equipo}>
                                  {e.nombre}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Dorsal */}
                        <div>
                          <label className="text-xs font-bold text-gray-700">Dorsal (1-99)</label>
                          <input
                            id={`dorsal_${id_categoria}`}
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Número de dorsal"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Posición */}
                        <div>
                          <label className="text-xs font-bold text-gray-700">Posición</label>
                          <select
                            id={`posicion_${id_categoria}`}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">-- Opcional --</option>
                            <option value="Armador">Armador</option>
                            <option value="Opuesto">Opuesto</option>
                            <option value="Central">Central</option>
                            <option value="Libero">Líbero</option>
                            <option value="Punta">Punta</option>
                            <option value="Entrenador">Entrenador</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        {/* Error específico */}
                        {error && <div className="text-xs text-red-600">{error}</div>}

                        {/* Botón Agregar */}
                        <button
                          onClick={() => agregarInscripcion(id_categoria)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition"
                        >
                          <Plus size={16} />
                          Agregar inscripción
                        </button>
                      </div>
                    ) : (
                      // Mostrar resumen si ya está inscrito
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <strong>Equipo:</strong> {inscrito.equipo_nombre}
                        </p>
                        <p>
                          <strong>Dorsal:</strong> {inscrito.dorsal}
                        </p>
                        <p>
                          <strong>Posición:</strong> {inscrito.posicion || 'No especificada'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* RESUMEN DE INSCRIPCIONES */}
          {inscripciones.length > 0 && (
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <h4 className="font-bold text-green-800 mb-2">
                📋 Resumen: {inscripciones.length} inscripción(es)
              </h4>
              {inscripciones.map((insc, idx) => (
                <div key={idx} className="text-sm text-green-700 ml-2">
                  ✓ {insc.categoria_nombre} - {insc.equipo_nombre} (Dorsal {insc.dorsal})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 flex gap-3 p-6 bg-gray-100 border-t">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading || inscripciones.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition"
          >
            <Check size={18} />
            {loading ? 'Guardando...' : 'Guardar Inscripciones'}
          </button>
        </div>
      </div>
    </div>
  );
}