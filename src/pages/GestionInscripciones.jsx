import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { campeonatoService } from '../services/campeonatoService';
import { categoriaService } from '../services/categoriaService';
import { inscripcionService } from '../services/inscripcionService';
import { equipoService } from '../services/equipoService';
import ModalInscribirEquipos from '../components/ModalInscribirEquipos';

export default function GestionInscripciones() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModalInscribir, setShowModalInscribir] = useState(false);

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
      cargarInscripciones();
    }
  }, [categoriaSeleccionada]);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      if (response.success && response.data) {
        setCampeonatos(response.data);
      }
    } catch (error) {
      console.error('Error al cargar campeonatos:', error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await categoriaService.getCategoriasByCampeonato(campeonatoSeleccionado.id_campeonato);
      if (response.success && response.data) {
        setCategorias(response.data);
        // Auto-seleccionar la primera categoría si existe
        if (response.data.length > 0) {
          setCategoriaSeleccionada(response.data[0]);
        } else {
          setCategoriaSeleccionada(null);
          setInscripciones([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
      setCategoriaSeleccionada(null);
      setInscripciones([]);
    }
  };

  const cargarInscripciones = async () => {
    try {
      setLoading(true);
      const response = await inscripcionService.getByCC(categoriaSeleccionada.id_cc);
      if (response.success && response.data) {
        setInscripciones(response.data);
      }
    } catch (error) {
      console.error('Error al cargar inscripciones:', error);
      setInscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarInscripcion = async (id_inscripcion) => {
    if (!window.confirm('¿Estás seguro de eliminar esta inscripción?')) return;

    try {
      await inscripcionService.delete(id_inscripcion);
      cargarInscripciones();
    } catch (error) {
      console.error('Error al eliminar inscripción:', error);
      alert('Error al eliminar la inscripción');
    }
  };

  const handleActualizarGrupo = async (inscripcion, nuevoGrupo) => {
    try {
      await inscripcionService.update(inscripcion.id_inscripcion, {
        grupo: nuevoGrupo
      });
      cargarInscripciones();
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      alert('Error al actualizar el grupo');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          Gestión de Inscripciones
        </h1>
        <p className="text-gray-600 mt-2">
          Inscribe equipos a las categorías de tus campeonatos
        </p>
      </div>

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Selector de Campeonato */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Campeonato
          </label>
          <select
            value={campeonatoSeleccionado?.id_campeonato || ''}
            onChange={(e) => {
              const camp = campeonatos.find(c => c.id_campeonato === parseInt(e.target.value));
              setCampeonatoSeleccionado(camp);
              setCategoriaSeleccionada(null);
              setInscripciones([]);
            }}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Selecciona un campeonato</option>
            {campeonatos.map((camp) => (
              <option key={camp.id_campeonato} value={camp.id_campeonato}>
                {camp.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Categoría */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={categoriaSeleccionada?.id_cc || ''}
            onChange={(e) => {
              const cat = categorias.find(c => c.id_cc === parseInt(e.target.value));
              setCategoriaSeleccionada(cat);
            }}
            disabled={!campeonatoSeleccionado || categorias.length === 0}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id_cc} value={cat.id_cc}>
                {cat.categoria?.nombre || 'Sin nombre'} ({cat.categoria?.genero})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información de la categoría seleccionada */}
      {categoriaSeleccionada && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-900 text-lg">
                {categoriaSeleccionada.categoria?.nombre}
              </h3>
              <p className="text-blue-700 text-sm">
                Género: {categoriaSeleccionada.categoria?.genero} |
                Edad: {categoriaSeleccionada.categoria?.edad_inicio}-{categoriaSeleccionada.categoria?.edad_limite} años |
                Formato: {categoriaSeleccionada.formato?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={() => setShowModalInscribir(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Inscribir Equipos
            </button>
          </div>
        </div>
      )}

      {/* Lista de inscripciones */}
      {categoriaSeleccionada && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Equipos Inscritos ({inscripciones.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : inscripciones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay equipos inscritos</p>
              <p className="text-sm">Haz click en "Inscribir Equipos" para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Club
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Grupo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Jugadores
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fecha Inscripción
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inscripciones.map((inscripcion) => (
                    <tr key={inscripcion.id_inscripcion} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {inscripcion.equipo?.nombre || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {inscripcion.equipo?.club?.nombre || 'Sin club'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={inscripcion.grupo || ''}
                          onChange={(e) => handleActualizarGrupo(inscripcion, e.target.value)}
                          placeholder="Sin grupo"
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {inscripcion.cantidad_jugadores || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEliminarInscripcion(inscripcion.id_inscripcion)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar inscripción"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de inscripción */}
      {showModalInscribir && categoriaSeleccionada && (
        <ModalInscribirEquipos
          isOpen={showModalInscribir}
          onClose={() => setShowModalInscribir(false)}
          categoriaInfo={categoriaSeleccionada}
          onSave={() => {
            cargarInscripciones();
            setShowModalInscribir(false);
          }}
        />
      )}
    </div>
  );
}
