import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { categoriaService } from '../services/categoriaService';

export default function ModalCategoriaCampeonato({ isOpen, onClose, campeonato, onSave }) {
  const [categorias, setCategorias] = useState([]);
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroGenero, setFiltroGenero] = useState('todos'); // 'todos', 'masculino', 'femenino', 'mixto'

  // Obtener ID del campeonato (soporta tanto 'id' como 'id_campeonato')
  const campeonatoId = campeonato?.id || campeonato?.id_campeonato;

  // Filtrar categorías por género
  const categoriasFiltradas = categorias.filter(cat => {
    if (filtroGenero === 'todos') return true;
    return cat.genero === filtroGenero;
  });

  useEffect(() => {
    if (isOpen && campeonatoId) {
      cargarCategorias();
      cargarCategoriasAsignadas();
    }
  }, [isOpen, campeonatoId]);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const response = await categoriaService.getAll();

      if (response.success && response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      alert('Error al cargar las categorías: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategoriasAsignadas = async () => {
    try {
      const response = await categoriaService.getCategoriasByCampeonato(campeonatoId);

      if (response.success && response.data) {
        // Extraer los IDs de las categorías ya asignadas
        const idsAsignados = response.data.map(cc => cc.id_categoria);
        setSelectedCategorias(idsAsignados);
      }
    } catch (error) {
      console.error('Error al cargar categorías asignadas:', error);
      // No mostramos alert aquí porque puede ser un campeonato nuevo sin categorías
      setSelectedCategorias([]);
    }
  };

  const toggleCategoria = (id_categoria) => {
    setSelectedCategorias(prev =>
      prev.includes(id_categoria)
        ? prev.filter(id => id !== id_categoria)
        : [...prev, id_categoria]
    );
  };

  // Marcar todas las categorías filtradas
  const marcarTodas = () => {
    const idsFiltradas = categoriasFiltradas.map(cat => cat.id_categoria);
    setSelectedCategorias(prev => {
      const nuevasSelecciones = [...prev];
      idsFiltradas.forEach(id => {
        if (!nuevasSelecciones.includes(id)) {
          nuevasSelecciones.push(id);
        }
      });
      return nuevasSelecciones;
    });
  };

  // Desmarcar todas las categorías filtradas
  const desmarcarTodas = () => {
    const idsFiltradas = categoriasFiltradas.map(cat => cat.id_categoria);
    setSelectedCategorias(prev => prev.filter(id => !idsFiltradas.includes(id)));
  };

  // Verificar si todas las filtradas están seleccionadas
  const todasFiltradasSeleccionadas = categoriasFiltradas.length > 0 &&
    categoriasFiltradas.every(cat => selectedCategorias.includes(cat.id_categoria));

  const handleSave = async () => {
    if (selectedCategorias.length === 0) {
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    try {
      setSaving(true);

      // Obtener categorías actuales del campeonato
      const responseActuales = await categoriaService.getCategoriasByCampeonato(campeonatoId);
      const categoriasActuales = responseActuales.success && responseActuales.data
        ? responseActuales.data
        : [];

      const idsActuales = categoriasActuales.map(cc => cc.id_categoria);

      // Categorías a agregar (están seleccionadas pero no estaban antes)
      const categoriasAAgregar = selectedCategorias.filter(id => !idsActuales.includes(id));

      // Categorías a eliminar (estaban antes pero ya no están seleccionadas)
      const categoriasAEliminar = categoriasActuales.filter(cc =>
        !selectedCategorias.includes(cc.id_categoria)
      );

      // Eliminar categorías desmarcadas
      for (const cc of categoriasAEliminar) {
        await categoriaService.removeCategoriaFromCampeonato(cc.id_cc);
      }

      // Agregar nuevas categorías
      if (categoriasAAgregar.length > 0) {
        await categoriaService.assignMultipleCategories(
          campeonatoId,
          categoriasAAgregar
        );
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar categorías:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="bg-white rounded-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl md:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-slide-up border border-gray-200">
        {/* Header */}
        <div className="relative px-5 sm:px-6 py-6 sm:py-4 border-b-2 sm:border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-2xl sm:text-xl font-bold text-gray-900 pr-10">
            Configurar Categorías
          </h2>
          <p className="text-gray-600 text-base sm:text-sm mt-2 sm:mt-1 font-medium">
            {campeonato?.nombre}
          </p>

          <button
            onClick={onClose}
            className="absolute top-5 sm:top-4 right-5 sm:right-4 p-2 hover:bg-gray-200 sm:hover:bg-gray-100 rounded-full transition-all duration-200 group active:bg-gray-300 sm:active:bg-gray-100"
            disabled={saving}
          >
            <X size={28} className="sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900 sm:group-hover:text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 sm:px-6 py-8 sm:py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-4">
                Selecciona las categorías que participarán en este campeonato:
              </p>

              {/* Filtros y acciones */}
              <div className="mb-4 space-y-3">
                {/* Filtro por género */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFiltroGenero('todos')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filtroGenero === 'todos'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroGenero('masculino')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filtroGenero === 'masculino'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    onClick={() => setFiltroGenero('femenino')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filtroGenero === 'femenino'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Femenino
                  </button>
                  <button
                    onClick={() => setFiltroGenero('mixto')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filtroGenero === 'mixto'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mixto
                  </button>
                </div>

                {/* Marcar/Desmarcar todas */}
                <div className="flex gap-2">
                  <button
                    onClick={marcarTodas}
                    disabled={todasFiltradasSeleccionadas}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    ✓ Marcar todas ({categoriasFiltradas.length})
                  </button>
                  <button
                    onClick={desmarcarTodas}
                    disabled={categoriasFiltradas.every(cat => !selectedCategorias.includes(cat.id_categoria))}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    ✗ Desmarcar todas
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {categoriasFiltradas.map((categoria) => {
                  const isSelected = selectedCategorias.includes(categoria.id_categoria);

                  return (
                    <label
                      key={categoria.id_categoria}
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
                        onChange={() => toggleCategoria(categoria.id_categoria)}
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

                      {/* Nombre de la categoría */}
                      <div className="flex-1">
                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {categoria.nombre}
                        </span>
                        {categoria.descripcion && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {categoria.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 ml-2">
                        {/* Badge de género */}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          categoria.genero === 'masculino' ? 'bg-blue-100 text-blue-700' :
                          categoria.genero === 'femenino' ? 'bg-pink-100 text-pink-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {categoria.genero === 'masculino' ? '♂ Masculino' :
                           categoria.genero === 'femenino' ? '♀ Femenino' :
                           '⚥ Mixto'}
                        </span>

                        {/* Badge de edad si existe */}
                        {(categoria.edad_inicio || categoria.edad_min) && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {categoria.edad_inicio || categoria.edad_min}-{categoria.edad_limite || categoria.edad_max || '+'} años
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {categoriasFiltradas.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-8">
                  {categorias.length === 0
                    ? 'No hay categorías disponibles'
                    : `No hay categorías ${filtroGenero !== 'todos' ? `de género ${filtroGenero}` : ''}`
                  }
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-5 sm:px-6 py-4 sm:py-3.5 border-t-2 sm:border-t border-gray-100 bg-white">
          <p className="text-sm sm:text-xs text-gray-600 font-medium text-center sm:text-left">
            {selectedCategorias.length} categoría{selectedCategorias.length !== 1 ? 's' : ''} seleccionada{selectedCategorias.length !== 1 ? 's' : ''}
          </p>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 sm:px-4 py-3 sm:py-2 text-base sm:text-sm font-semibold text-gray-700 bg-white border-2 sm:border border-gray-300 rounded-xl sm:rounded-lg hover:bg-gray-50 active:bg-gray-100 sm:active:bg-gray-50 transition-all duration-200"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedCategorias.length === 0}
              className="flex-1 sm:flex-none px-6 sm:px-5 py-3 sm:py-2 text-base sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-lg hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 sm:active:from-blue-700 sm:active:to-blue-800 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md sm:shadow-sm disabled:shadow-none"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                `Guardar (${selectedCategorias.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
