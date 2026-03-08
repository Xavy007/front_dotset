// ===============================================
// ARCHIVO: src/pages/CategoriasPage.jsx
// GESTIÓN DE CATEGORÍAS - CRUD COMPLETO CON COLOR
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, AlertCircle, Pencil, Power, Trash2
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  
  // NUEVOS ESTADOS PARA MÚLTIPLES GÉNEROS
  const [generosSeleccionados, setGenerosSeleccionados] = useState([]);
  const [creatingMultiple, setCreatingMultiple] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  const API_URL = 'http://localhost:8080/api/categoria';

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // CARGAR CATEGORÍAS DESDE API
  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setCategorias(arr.map(normalizarCategoria));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NORMALIZAR DATOS
  const normalizarCategoria = (c) => {
    const estadoBooleano = c.estado === true || c.estado === 1;
    return {
      ...c,
      id_categoria: c.id_categoria ?? c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? '',
      edad_inicio: c.edad_inicio ?? 0,
      edad_limite: c.edad_limite ?? null,
      genero: c.genero ?? 'mixto',
      color: c.color || '#3B82F6',
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activa' : 'inactiva',
      freg: c.freg ? new Date(c.freg).toLocaleDateString() : '—',
    };
  };

  // TOGGLE DE GÉNEROS (solo para crear)
  const handleGeneroChange = (genero) => {
    if (editingCategoria) return; // No permitir en edición
    
    setGenerosSeleccionados(prev => 
      prev.includes(genero) 
        ? prev.filter(g => g !== genero)
        : [...prev, genero]
    );
  };

  // CREAR O ACTUALIZAR
// CREAR O ACTUALIZAR
const handleSubmit = async (formData) => {
  // Si está EDITANDO: comportamiento normal (1 categoría)
  if (editingCategoria) {
    try {
      const body = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || '',
        edad_inicio: Number(formData.edad_inicio),
        edad_limite: formData.edad_limite ? Number(formData.edad_limite) : null,
        genero: formData.genero.toLowerCase(),
        color: selectedColor,
        estado: true
      };

      const res = await fetch(`${API_URL}/${editingCategoria.id_categoria}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al actualizar la categoría');
      }

      await fetchCategorias();
      setIsModalOpen(false);
      setEditingCategoria(null);
      setSelectedColor('#3B82F6');
      alert('Categoría actualizada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    return;
  }

  // Si está CREANDO: verificar géneros seleccionados
  if (generosSeleccionados.length === 0) {
    alert('⚠️ Debes seleccionar al menos un género');
    return;
  }

  setCreatingMultiple(true);
  setProgreso({ actual: 0, total: generosSeleccionados.length });

  const resultados = [];
  const errores = [];

  // CREAR UNA CATEGORÍA POR CADA GÉNERO SELECCIONADO
  for (let i = 0; i < generosSeleccionados.length; i++) {
    const genero = generosSeleccionados[i];
    
    // 🔥 CONCATENAR NOMBRE + GÉNERO
    const nombreCompleto = `${formData.nombre} ${genero.charAt(0).toUpperCase() + genero.slice(1)}`;
    
    try {
      const body = {
        nombre: nombreCompleto, // ⬅️ NOMBRE CONCATENADO
        descripcion: formData.descripcion || '',
        edad_inicio: Number(formData.edad_inicio),
        edad_limite: formData.edad_limite ? Number(formData.edad_limite) : null,
        genero: genero.toLowerCase(),
        color: selectedColor,
        estado: true
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar');
      }

      resultados.push(nombreCompleto);
      setProgreso({ actual: i + 1, total: generosSeleccionados.length });
      
    } catch (err) {
      console.error(`Error al crear categoría ${genero}:`, err);
      errores.push({ genero, error: err.message });
      setProgreso({ actual: i + 1, total: generosSeleccionados.length });
    }
  }

  setCreatingMultiple(false);
  setProgreso({ actual: 0, total: 0 });

  // Recargar lista
  await fetchCategorias();

  // Cerrar modal y limpiar
  setIsModalOpen(false);
  setEditingCategoria(null);
  setSelectedColor('#3B82F6');
  setGenerosSeleccionados([]);

  // Mostrar resultado
  if (errores.length === 0) {
    alert(`✅ ${resultados.length} categoría(s) creadas correctamente:\n\n${resultados.map(r => `• ${r}`).join('\n')}`);
  } else {
    alert(`⚠️ Creadas: ${resultados.length}\n❌ Errores: ${errores.length}\n\n${errores.map(e => `${e.genero}: ${e.error}`).join('\n')}`);
  }
};


  // ELIMINAR CATEGORÍA
  const handleDelete = async (id_categoria) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar esta categoría?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_categoria}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar la categoría');
      setCategorias(prev => prev.filter(c => c.id_categoria !== id_categoria));
      alert('Categoría eliminada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // CAMBIAR ESTADO (ACTIVA/INACTIVA)
  const toggleEstado = async (cat) => {
    const nuevoEstado = !cat.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta categoría?`)) return;

    try {
      const res = await fetch(`${API_URL}/${cat.id_categoria}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) throw new Error('Error al cambiar el estado');

      setCategorias(prev =>
        prev.map(c =>
          c.id_categoria === cat.id_categoria
            ? { ...c, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activa' : 'inactiva' }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // FILTRO DE BÚSQUEDA
  const filteredCategorias = categorias.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.descripcion.toLowerCase().includes(term) ||
      c.genero.toLowerCase().includes(term)
    );
  });

  // COLUMNAS DE LA TABLA
  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre', 
      render: (v) => <div className="font-bold text-gray-900">{v}</div> 
    },
    { 
      key: 'color', 
      label: 'Color', 
      render: (v) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow" 
            style={{ backgroundColor: v || '#3B82F6' }}
            title={v || '#3B82F6'}
          />
          <span className="text-xs font-mono font-semibold text-gray-700">{v || '#3B82F6'}</span>
        </div>
      )
    },
    { 
      key: 'edad_inicio', 
      label: 'Edad Inicio', 
      render: (v) => <span className="text-gray-700">{v} años</span>
    },
    { 
      key: 'edad_limite', 
      label: 'Edad Límite', 
      render: (v) => <span className="text-gray-700">{v ? `${v} años` : '—'}</span>
    },
    {
      key: 'genero',
      label: 'Género',
      render: (v) => (
        <div className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
          v === 'masculino'
            ? 'bg-blue-100 text-blue-700'
            : v === 'femenino'
            ? 'bg-pink-100 text-pink-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </div>
      )
    },
    {
      key: 'estadoVista',
      label: 'Estado',
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${row.estadoBooleano ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-semibold ${row.estadoBooleano ? 'text-green-700' : 'text-red-700'}`}>
            {row.estadoVista.charAt(0).toUpperCase() + row.estadoVista.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_v, row) => (
        <div className="flex gap-2">
          <button
            title="Editar"
            onClick={() => { 
              setEditingCategoria(row); 
              setSelectedColor(row.color || '#3B82F6');
              setIsModalOpen(true); 
            }}
            className="p-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            <Pencil size={18} className="text-blue-600" />
          </button>
          <button
            title={row.estadoBooleano ? 'Desactivar' : 'Activar'}
            onClick={() => toggleEstado(row)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all"
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </button>
          <button
            title="Eliminar"
            onClick={() => handleDelete(row.id_categoria)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all"
          >
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      )
    }
  ];

  // PALETA DE COLORES PREDEFINIDOS
  const colorPresets = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Morado', value: '#8B5CF6' },
    { name: 'Naranja', value: '#F59E0B' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Amarillo', value: '#EAB308' },
  ];

  // CAMPOS DEL FORMULARIO
  const formFields = [
    { 
      name: 'nombre', 
      label: 'Nombre', 
      type: 'text', 
      required: true,
      cols: 2
    },
    { 
      name: 'descripcion', 
      label: 'Descripción', 
      type: 'textarea', 
      required: false,
      cols: 3,
      rows: 3
    },
    { 
      name: 'edad_inicio', 
      label: 'Edad Mínima', 
      type: 'number', 
      required: true, 
      min: 4,
      cols: 1
    },
    { 
      name: 'edad_limite', 
      label: 'Edad Máxima', 
      type: 'number', 
      required: false, 
      min: 5,
      cols: 1
    },
    
    // ============================================
    // GÉNERO: CHECKBOXES (crear) o SELECT (editar)
    // ============================================
    ...(editingCategoria 
      ? [
          // SI ESTÁ EDITANDO: Select normal
          {
            name: 'genero',
            label: 'Género',
            type: 'select',
            required: true,
            cols: 1,
            options: [
              { label: '👨 Masculino', value: 'masculino' },
              { label: '👩 Femenino', value: 'femenino' },
              { label: '👥 Mixto', value: 'mixto' }
            ]
          }
        ]
      : [
          // SI ESTÁ CREANDO: Checkboxes custom
          {
            name: 'generos_custom',
            label: '',
            type: 'custom',
            cols: 3,
            renderCustom: () => (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Género(s) *
                </label>
                
                <div className="space-y-2">
                  {/* Checkbox Masculino */}
                  <label 
                    className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-blue-50 transition-all"
                    style={{ 
                      borderColor: generosSeleccionados.includes('masculino') ? '#3B82F6' : '#E5E7EB',
                      backgroundColor: generosSeleccionados.includes('masculino') ? '#EFF6FF' : 'white'
                    }}>
                    <input
                      type="checkbox"
                      checked={generosSeleccionados.includes('masculino')}
                      onChange={() => handleGeneroChange('masculino')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👨</span>
                      <span className="font-medium text-gray-900">Masculino</span>
                    </div>
                  </label>

                  {/* Checkbox Femenino */}
                  <label 
                    className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-pink-50 transition-all"
                    style={{ 
                      borderColor: generosSeleccionados.includes('femenino') ? '#EC4899' : '#E5E7EB',
                      backgroundColor: generosSeleccionados.includes('femenino') ? '#FCE7F3' : 'white'
                    }}>
                    <input
                      type="checkbox"
                      checked={generosSeleccionados.includes('femenino')}
                      onChange={() => handleGeneroChange('femenino')}
                      className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👩</span>
                      <span className="font-medium text-gray-900">Femenino</span>
                    </div>
                  </label>

                  {/* Checkbox Mixto */}
                  <label 
                    className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-purple-50 transition-all"
                    style={{ 
                      borderColor: generosSeleccionados.includes('mixto') ? '#8B5CF6' : '#E5E7EB',
                      backgroundColor: generosSeleccionados.includes('mixto') ? '#F3E8FF' : 'white'
                    }}>
                    <input
                      type="checkbox"
                      checked={generosSeleccionados.includes('mixto')}
                      onChange={() => handleGeneroChange('mixto')}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      <span className="font-medium text-gray-900">Mixto</span>
                    </div>
                  </label>
                </div>

                {/* Contador */}
                {generosSeleccionados.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✓ Se crearán <strong>{generosSeleccionados.length}</strong> categoría(s): <strong>{generosSeleccionados.join(', ')}</strong>
                    </p>
                  </div>
                )}

                {/* Progreso */}
                {creatingMultiple && (
                  <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                      <span className="text-sm font-medium text-yellow-800">
                        Creando... {progreso.actual}/{progreso.total}
                      </span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )
          }
        ]
    ),

    // COLOR DE LA CATEGORÍA
    {
      name: 'color',
      label: 'Color de la Categoría',
      type: 'color',
      required: true,
      defaultValue: selectedColor,
      cols: 3,
      helpText: (
        <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <span className="text-base">💡</span>
          <span className="font-medium">Este color identificará la categoría en carnets, tablas y reportes</span>
        </div>
      ),
      renderCustom: () => (
        <div className="space-y-4">
          {/* Selector de color visual */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
              Selecciona un color
            </p>

            {/* Grid de colores predefinidos */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSelectedColor(preset.value)}
                  className={`group relative h-16 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
                    selectedColor === preset.value 
                      ? 'ring-4 ring-blue-500 ring-offset-2 scale-105 shadow-xl' 
                      : 'border-3 border-gray-300 hover:border-gray-400 shadow-md'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {/* Checkmark cuando está seleccionado */}
                  {selectedColor === preset.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Tooltip al hover */}
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Color picker + Input HEX */}
            <div className="flex items-center gap-3 pt-3 border-t-2 border-gray-200">
              <div className="relative">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-14 h-14 rounded-lg cursor-pointer border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow"
                  title="Selector de color personalizado"
                />
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setSelectedColor(value);
                    }
                  }}
                  placeholder="#000000"
                  maxLength={7}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-base font-bold text-gray-800 uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>

              {/* Preview del color seleccionado */}
              <div 
                className="w-14 h-14 rounded-lg border-2 border-gray-300 shadow-md"
                style={{ backgroundColor: selectedColor }}
                title="Vista previa"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  // ESTADÍSTICAS
  const totalActivas = categorias.filter(c => c.estadoBooleano).length;
  const totalInactivas = categorias.filter(c => !c.estadoBooleano).length;
  const totalMasculinas = categorias.filter(c => c.genero === 'masculino').length;
  const totalFemeninas = categorias.filter(c => c.genero === 'femenino').length;
  const totalMixtas = categorias.filter(c => c.genero === 'mixto').length;

  // RENDER
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Categorías</h1>
        <p className="text-gray-600 mt-2">Administra las categorías registradas en el sistema.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg flex gap-3 items-center">
          <AlertCircle className="text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { 
            setEditingCategoria(null); 
            setSelectedColor('#3B82F6');
            setGenerosSeleccionados([]);
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
        >
          <Plus size={20} /> Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Categorías</p>
          <p className="text-2xl font-bold text-gray-900">{categorias.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activas</p>
          <p className="text-2xl font-bold text-green-600">{totalActivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Inactivas</p>
          <p className="text-2xl font-bold text-red-600">{totalInactivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
          <p className="text-gray-600 text-sm">Masculinas</p>
          <p className="text-2xl font-bold text-blue-500">{totalMasculinas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-400">
          <p className="text-gray-600 text-sm">Femeninas / Mixtas</p>
          <p className="text-2xl font-bold text-pink-500">{totalFemeninas + totalMixtas}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando categorías...</p>
        </div>
      ) : (
        <DataTable data={filteredCategorias} columns={columns} itemsPerPage={5} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingCategoria(null); 
          setSelectedColor('#3B82F6');
          setGenerosSeleccionados([]);
        }}
        onSubmit={handleSubmit}
        title={editingCategoria ? 'Editar Categoría' : 'Crear Nueva(s) Categoría(s)'}
        fields={formFields}
        initialData={editingCategoria || {}}
        size="3xl"
      />
    </div>
  );
}
