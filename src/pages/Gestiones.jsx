import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, AlertCircle,
  Pencil, Power, Trash2
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function GestionesPage() {
  const [gestiones, setGestiones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGestion, setEditingGestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8080/api/gestion';

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => { fetchGestiones(); }, []);

  const fetchGestiones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar gestiones');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setGestiones(arr.map(normalizarGestion));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Normalizar según GestionCampeonato
  const normalizarGestion = (g) => {
    const estadoBooleano = g.estado === true || g.estado === 1;
    return {
      ...g,
      id_gestion: g.id_gestion ?? g.id,
      nombre: g.nombre ?? '',
      gestion: g.gestion ?? '',
      descripcion: g.descripcion ?? '',
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activa' : 'inactiva',
      freg: g.freg ? new Date(g.freg).toLocaleDateString() : '—',
    };
  };

  // CRUD: crear/editar
  const handleSubmit = async (formData) => {
    try {
      const body = {
        nombre: formData.nombre,
        gestion: formData.gestion ? Number(formData.gestion) : '',
        descripcion: formData.descripcion || null,
        estado: formData.estado === 'true' || formData.estado === true,
      };
      const method = editingGestion ? 'PUT' : 'POST';
      const url = editingGestion ? `${API_URL}/${editingGestion.id_gestion}` : API_URL;
      const res = await fetch(url, {
        method, headers: getAuthHeaders(), body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text() || 'Error al guardar la gestión');
      await fetchGestiones();
      setIsModalOpen(false);
      setEditingGestion(null);
      alert('Gestión guardada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // CRUD: activar/desactivar
  const toggleEstado = async (gestion) => {
    const nuevoEstado = !gestion.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta gestión?`)) return;
    try {
      const res = await fetch(`${API_URL}/${gestion.id_gestion}/estado`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error('Error al cambiar el estado');
      setGestiones(prev =>
        prev.map(g =>
          g.id_gestion === gestion.id_gestion
            ? { ...g, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activa' : 'inactiva' }
            : g
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // CRUD: eliminar
  const handleDelete = async (id_gestion) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar esta gestión?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_gestion}`, {
        method: 'DELETE', headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar la gestión');
      setGestiones(prev => prev.filter(g => g.id_gestion !== id_gestion));
      alert('Gestión eliminada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Búsqueda
  const filteredGestiones = gestiones.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.nombre.toLowerCase().includes(term) ||
      String(g.gestion).includes(term) ||
      (g.descripcion ? g.descripcion.toLowerCase().includes(term) : false)
    );
  });

  const IconBtn = ({ title, onClick, children, danger }) => (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-md border transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50 border-red-200'
               : 'hover:bg-gray-50 border-gray-200' }`}>
      {children}
    </button>
  );

  // Tabla
  const columns = [
    { key: 'nombre', label: 'Nombre', render: (v) => <div className="font-bold text-gray-900">{v}</div> },
    { key: 'gestion', label: 'Año', render: (v) => <div>{v}</div> },
    { key: 'descripcion', label: 'Descripción', render: (v) => <div>{v || '—'}</div> },
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
      ),
    },
    {
      key: 'freg',
      label: 'Fecha registro',
      render: (v) => <div>{v}</div>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <IconBtn title="Editar" onClick={() => { setEditingGestion(row); setIsModalOpen(true); }}>
            <Pencil size={18} />
          </IconBtn>
          <IconBtn title={row.estadoBooleano ? 'Desactivar Gestión' : 'Activar Gestión'} onClick={() => toggleEstado(row)}>
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </IconBtn>
          <IconBtn title="Eliminar Gestión" onClick={() => handleDelete(row.id_gestion)} danger>
            <Trash2 size={18} />
          </IconBtn>
        </div>
      ),
    }
  ];

  // Rango dinámico de gestión (año)
  const minYear = new Date().getFullYear() - 2;
  const maxYear = new Date().getFullYear() + 1;

  // Formulario acorde al modelo
  const formFields = [
    { name: 'nombre', label: 'Nombre de la gestión', type: 'text', required: true },
    { name: 'gestion', label: 'Año de gestión', type: 'number', required: true, min: minYear, max: maxYear },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false },
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

  const totalActivas = gestiones.filter(g => g.estadoBooleano).length;
  const totalInactivas = gestiones.filter(g => !g.estadoBooleano).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📋 Gestiones</h1>
        <p className="text-gray-600 mt-2">Gestiona los periodos de gestión para campeonatos. Solo se permiten años entre {minYear} y {maxYear}.</p>
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
            placeholder="Buscar gestión (nombre, año o descripción)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingGestion(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nueva Gestión
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Gestiones</p>
          <p className="text-2xl font-bold text-gray-900">{gestiones.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activas</p>
          <p className="text-2xl font-bold text-green-600">{totalActivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Inactivas</p>
          <p className="text-2xl font-bold text-red-600">{totalInactivas}</p>
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando gestiones...</p>
        </div>
      ) : (
        <DataTable data={filteredGestiones} columns={columns} itemsPerPage={5} />
      )}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingGestion(null); }}
        onSubmit={handleSubmit}
        title={editingGestion ? 'Editar Gestión' : 'Registrar Nueva Gestión'}
        fields={formFields}
        initialData={editingGestion || {}}
      />
    </div>
  );
}
