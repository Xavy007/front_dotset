// ===============================================
// ARCHIVO: src/pages/EquiposPage.jsx
// PÁGINA DE EQUIPOS CON CRUD Y TABLA (SIMILAR A JUGADORES)
// ===============================================

import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function EquiposPage() {
  // ESTADO: Datos de equipos
  const [equipos, setEquipos] = useState([
    {
      id: 1,
      nombre: 'Equipo A - La Paz',
      club: 'Club Deportivo Los Andes',
      campeonato: 'Torneo Nacional 2024',
      categoria: 'Mayor',
      entrenador: 'Juan Pérez',
      jugadores: 23,
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Equipo B - Cochabamba',
      club: 'Club Independiente',
      campeonato: 'Torneo Nacional 2024',
      categoria: 'Mayor',
      entrenador: 'Carlos López',
      jugadores: 25,
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Equipo Sub-20 - La Paz',
      club: 'Bolívar FC',
      campeonato: 'Liga Departamental',
      categoria: 'Sub-20',
      entrenador: 'Roberto García',
      jugadores: 20,
      estado: 'Activo'
    },
    {
      id: 4,
      nombre: 'Equipo Sub-17 - Santa Cruz',
      club: 'Deportivo Municipal',
      campeonato: 'Torneo Sub-17',
      categoria: 'Sub-17',
      entrenador: 'María González',
      jugadores: 18,
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Equipo Femenino - La Paz',
      club: 'Club Deportivo Los Andes',
      campeonato: 'Liga Femenina 2024',
      categoria: 'Femenino',
      entrenador: 'Sandra Martínez',
      jugadores: 21,
      estado: 'Activo'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar equipos por búsqueda
  const filteredEquipos = equipos.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.campeonato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingEquipo(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (equipo) => {
    setEditingEquipo(equipo);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este equipo?')) {
      setEquipos(equipos.filter(e => e.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingEquipo) {
      // UPDATE
      setEquipos(equipos.map(e =>
        e.id === editingEquipo.id ? { ...formData, id: e.id } : e
      ));
    } else {
      // CREATE
      setEquipos([...equipos, { ...formData, id: nextId }]);
      setNextId(nextId + 1);
    }
    setIsModalOpen(false);
  };

  // Configurar columnas de la tabla
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre del Equipo',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'club',
      label: 'Club',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'campeonato',
      label: 'Campeonato',
      render: (value) => (
        <div className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'categoria',
      label: 'Categoría',
      render: (value) => (
        <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'entrenador',
      label: 'Entrenador',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'jugadores',
      label: 'Jugadores',
      render: (value) => (
        <div className="text-center font-semibold text-gray-900">{value}</div>
      )
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

  // Campos del formulario
  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre del Equipo',
      type: 'text',
      placeholder: 'Ej: Equipo A - La Paz',
      required: true
    },
    {
      name: 'club',
      label: 'Club',
      type: 'text',
      placeholder: 'Ej: Club Deportivo Los Andes',
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
      name: 'categoria',
      label: 'Categoría',
      type: 'text',
      placeholder: 'Ej: Mayor, Sub-20, Sub-17, Femenino',
      required: true
    },
    {
      name: 'entrenador',
      label: 'Entrenador',
      type: 'text',
      placeholder: 'Ej: Juan Pérez',
      required: true
    },
    {
      name: 'jugadores',
      label: 'Número de Jugadores',
      type: 'number',
      placeholder: 'Ej: 23',
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">👥 Equipos</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los equipos que participan en los campeonatos.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, club o campeonato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Botón Crear */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Equipos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{equipos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {equipos.filter(e => e.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-cyan-500">
          <p className="text-gray-600 text-sm">Campeonatos</p>
          <p className="text-3xl font-bold text-cyan-600 mt-2">
            {new Set(equipos.map(e => e.campeonato)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
          <p className="text-gray-600 text-sm">Categorías</p>
          <p className="text-3xl font-bold text-pink-600 mt-2">
            {new Set(equipos.map(e => e.categoria)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredEquipos}
        columns={columns}
        itemsPerPage={5}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Formulario */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingEquipo ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
        fields={formFields}
        initialData={editingEquipo}
      />
    </div>
  );
}