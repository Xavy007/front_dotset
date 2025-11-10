// ===============================================
// ARCHIVO: src/pages/ClubesPage.jsx
// PÁGINA DE CLUBES CON CRUD Y TABLA
// ===============================================

import React, { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function ClubesPage() {
  const [clubes, setClubes] = useState([
    {
      id: 1,
      nombre: 'Club Deportivo Los Andes',
      ciudad: 'La Paz',
      fundacion: '1950',
      email: 'contacto@losandes.com',
      telefono: '+591-2-2123456',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Bolívar FC',
      ciudad: 'La Paz',
      fundacion: '1925',
      email: 'info@bolivarfc.com',
      telefono: '+591-2-2789012',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Club Independiente',
      ciudad: 'Cochabamba',
      fundacion: '1945',
      email: 'admin@independiente.com',
      telefono: '+591-4-4234567',
      estado: 'Activo'
    },
    {
      id: 4,
      nombre: 'Deportivo Municipal',
      ciudad: 'Santa Cruz',
      fundacion: '1960',
      email: 'contact@municipal.com',
      telefono: '+591-3-3456789',
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Club Jorge Wilstermann',
      ciudad: 'Cochabamba',
      fundacion: '1955',
      email: 'info@jwilstermann.com',
      telefono: '+591-4-4567890',
      estado: 'Activo'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextId, setNextId] = useState(6);

  const filteredClubes = clubes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingClub(null);
    setIsModalOpen(true);
  };

  const handleEdit = (club) => {
    setEditingClub(club);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este club?')) {
      setClubes(clubes.filter(c => c.id !== id));
    }
  };

  const handleFormSubmit = (formData) => {
    if (editingClub) {
      setClubes(clubes.map(c =>
        c.id === editingClub.id ? { ...formData, id: c.id } : c
      ));
    } else {
      setClubes([...clubes, { ...formData, id: nextId }]);
      setNextId(nextId + 1);
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre del Club',
      render: (value) => <div className="font-medium text-gray-900">{value}</div>
    },
    {
      key: 'ciudad',
      label: 'Ciudad',
      render: (value) => <div className="text-gray-600">{value}</div>
    },
    {
      key: 'fundacion',
      label: 'Fundación',
      render: (value) => <div className="text-gray-900">{value}</div>
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (value) => <div className="text-gray-600 text-sm">{value}</div>
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
      label: 'Nombre del Club',
      type: 'text',
      placeholder: 'Ej: Club Deportivo Los Andes',
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
      name: 'fundacion',
      label: 'Año de Fundación',
      type: 'text',
      placeholder: 'Ej: 1950',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Ej: contacto@club.com',
      required: true
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      placeholder: 'Ej: +591-2-2123456',
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
        <h1 className="text-3xl font-bold text-gray-900">🏟️ Clubes</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los clubes del campeonato.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o email..."
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
          Nuevo Club
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Clubes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{clubes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {clubes.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Ciudades</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {new Set(clubes.map(c => c.ciudad)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Desde</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {Math.min(...clubes.map(c => parseInt(c.fundacion)))}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        data={filteredClubes}
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
        title={editingClub ? 'Editar Club' : 'Crear Nuevo Club'}
        fields={formFields}
        initialData={editingClub}
      />
    </div>
  );
}