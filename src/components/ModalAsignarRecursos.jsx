// src/components/ModalAsignarRecursos.jsx

import { useState, useEffect } from 'react';
import { fixtureService } from '../services/fixtureService';

export default function ModalAsignarRecursos({ partido, onClose, onGuardar }) {
  const [canchas, setCanchas] = useState([]);
  const [jueces, setJueces] = useState([]);
  const [planilleros, setPlanilleros] = useState([]);
  const [loading, setLoading] = useState(true);

  const [idCancha, setIdCancha] = useState(partido.id_cancha || '');
  const [fechaHora, setFechaHora] = useState('');
  const [observaciones, setObservaciones] = useState(partido.observaciones || '');
  const [juecesSeleccionados, setJuecesSeleccionados] = useState([]);
  const [planilleroSeleccionado, setPlanilleroSeleccionado] = useState('');

  useEffect(() => {
    cargarRecursos();

    // Formatear fecha para el input datetime-local
    if (partido.fecha_hora) {
      const fecha = new Date(partido.fecha_hora);
      const fechaFormateada = fecha.toISOString().slice(0, 16);
      setFechaHora(fechaFormateada);
    }

    // Pre-cargar árbitros ya asignados
    if (partido.asignacionJueces) {
      const juecesAsignados = [];
      if (partido.asignacionJueces.id_arbitro1) juecesAsignados.push(partido.asignacionJueces.id_arbitro1);
      if (partido.asignacionJueces.id_arbitro2) juecesAsignados.push(partido.asignacionJueces.id_arbitro2);
      if (partido.asignacionJueces.id_anotador) juecesAsignados.push(partido.asignacionJueces.id_anotador);
      if (partido.asignacionJueces.id_cronometrista) juecesAsignados.push(partido.asignacionJueces.id_cronometrista);
      setJuecesSeleccionados(juecesAsignados);

      // Pre-cargar planillero ya asignado
      if (partido.asignacionJueces.id_planillero) {
        setPlanilleroSeleccionado(partido.asignacionJueces.id_planillero);
      }
    }
  }, [partido]);

  const cargarRecursos = async () => {
    try {
      console.log('🔍 Frontend: Cargando recursos...');
      const response = await fixtureService.obtenerRecursos();
      console.log('📦 Frontend: Respuesta recibida:', response);

      if (response.success) {
        console.log('✅ Frontend: Canchas:', response.data.canchas);
        console.log('✅ Frontend: Jueces:', response.data.jueces);
        console.log('✅ Frontend: Planilleros:', response.data.planilleros);
        setCanchas(response.data.canchas || []);
        setJueces(response.data.jueces || []);
        setPlanilleros(response.data.planilleros || []);
      } else {
        console.warn('⚠️ Frontend: Respuesta no exitosa');
      }
    } catch (error) {
      console.error('❌ Frontend: Error cargando recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onGuardar({
      id_cancha: idCancha ? parseInt(idCancha) : null,
      fecha_hora: fechaHora ? new Date(fechaHora).toISOString() : null,
      observaciones,
      jueces: juecesSeleccionados,
      id_planillero: planilleroSeleccionado ? parseInt(planilleroSeleccionado) : null
    });
  };

  const toggleJuez = (idJuez) => {
    setJuecesSeleccionados(prev =>
      prev.includes(idJuez)
        ? prev.filter(id => id !== idJuez)
        : [...prev, idJuez]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="bg-white rounded-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col animate-slide-up border border-gray-200">
        {/* Header */}
        <div className="relative px-5 sm:px-6 py-6 sm:py-4 border-b-2 sm:border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl sm:text-xl font-bold text-gray-900 pr-8">
            ⚙️ Asignar Recursos al Partido
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {partido.equipoLocal?.nombre} vs {partido.equipoVisitante?.nombre}
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-3 sm:right-3 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all group"
          >
            <span className="text-gray-600 group-hover:text-gray-900 text-2xl sm:text-xl group-hover:rotate-90 transition-transform">
              ×
            </span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seleccionar Cancha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏟️ Cancha
                </label>
                <select
                  value={idCancha}
                  onChange={(e) => setIdCancha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">Sin asignar</option>
                  {canchas.map((cancha) => (
                    <option key={cancha.id_cancha} value={cancha.id_cancha}>
                      {cancha.nombre} - {cancha.direccion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              {/* Árbitros */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  👨‍⚖️ Árbitros
                </label>
                {jueces.length === 0 ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700 font-medium">
                      ⚠️ No hay árbitros disponibles. Registra árbitros primero.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border-2 border-gray-200 rounded-xl">
                    {jueces.map((juez) => (
                      <label
                        key={juez.id_juez}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          juecesSeleccionados.includes(juez.id_juez)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={juecesSeleccionados.includes(juez.id_juez)}
                          onChange={() => toggleJuez(juez.id_juez)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {juez.persona?.nombre} {juez.persona?.ap} {juez.persona?.am}
                          </p>
                          {juez.juez_categoria && (
                            <p className="text-xs text-gray-500">{juez.juez_categoria} - {juez.grado}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Selecciona los árbitros que estarán en este partido
                </p>
              </div>

              {/* Planillero (Mesa) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Planillero (Mesa)
                </label>
                <select
                  value={planilleroSeleccionado}
                  onChange={(e) => setPlanilleroSeleccionado(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">Sin asignar</option>
                  {planilleros.map((planillero) => (
                    <option key={planillero.id_usuario} value={planillero.id_usuario}>
                      {planillero.persona?.nombre} {planillero.persona?.ap} {planillero.persona?.am}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Usuario del sistema con rol de juez que llevará la planilla de mesa
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  placeholder="Notas adicionales sobre el partido..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
              </div>

              {/* Vista previa */}
              <div className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Vista Previa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partido:</span>
                    <span className="font-semibold text-gray-900">
                      {partido.equipoLocal?.nombre} vs {partido.equipoVisitante?.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancha:</span>
                    <span className="font-semibold text-gray-900">
                      {idCancha
                        ? canchas.find(c => c.id_cancha === parseInt(idCancha))?.nombre
                        : 'Sin asignar'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-semibold text-gray-900">
                      {fechaHora
                        ? new Date(fechaHora).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-5 sm:px-6 py-4 sm:py-3.5 border-t-2 sm:border-t border-gray-100 bg-white">
          <p className="text-sm sm:text-xs text-gray-600 font-medium text-center sm:text-left">
            Asigna los recursos necesarios para el partido
          </p>

          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 sm:px-4 py-3 sm:py-2 text-base sm:text-sm font-semibold text-gray-700 bg-white border-2 sm:border border-gray-300 rounded-xl sm:rounded-lg hover:bg-gray-50 active:bg-gray-100 sm:active:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 sm:px-5 py-3 sm:py-2 text-base sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-lg hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 sm:active:from-blue-700 sm:active:to-blue-800 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md sm:shadow-sm disabled:shadow-none"
            >
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
