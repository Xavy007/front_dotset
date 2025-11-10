// ===============================================
// ARCHIVO: src/pages/EquipoTecnicoPage.jsx
// PÁGINA EQUIPO TÉCNICO CON CRUD Y TABLA (SIMILAR A JUGADORES)
// ===============================================

import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function EqTecnicoPage() {
  // ESTADO: Datos de equipo técnico
  const [equipoTecnico, setEquipoTecnico] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@example.com',
      cargo: 'Entrenador Principal',
      especialidad: 'Táctico',
      experiencia: '15 años',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Carlos López',
      email: 'carlos.lopez@example.com',
      cargo: 'Asistente Técnico',
      especialidad: 'Físico',
      experiencia: '8 años',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'María García',
      email: 'maria.garcia@example.com',
      cargo: 'Médico del Equipo',
      especialidad: 'Médico',
      experiencia: '10 años',
      estado: 'Activo'
    },
    {
      id: 4,
      nombre: 'Roberto Martínez',
      email: 'roberto.martinez@example.com',
      cargo: 'Preparador Físico',
      especialidad: 'Físico',
      experiencia: '12 años',
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Sandra Rodríguez',
      email: 'sandra.rodriguez@example.com',
      cargo: 'Nutricionista',
      especialidad: 'Nutrición',
      experiencia: '6 años',
      estado: 'Activo'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMiembro, setEditingMiembro] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar equipo técnico por búsqueda
  const filteredEquipo = equipoTecnico.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingMiembro(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (miembro) => {
    setEditingMiembro(miembro);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar a este miembro?')) {
      setEquipoTecnico(equipoTecnico.filter(m => m.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingMiembro) {
      // UPDATE
      setEquipoTecnico(equipoTecnico.map(m =>
        m.id === editingMiembro.id ? { ...formData, id: m.id } : m
      ));
    } else {
      // CREATE
      setEquipoTecnico([...equipoTecnico, { ...formData, id: nextId }]);
      setNextId(nextId + 1);
    }
    setIsModalOpen(false);
  };

  // Configurar columnas de la tabla
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (value) => (
        <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      render: (value) => (
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'experiencia',
      label: 'Experiencia',
      render: (value) => (
        <div className="font-semibold text-gray-900">{value}</div>
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
      label: 'Nombre Completo',
      type: 'text',
      placeholder: 'Ej: Juan Pérez',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Ej: juan@example.com',
      required: true
    },
    {
      name: 'cargo',
      label: 'Cargo',
      type: 'text',
      placeholder: 'Ej: Entrenador Principal',
      required: true
    },
    {
      name: 'especialidad',
      label: 'Especialidad',
      type: 'text',
      placeholder: 'Ej: Táctico',
      required: true
    },
    {
      name: 'experiencia',
      label: 'Experiencia',
      type: 'text',
      placeholder: 'Ej: 15 años',
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
        <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Equipo Técnico</h1>
        <p className="text-gray-600 mt-2">Gestiona los miembros del equipo técnico.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o cargo..."
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
          Nuevo Miembro
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Miembros</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{equipoTecnico.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {equipoTecnico.filter(m => m.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Cargos</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {new Set(equipoTecnico.map(m => m.cargo)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Especialidades</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(equipoTecnico.map(m => m.especialidad)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredEquipo}
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
        title={editingMiembro ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}
        fields={formFields}
        initialData={editingMiembro}
      />
    </div>
  );
}