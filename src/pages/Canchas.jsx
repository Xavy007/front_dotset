// ===============================================
// ARCHIVO: src/pages/CanchasCampeonatosPage.jsx
// PÁGINA DE CANCHAS DE CAMPEONATOS CON CRUD Y TABLA
// ===============================================

import React, { useState } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function CanchasPage() {
  const [canchas, setCanchas] = useState([
    {
      id: 1,
      nombre: 'Estadio Hernando Siles',
      ciudad: 'La Paz',
      capacidad: 35000,
      campeonato: 'Torneo Nacional 2024',
      estado: 'Activo',
      tipo: 'Profesional'
    },
    {
      id: 2,
      nombre: 'Estadio Ramón Aguilera',
      ciudad: 'Cochabamba',
      capacidad: 25000,
      campeonato: 'Liga Departamental',
      estado: 'Activo',
      tipo: 'Semi-profesional'
    },
    {
      id: 3,
      nombre: 'Cancha General',
      ciudad: 'Santa Cruz',
      capacidad: 15000,
      campeonato: 'Torneo Sub-20',
      estado: 'Activo',
      tipo: 'Amateur'
    },
    {
      id: 4,
      nombre: 'Estadio San José',
      ciudad: 'Oruro',
      capacidad: 12000,
      campeonato: 'Liga Departamental',
      estado: 'Activo',
      tipo: 'Semi-profesional'
    },
    {
      id: 5,
      nombre: 'Cancha La Paz Central',
      ciudad: 'La Paz',
      capacidad: 8000,
      campeonato: 'Torneo Sub-20',
      estado: 'Activo',
      tipo: 'Amateur'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCancha, setEditingCancha] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextId, setNextId] = useState(6);

  const filteredCanchas = canchas.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.campeonato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingCancha(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cancha) => {
    setEditingCancha(cancha);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar esta cancha?')) {
      setCanchas(canchas.filter(c => c.id !== id));
    }
  };

  const handleFormSubmit = (formData) => {
    if (editingCancha) {
      setCanchas(canchas.map(c =>
        c.id === editingCancha.id ? { ...formData, id: c.id } : c
      ));
    } else {
      setCanchas([...canchas, { ...formData, id: nextId }]);
      setNextId(nextId + 1);
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value) => <div className="font-medium text-gray-900">{value}</div>
    },
    {
      key: 'ciudad',
      label: 'Ciudad',
      render: (value) => <div className="text-gray-600">{value}</div>
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'capacidad',
      label: 'Capacidad',
      render: (value) => <div className="text-center font-semibold">{value.toLocaleString()}</div>
    },
    {
      key: 'campeonato',
      label: 'Campeonato',
      render: (value) => <div className="text-sm text-gray-600">{value}</div>
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'Activo'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {value}
        </div>
      )
    }
  ];

  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre de la Cancha',
      type: 'text',
      placeholder: 'Ej: Estadio Hernando Siles',
      required: true
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      placeholder: 'Ej: La Paz',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'text',
      placeholder: 'Ej: Profesional',
      required: true
    },
    {
      name: 'capacidad',
      label: 'Capacidad',
      type: 'number',
      placeholder: 'Ej: 35000',
      required: true
    },
    {
      name: 'campeonato',
      label: 'Campeonato',
      type: 'text',
      placeholder: 'Ej: Torneo Nacional 2024',
      required: true
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'text',
      placeholder: 'Ej: Activo',
      required: true
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏐 Canchas de Campeonatos</h1>
        <p className="text-gray-600 mt-2">Gestiona todas las canchas disponibles para los campeonatos.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o campeonato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nueva Cancha
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Canchas</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{canchas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activas</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {canchas.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Capacidad Total</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {(canchas.reduce((sum, c) => sum + c.capacidad, 0) / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Ciudades</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {new Set(canchas.map(c => c.ciudad)).size}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        data={filteredCanchas}
        columns={columns}
        itemsPerPage={5}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingCancha ? 'Editar Cancha' : 'Crear Nueva Cancha'}
        fields={formFields}
        initialData={editingCancha}
      />
    </div>
  );
}