// ===============================================
// ARCHIVO: src/pages/EquiposPage.jsx
// CRUD COMPLETO DE EQUIPOS - CON ÍCONOS Y MODALES
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Search, AlertCircle,
  Pencil, Power, Trash2, Users
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8080/api/equipo';
  const API_URL_CLUB = 'http://localhost:8080/api/club';
  const API_URL_CATEGORIA = 'http://localhost:8080/api/categoria';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // CARGAR EQUIPOS, CLUBES Y CATEGORÍAS
  // ===============================================
  useEffect(() => {
    fetchEquipos();
    fetchClubes();
    fetchCategorias();
  }, []);

  const fetchEquipos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar equipos');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setEquipos(arr.map(normalizarEquipo));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubes = async () => {
    try {
      const res = await fetch(API_URL_CLUB, { headers: getAuthHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setClubes(
        arr.map((c) => ({
          label: c.nombre,
          value: c.id_club,
        }))
      );
    } catch (err) {
      console.error('Error al cargar clubes', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(API_URL_CATEGORIA, { headers: getAuthHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setCategorias(
        arr.map((cat) => ({
          label: cat.nombre,
          value: cat.id_categoria,
        }))
      );
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  // ===============================================
  // NORMALIZACIÓN DE DATOS
  // ===============================================
  const normalizarEquipo = (e) => {
    const estadoBooleano = e.estado === true || e.estado === 1;
    return {
      ...e,
      id_equipo: e.id_equipo ?? e.id,
      nombre: e.nombre ?? '',
      id_club: e.id_club ?? null,
      id_categoria: e.id_categoria ?? null,
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activo' : 'inactivo',
      freg: e.freg ? new Date(e.freg).toLocaleDateString() : '—',
    };
  };

  // ===============================================
  // CREAR / EDITAR EQUIPO
  // ===============================================
  const handleSubmit = async (formData) => {
    try {
      const body = {
        nombre: formData.nombre,
        id_club: Number(formData.id_club),
        id_categoria: Number(formData.id_categoria),
        estado: formData.estado === 'true' || formData.estado === true,
      };

      const method = editingEquipo ? 'PUT' : 'POST';
      const url = editingEquipo ? `${API_URL}/${editingEquipo.id_equipo}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar el equipo');
      }

      await fetchEquipos();
      setIsModalOpen(false);
      setEditingEquipo(null);
      alert('Equipo guardado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (equipo) => {
    const nuevoEstado = !equipo.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este equipo?`)) return;

    try {
      const res = await fetch(`${API_URL}/${equipo.id_equipo}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error('Error al cambiar el estado');

      setEquipos(prev =>
        prev.map(e =>
          e.id_equipo === equipo.id_equipo
            ? { ...e, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activo' : 'inactivo' }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // ELIMINAR EQUIPO
  // ===============================================
  const handleDelete = async (id_equipo) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este equipo?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_equipo}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el equipo');
      setEquipos(prev => prev.filter(e => e.id_equipo !== id_equipo));
      alert('Equipo eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredEquipos = equipos.filter((e) => {
    const term = searchTerm.toLowerCase();
    return e.nombre.toLowerCase().includes(term);
  });

  // ===============================================
  // ICON BUTTON COMPONENT
  // ===============================================
  const IconBtn = ({ title, onClick, children, danger }) => (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-md border transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50 border-red-200'
          : 'hover:bg-gray-50 border-gray-200'
      }`}
    >
      {children}
    </button>
  );

  // ===============================================
  // COLUMNAS TABLA
  // ===============================================
  const columns = [
    { key: 'nombre', label: 'Nombre del Equipo', render: (v) => <div className="font-bold text-gray-900">{v}</div> },
    { key: 'id_club', label: 'ID Club', render: (v) => <div>{v}</div> },
    { key: 'id_categoria', label: 'ID Categoría', render: (v) => <div>{v}</div> },
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
        <div className="flex items-center gap-2">
          <IconBtn title="Editar" onClick={() => { setEditingEquipo(row); setIsModalOpen(true); }}>
            <Pencil size={18} />
          </IconBtn>
          <IconBtn
            title={row.estadoBooleano ? 'Desactivar Equipo' : 'Activar Equipo'}
            onClick={() => toggleEstado(row)}
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </IconBtn>
          <IconBtn title="Eliminar Equipo" onClick={() => handleDelete(row.id_equipo)} danger>
            <Trash2 size={18} />
          </IconBtn>
        </div>
      )
    }
  ];

  // ===============================================
  // FORMULARIO CAMPOS
  // ===============================================
  const formFields = [
    { name: 'nombre', label: 'Nombre del Equipo', type: 'text', required: true },
    {
      name: 'id_club',
      label: 'Club',
      type: 'select',
      required: true,
      placeholder: 'Selecciona un club',
      options: clubes
    },
    {
      name: 'id_categoria',
      label: 'Categoría',
      type: 'select',
      required: true,
      placeholder: 'Selecciona una categoría',
      options: categorias
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
  const totalActivos = equipos.filter(e => e.estadoBooleano).length;
  const totalInactivos = equipos.filter(e => !e.estadoBooleano).length;

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⚽ Equipos</h1>
        <p className="text-gray-600 mt-2">Gestiona los equipos registrados en el sistema.</p>
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
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingEquipo(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Equipos</p>
          <p className="text-2xl font-bold text-gray-900">{equipos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">{totalActivos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{totalInactivos}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando equipos...</p>
        </div>
      ) : (
        <DataTable data={filteredEquipos} columns={columns} itemsPerPage={5} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEquipo(null); }}
        onSubmit={handleSubmit}
        title={editingEquipo ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
        fields={formFields}
        initialData={editingEquipo || {}}
      />
    </div>
  );
}
