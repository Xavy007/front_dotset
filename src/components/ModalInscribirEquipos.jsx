import React, { useState, useEffect } from 'react';
import { X, Check, Users, Search } from 'lucide-react';
import { equipoService } from '../services/equipoService';
import { inscripcionService } from '../services/inscripcionService';
import { toast } from 'sonner';

export default function ModalInscribirEquipos({ isOpen, onClose, categoriaInfo, onSave }) {
  const [equipos, setEquipos] = useState([]);
  const [equiposInscritos, setEquiposInscritos] = useState([]);
  const [selectedEquipos, setSelectedEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && categoriaInfo) {
      cargarEquipos();
      cargarEquiposInscritos();
    }
  }, [isOpen, categoriaInfo]);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const id_categoria = categoriaInfo.categoria?.id_categoria;
      const response = await equipoService.getByCategoria(id_categoria);

      if (response.success && response.data) {
        setEquipos(response.data);
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      toast.error('Error al cargar los equipos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEquiposInscritos = async () => {
    try {
      const response = await inscripcionService.getByCC(categoriaInfo.id_cc);

      if (response.success && response.data) {
        const idsInscritos = response.data.map(insc => insc.id_equipo);
        setEquiposInscritos(idsInscritos);
      }
    } catch (error) {
      console.error('Error al cargar equipos inscritos:', error);
      setEquiposInscritos([]);
    }
  };

  const toggleEquipo = (id_equipo) => {
    setSelectedEquipos(prev =>
      prev.includes(id_equipo)
        ? prev.filter(id => id !== id_equipo)
        : [...prev, id_equipo]
    );
  };

  const marcarTodos = () => {
    const idsDisponibles = equiposDisponibles.map(eq => eq.id_equipo);
    setSelectedEquipos(idsDisponibles);
  };

  const desmarcarTodos = () => {
    setSelectedEquipos([]);
  };

  const handleSave = async () => {
    if (selectedEquipos.length === 0) {
      toast.warning('Debes seleccionar al menos un equipo');
      return;
    }

    try {
      setSaving(true);
      await inscripcionService.inscribirMultiples(categoriaInfo.id_cc, selectedEquipos);
      onSave?.();
    } catch (error) {
      console.error('Error al inscribir equipos:', error);
      toast.error('Error al inscribir los equipos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Equipos que NO están inscritos
  const equiposDisponibles = equipos.filter(eq => !equiposInscritos.includes(eq.id_equipo));

  // Filtrar por búsqueda
  const equiposFiltrados = equiposDisponibles.filter(eq =>
    eq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.club?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900 pr-10">
            Inscribir Equipos
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {categoriaInfo.categoria?.nombre} - {categoriaInfo.categoria?.genero}
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={saving}
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Barra de búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar equipo o club..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={marcarTodos}
                  disabled={equiposFiltrados.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  ✓ Marcar todos ({equiposFiltrados.length})
                </button>
                <button
                  onClick={desmarcarTodos}
                  disabled={selectedEquipos.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  ✗ Desmarcar todos
                </button>
              </div>

              {/* Lista de equipos */}
              <div className="space-y-2">
                {equiposFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No hay equipos disponibles</p>
                    <p className="text-sm">
                      {searchTerm
                        ? 'No se encontraron equipos con ese criterio de búsqueda'
                        : 'Todos los equipos ya están inscritos o no hay equipos compatibles con esta categoría'
                      }
                    </p>
                  </div>
                ) : (
                  equiposFiltrados.map((equipo) => {
                    const isSelected = selectedEquipos.includes(equipo.id_equipo);

                    return (
                      <label
                        key={equipo.id_equipo}
                        className={`
                          flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEquipo(equipo.id_equipo)}
                          className="sr-only"
                          disabled={saving}
                        />

                        {/* Checkbox visual */}
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded border-2 mr-3
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-gray-300'
                          }
                        `}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>

                        {/* Información del equipo */}
                        <div className="flex-1">
                          <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {equipo.nombre}
                          </span>
                          <div className="flex gap-3 mt-1">
                            {equipo.club?.nombre && (
                              <span className="text-sm text-gray-500">
                                Club: {equipo.club.nombre}
                              </span>
                            )}
                            {equipo.categoria?.genero && (
                              <span className={`text-sm px-2 py-0.5 rounded ${
                                equipo.categoria.genero === 'masculino' ? 'bg-blue-100 text-blue-700' :
                                equipo.categoria.genero === 'femenino' ? 'bg-pink-100 text-pink-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {equipo.categoria.genero === 'masculino' ? '♂' :
                                 equipo.categoria.genero === 'femenino' ? '♀' : '⚥'}
                                {' '}{equipo.categoria.genero}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 font-medium">
            {selectedEquipos.length} equipo{selectedEquipos.length !== 1 ? 's' : ''} seleccionado{selectedEquipos.length !== 1 ? 's' : ''}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedEquipos.length === 0}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Inscribiendo...</span>
                </>
              ) : (
                `Inscribir (${selectedEquipos.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
