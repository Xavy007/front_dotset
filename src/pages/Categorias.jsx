// ===============================================
// ARCHIVO: src/pages/CategoriasPage.jsx
// GESTIÓN DE CATEGORÍAS - CRUD COMPLETO
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

  const API_URL = 'http://localhost:8080/api/categoria';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // CARGAR CATEGORÍAS DESDE API
  // ===============================================
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

  // ===============================================
  // NORMALIZAR DATOS
  // ===============================================
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
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activa' : 'inactiva',
      freg: c.freg ? new Date(c.freg).toLocaleDateString() : '—',
    };
  };

  // ===============================================
  // CREAR O ACTUALIZAR
  // ===============================================
  const handleSubmit = async (formData) => {
    try {
      const body = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || '',
        edad_inicio: Number(formData.edad_inicio),
        edad_limite: formData.edad_limite ? Number(formData.edad_limite) : null,
        genero: formData.genero.toLowerCase(),
        estado: formData.estado === 'true' || formData.estado === true,
      };

      const method = editingCategoria ? 'PUT' : 'POST';
      const url = editingCategoria ? `${API_URL}/${editingCategoria.id_categoria}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar la categoría');
      }

      await fetchCategorias();
      setIsModalOpen(false);
      setEditingCategoria(null);
      alert('Categoría guardada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // ELIMINAR CATEGORÍA
  // ===============================================
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

  // ===============================================
  // CAMBIAR ESTADO (ACTIVA/INACTIVA)
  // ===============================================
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

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredCategorias = categorias.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.descripcion.toLowerCase().includes(term) ||
      c.genero.toLowerCase().includes(term)
    );
  });

  // ===============================================
  // COLUMNAS DE LA TABLA
  // ===============================================
  const columns = [
    { key: 'nombre', label: 'Nombre', render: (v) => <div className="font-bold">{v}</div> },
    { key: 'edad_inicio', label: 'Edad Inicio', render: (v) => `${v} años` },
    { key: 'edad_limite', label: 'Edad Límite', render: (v) => v ? `${v} años` : '—' },
    {
      key: 'genero',
      label: 'Género',
      render: (v) => (
        <div className={`px-3 py-1 rounded-full text-sm w-fit ${
          v === 'masculino'
            ? 'bg-blue-100 text-blue-700'
            : v === 'femenino'
            ? 'bg-pink-100 text-pink-700'
            : 'bg-purple-100 text-purple-700'
        }`}>{v}</div>
      )
    },
    {
      key: 'estadoVista',
      label: 'Estado',
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${row.estadoBooleano ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-medium ${row.estadoBooleano ? 'text-green-700' : 'text-red-700'}`}>
            {row.estadoVista}
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
            onClick={() => { setEditingCategoria(row); setIsModalOpen(true); }}
            className="p-2 border rounded-md hover:bg-gray-50"
          >
            <Pencil size={18} />
          </button>
          <button
            title={row.estadoBooleano ? 'Desactivar' : 'Activar'}
            onClick={() => toggleEstado(row)}
            className="p-2 border rounded-md hover:bg-gray-50"
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </button>
          <button
            title="Eliminar"
            onClick={() => handleDelete(row.id_categoria)}
            className="p-2 border rounded-md text-red-600 hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  // ===============================================
  // CAMPOS DEL FORMULARIO
  // ===============================================
  const formFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false },
    { name: 'edad_inicio', label: 'Edad Mínima', type: 'number', required: true, min: 4 },
    { name: 'edad_limite', label: 'Edad Máxima', type: 'number', required: false, min: 5 },
    {
      name: 'genero',
      label: 'Género',
      type: 'select',
      required: true,
      options: [
        { label: 'Masculino', value: 'masculino' },
        { label: 'Femenino', value: 'femenino' },
        { label: 'Mixto', value: 'mixto' },
      ]
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ]
    },
  ];

  // ===============================================
  // ESTADÍSTICAS
  // ===============================================
  const totalActivas = categorias.filter(c => c.estadoBooleano).length;
  const totalInactivas = categorias.filter(c => !c.estadoBooleano).length;
  const totalMasculinas = categorias.filter(c => c.genero === 'masculino').length;
  const totalFemeninas = categorias.filter(c => c.genero === 'femenino').length;
  const totalMixtas = categorias.filter(c => c.genero === 'mixto').length;

  // ===============================================
  // RENDER
  // ===============================================
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
          onClick={() => { setEditingCategoria(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

      {/* MODAL */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategoria(null); }}
        onSubmit={handleSubmit}
        title={editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
        fields={formFields}
        initialData={editingCategoria || {}}
      />
    </div>
  );
}
