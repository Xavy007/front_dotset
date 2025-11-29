// ===============================================
// ARCHIVO: src/pages/ClubesPage.jsx
// PÁGINA DE GESTIÓN DE CLUBES - CRUD COMPLETO
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Globe, Mail, Phone, Power, Trash2, Shield
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function ClubesPage() {
  const [clubes, setClubes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8080/api/club';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // CARGAR CLUBES
  // ===============================================
  useEffect(() => {
    fetchClubes();
  }, []);

  const fetchClubes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar clubes');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setClubes(arr.map(normalizarClub));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // NORMALIZACIÓN DE DATOS
  // ===============================================
  const normalizarClub = (c) => {
    const estadoBooleano = c.estado === true || c.estado === 1;
    return {
      ...c,
      id_club: c.id_club ?? c.id,
      nombre: c.nombre ?? '',
      acronimo: c.acronimo ?? '',
      direccion: c.direccion ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      redes_sociales: c.redes_sociales ?? '',
      personeria: c.personeria ?? false,
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activo' : 'inactivo',
      logo: c.logo ?? '',
      freg: c.freg ? new Date(c.freg).toLocaleDateString() : '—'
    };
  };

  // ===============================================
  // CREAR / EDITAR CLUB
  // ===============================================
  const handleSubmit = async (formData) => {
    try {
      const body = {
        nombre: formData.nombre,
        acronimo: formData.acronimo || null,
        direccion: formData.direccion || null,
        logo: formData.logo || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        redes_sociales: formData.redes_sociales || null,
        personeria: formData.personeria === 'true' || formData.personeria === true,
        estado: formData.estado === 'true' || formData.estado === true,
      };

      const method = editingClub ? 'PUT' : 'POST';
      const url = editingClub ? `${API_URL}/${editingClub.id_club}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar el club');
      }

      await fetchClubes();
      setIsModalOpen(false);
      setEditingClub(null);
      alert('Club guardado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (club) => {
    const nuevoEstado = !club.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este club?`)) return;

    try {
      const res = await fetch(`${API_URL}/${club.id_club}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) throw new Error('Error al cambiar el estado');

      setClubes(prev =>
        prev.map(c =>
          c.id_club === club.id_club
            ? { ...c, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activo' : 'inactivo' }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // ELIMINAR CLUB
  // ===============================================
  const handleDelete = async (id_club) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este club?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_club}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el club');
      setClubes(prev => prev.filter(c => c.id_club !== id_club));
      alert('Club eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredClubes = clubes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.acronimo.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
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
  // COLUMNAS DE TABLA
  // ===============================================
  const columns = [
    {
      key: 'logo',
      label: 'Logo',
      render: (value) =>
        value ? (
          <img src={value} alt="logo" className="w-10 h-10 object-cover rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">🏐</div>
        )
    },
    { key: 'nombre', label: 'Nombre', render: (v) => <div className="font-bold text-gray-900">{v}</div> },
    { key: 'acronimo', label: 'Sigla', render: (v) => <div>{v || '—'}</div> },
    { key: 'telefono', label: 'Teléfono', render: (v) => <div>{v || '—'}</div> },
    { key: 'email', label: 'Email', render: (v) => <div className="text-gray-600">{v || '—'}</div> },
    {
      key: 'personeria',
      label: 'Personería',
      render: (v) => (
        <div className={`px-3 py-1 text-sm rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {v ? 'Sí' : 'No'}
        </div>
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
        <div className="flex items-center gap-2">
          <IconBtn title="Editar" onClick={() => { setEditingClub(row); setIsModalOpen(true); }}>
            <Pencil size={18} />
          </IconBtn>
          <IconBtn
            title={row.estadoBooleano ? 'Desactivar Club' : 'Activar Club'}
            onClick={() => toggleEstado(row)}
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </IconBtn>
          <IconBtn title="Eliminar Club" onClick={() => handleDelete(row.id_club)} danger>
            <Trash2 size={18} />
          </IconBtn>
        </div>
      )
    }
  ];

  // ===============================================
  // CAMPOS DEL FORMULARIO
  // ===============================================
  const formFields = [
    { name: 'nombre', label: 'Nombre del Club', type: 'text', required: true },
    { name: 'acronimo', label: 'Acrónimo', type: 'text', required: false },
    { name: 'direccion', label: 'Dirección', type: 'text', required: false },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: false },
    { name: 'email', label: 'Correo Electrónico', type: 'email', required: false },
    { name: 'logo', label: 'Logo (URL)', type: 'text', required: false },
    { name: 'redes_sociales', label: 'Redes Sociales (URL o nombre)', type: 'text', required: false },
    {
      name: 'personeria',
      label: '¿Tiene Personería Jurídica?',
      type: 'select',
      required: true,
      options: [
        { label: 'Sí', value: true },
        { label: 'No', value: false },
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
  const totalActivos = clubes.filter(c => c.estadoBooleano).length;
  const totalInactivos = clubes.filter(c => !c.estadoBooleano).length;
  const totalPersoneria = clubes.filter(c => c.personeria).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏟️ Clubes</h1>
        <p className="text-gray-600 mt-2">Administra los clubes registrados en el sistema.</p>
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
            placeholder="Buscar club (nombre, email o sigla)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingClub(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nuevo Club
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Clubes</p>
          <p className="text-2xl font-bold text-gray-900">{clubes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">{totalActivos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Con Personería Jurídica</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPersoneria}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando clubes...</p>
        </div>
      ) : (
        <DataTable data={filteredClubes} columns={columns} itemsPerPage={5} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingClub(null); }}
        onSubmit={handleSubmit}
        title={editingClub ? 'Editar Club' : 'Registrar Nuevo Club'}
        fields={formFields}
        initialData={editingClub || {}}
      />
    </div>
  );
}
