// ===============================================
// ARCHIVO: src/pages/JugadoresPage.jsx
// PÁGINA COMPLETA CON CRUD Y TABLA
// ===============================================

import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function JugadoresPage() {
  // ESTADO: Datos de jugadores
  const [jugadores, setJugadores] = useState([
    {
      id: 1,
      nombre: 'Juan García',
      email: 'juan@example.com',
      posicion: 'Delantero',
      numero: 9,
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Carlos López',
      email: 'carlos@example.com',
      posicion: 'Portero',
      numero: 1,
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'María Martínez',
      email: 'maria@example.com',
      posicion: 'Defensa',
      numero: 4,
      estado: 'Lesionado'
    },
    {
      id: 4,
      nombre: 'Pedro Rodríguez',
      email: 'pedro@example.com',
      posicion: 'Centrocampista',
      numero: 8,
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Ana Fernández',
      email: 'ana@example.com',
      posicion: 'Delantero',
      numero: 11,
      estado: 'Activo'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJugador, setEditingJugador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar jugadores por búsqueda
  const filteredJugadores = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingJugador(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (jugador) => {
    setEditingJugador(jugador);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este jugador?')) {
      setJugadores(jugadores.filter(j => j.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingJugador) {
      // UPDATE
      setJugadores(jugadores.map(j =>
        j.id === editingJugador.id ? { ...formData, id: j.id } : j
      ));
    } else {
      // CREATE
      setJugadores([...jugadores, { ...formData, id: nextId }]);
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
      key: 'posicion',
      label: 'Posición',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'numero',
      label: 'Número',
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
// En JugadoresPage.jsx
const formFields = [
  {
    name: 'nombre',
    label: 'Nombre Completo',
    type: 'text',
    placeholder: 'Ej: Juan Pérez',
    required: true
  },
  {
    name: 'posicion',
    label: 'Posición',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona una posición',
    options: [
      { value: 'Portero', label: 'Portero' },
      { value: 'Defensa', label: 'Defensa' },
      { value: 'Mediocampista', label: 'Mediocampista' },
      { value: 'Delantero', label: 'Delantero' }
    ]
  },
  {
    name: 'equipo',
    label: 'Equipo',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona un equipo',
    options: [
      { value: 'Equipo A', label: 'Equipo A' },
      { value: 'Equipo B', label: 'Equipo B' },
      { value: 'Equipo Sub-20', label: 'Equipo Sub-20' },
      { value: 'Equipo Femenino', label: 'Equipo Femenino' }
    ]
  },
  {
    name: 'edad',
    label: 'Edad',
    type: 'number',
    placeholder: '18',
    required: true,
    min: 10,
    max: 50
  },
  {
    name: 'categoria',
    label: 'Categoría',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    options: [
      { value: 'Sub-13', label: 'Sub-13' },
      { value: 'Sub-15', label: 'Sub-15' },
      { value: 'Sub-17', label: 'Sub-17' },
      { value: 'Sub-20', label: 'Sub-20' },
      { value: 'Primera División', label: 'Primera División' }
    ]
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
      { value: 'Lesionado', label: 'Lesionado' },
      { value: 'Suspendido', label: 'Suspendido' }
    ]
  }
];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jugadores</h1>
        <p className="text-gray-600 mt-2">Gestiona los jugadores de tu equipo.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botón Crear */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Jugador
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Total Jugadores</p>
          <p className="text-2xl font-bold text-gray-900">{jugadores.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {jugadores.filter(j => j.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Lesionados</p>
          <p className="text-2xl font-bold text-red-600">
            {jugadores.filter(j => j.estado === 'Lesionado').length}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredJugadores}
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
        title={editingJugador ? 'Editar Jugador' : 'Crear Nuevo Jugador'}
        fields={formFields}
        initialData={editingJugador}
      />
    </div>
  );
}