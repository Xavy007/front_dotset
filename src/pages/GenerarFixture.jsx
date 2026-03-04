// src/pages/GenerarFixture.jsx

import { useState, useEffect } from 'react';
import { campeonatoService } from '../services/campeonatoService';
import { categoriaService } from '../services/categoriaService';
import { fixtureService } from '../services/fixtureService';

// URL del servidor para archivos estáticos (logos, imágenes)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

export default function GenerarFixture() {
  // Estados para selección de campeonato
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Estados para configuración del fixture
  const [paso, setPaso] = useState(1); // 1: Selección, 2: Configuración, 3: Preview, 4: Asignación
  const [tipoFixture, setTipoFixture] = useState('todos_contra_todos');
  const [idaVuelta, setIdaVuelta] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [diasEntreJornadas, setDiasEntreJornadas] = useState(7);
  const [horaInicio, setHoraInicio] = useState('18:00');

  // Estados para fixture generado
  const [fixtureGenerado, setFixtureGenerado] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para recursos (canchas, árbitros)
  const [canchas, setCanchas] = useState([]);
  const [jueces, setJueces] = useState([]);

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      if (response.success) {
        // Filtrar solo campeonatos en curso o programados
        const activos = response.data.filter(
          c => c.c_estado === 'en_curso' || c.c_estado === 'programado'
        );
        setCampeonatos(activos);
      }
    } catch (error) {
      console.error('Error cargando campeonatos:', error);
    }
  };

  const handleSeleccionarCampeonato = async (id_campeonato) => {
    setCampeonatoSeleccionado(id_campeonato);

    // Cargar categorías del campeonato
    try {
      const response = await categoriaService.getCategoriasByCampeonato(id_campeonato);
      if (response.success) {
        setCategoriasDisponibles(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleSeleccionarCategoria = async (id_cc) => {
    setCategoriaSeleccionada(id_cc);

    // Cargar configuración de la categoría desde el backend
    try {
      const categoriaData = categoriasDisponibles.find(cat => cat.id_cc === id_cc);

      if (categoriaData) {
        // Cargar configuración guardada
        setTipoFixture(categoriaData.formato || 'todos_contra_todos');
        setIdaVuelta(categoriaData.ida_vuelta !== undefined ? categoriaData.ida_vuelta : false);
        setDiasEntreJornadas(categoriaData.dias_entre_jornadas || 7);
        setHoraInicio(categoriaData.hora_inicio_partidos ? categoriaData.hora_inicio_partidos.substring(0, 5) : '18:00');

        // Obtener fecha de inicio del campeonato
        if (campeonatoActual?.fecha_inicio) {
          setFechaInicio(campeonatoActual.fecha_inicio.split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de categoría:', error);
    }
  };

  const handleGenerarFixture = async () => {
    if (!campeonatoSeleccionado || !categoriaSeleccionada) {
      setError('Debes seleccionar un campeonato y una categoría');
      return;
    }

    if (!fechaInicio) {
      setError('Debes seleccionar una fecha de inicio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = {
        id_campeonato: campeonatoSeleccionado,
        id_cc: categoriaSeleccionada,
        tipo_fixture: tipoFixture,
        ida_vuelta: idaVuelta,
        fecha_inicio: fechaInicio,
        dias_entre_jornadas: parseInt(diasEntreJornadas),
        hora_inicio: horaInicio
      };

      const response = await fixtureService.generarFixture(config);

      if (response.success) {
        setFixtureGenerado(response.data.partidos);
        setEstadisticas(response.data.estadisticas);
        setPaso(2); // Ir a preview (ahora es paso 2, no 3)
      }
    } catch (error) {
      setError(error.message || 'Error al generar fixture');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarFixture = async () => {
    setLoading(true);

    try {
      const response = await fixtureService.guardarFixture({
        id_campeonato: campeonatoSeleccionado,
        id_cc: categoriaSeleccionada,
        partidos: fixtureGenerado
      });

      if (response.success) {
        alert(`✅ ${response.data.partidos_creados} partidos guardados exitosamente`);
        setPaso(3); // Ir a asignación de recursos (ahora es paso 3, no 4)
        cargarRecursos();
      }
    } catch (error) {
      setError(error.message || 'Error al guardar fixture');
    } finally {
      setLoading(false);
    }
  };

  const cargarRecursos = async () => {
    try {
      const response = await fixtureService.obtenerRecursos();
      if (response.success) {
        setCanchas(response.data.canchas || []);
        setJueces(response.data.jueces || []);
      }
    } catch (error) {
      console.error('Error cargando recursos:', error);
    }
  };

  const campeonatoActual = campeonatos.find(c => c.id_campeonato === campeonatoSeleccionado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗓️ Generar Fixture
          </h1>
          <p className="text-gray-600">
            Crea automáticamente el calendario de partidos para tu campeonato
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8 px-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[
              { num: 1, label: 'Seleccionar Categoría' },
              { num: 2, label: 'Preview Fixture' },
              { num: 3, label: 'Asignar Recursos' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      paso >= step.num
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {paso > step.num ? '✓' : step.num}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      paso > step.num ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 mx-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* PASO 1: Selección de Campeonato y Categoría */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mx-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Paso 1: Selecciona Campeonato y Categoría
            </h2>

            <div className="space-y-6">
              {/* Seleccionar Campeonato */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Campeonato
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campeonatos.map((campeonato) => (
                    <button
                      key={campeonato.id_campeonato}
                      onClick={() => handleSeleccionarCampeonato(campeonato.id_campeonato)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        campeonatoSeleccionado === campeonato.id_campeonato
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow'
                      }`}
                    >
                      <h3 className="font-bold text-gray-900">
                        {campeonato.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {campeonato.tipo} • {campeonato.c_estado}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleccionar Categoría */}
              {campeonatoSeleccionado && categoriasDisponibles.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Categoría
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoriasDisponibles.map((cat) => (
                      <button
                        key={cat.id_cc}
                        onClick={() => handleSeleccionarCategoria(cat.id_cc)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          categoriaSeleccionada === cat.id_cc
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow'
                        }`}
                      >
                        <h3 className="font-bold text-gray-900">
                          {cat.categoria?.nombre || cat.Categoria?.nombre || 'Sin nombre'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {cat.formato === 'todos_vs_todos' ? 'Todos vs Todos' : cat.formato}
                          {cat.ida_vuelta && ' • Ida y Vuelta'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mostrar configuración cargada */}
              {categoriaSeleccionada && (
                <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-4">⚙️ Configuración del Fixture</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <p className="font-semibold text-gray-900">
                        {tipoFixture === 'todos_contra_todos' || tipoFixture === 'todos_vs_todos' ? 'Todos vs Todos' : tipoFixture}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Modalidad:</span>
                      <p className="font-semibold text-gray-900">{idaVuelta ? 'Ida y Vuelta' : 'Solo Ida'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Días entre jornadas:</span>
                      <p className="font-semibold text-gray-900">{diasEntreJornadas} días</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Hora inicio:</span>
                      <p className="font-semibold text-gray-900">{horaInicio}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Esta configuración se tomó de la categoría. Puedes modificarla en "Configurar Formato".
                  </p>
                </div>
              )}
            </div>

            {/* Botón generar fixture directo */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  setCampeonatoSeleccionado(null);
                  setCategoriaSeleccionada(null);
                  setCategoriasDisponibles([]);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                ← Reiniciar
              </button>
              <button
                onClick={handleGenerarFixture}
                disabled={!campeonatoSeleccionado || !categoriaSeleccionada || loading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Generando...' : '🎯 Generar Fixture'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Preview del Fixture */}
        {paso === 2 && fixtureGenerado && (
          <div className="space-y-6 mx-6">
            {/* Estadísticas */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">📊 Resumen del Fixture</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-blue-100 text-sm">Total de Partidos</p>
                  <p className="text-4xl font-bold">{estadisticas?.total_partidos || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Jornadas</p>
                  <p className="text-4xl font-bold">{estadisticas?.total_jornadas || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Equipos</p>
                  <p className="text-4xl font-bold">{estadisticas?.equipos_participantes || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Tipo</p>
                  <p className="text-xl font-bold mt-2">
                    {idaVuelta ? 'Ida y Vuelta' : 'Solo Ida'}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Partidos */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📋 Partidos Generados
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {fixtureGenerado.slice(0, 20).map((partido, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>

                      {/* Equipo Local */}
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
                            <span className="text-xs">🏐</span>
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">
                          {partido.equipoLocal?.nombre || `Equipo ${partido.equipo_local}`}
                        </span>
                      </div>

                      <span className="text-gray-400 font-bold">vs</span>

                      {/* Equipo Visitante */}
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
                            <span className="text-xs">🏐</span>
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">
                          {partido.equipoVisitante?.nombre || `Equipo ${partido.equipo_visitante}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(partido.fecha_hora).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Jornada {partido.numero_jornada}
                      </p>
                    </div>
                  </div>
                ))}
                {fixtureGenerado.length > 20 && (
                  <p className="text-center text-gray-500 text-sm py-4">
                    ... y {fixtureGenerado.length - 20} partidos más
                  </p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setPaso(2);
                  setFixtureGenerado(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                ← Regenerar
              </button>
              <button
                onClick={handleGuardarFixture}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Guardando...' : '💾 Guardar Fixture'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Asignación de Recursos */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mx-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Fixture Guardado Exitosamente
            </h2>
            <p className="text-gray-600 mb-6">
              Ahora puedes asignar canchas y árbitros a cada partido en la sección de gestión de partidos.
            </p>
            <button
              onClick={() => window.location.href = '/partidos'}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
            >
              Ir a Gestión de Partidos →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
