// ===============================================
// ARCHIVO: src/pages/PartidosPage.jsx
// PÁGINA DE PARTIDOS CON CRUD Y TABLA (SIMILAR A JUGADORES)
// ===============================================

import React, { useState } from 'react';
import { Zap, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function PartidosPage() {
  // ESTADO: Datos de partidos
  const [partidos, setPartidos] = useState([
    {
      id: 1,
      equipo1: 'Equipo A - La Paz',
      equipo2: 'Equipo B - Cochabamba',
      fecha: '2024-01-15',
      hora: '15:30',
      cancha: 'Estadio Hernando Siles',
      arbitro: 'Marco Antonio García',
      campeonato: 'Torneo Nacional 2024',
      resultado: '2-1',
      estado: 'Finalizado'
    },
    {
      id: 2,
      equipo1: 'Equipo Sub-20 - La Paz',
      equipo2: 'Equipo Sub-17 - Santa Cruz',
      fecha: '2024-01-16',
      hora: '14:00',
      cancha: 'Estadio Ramón Aguilera',
      arbitro: 'Roberto Fernández',
      campeonato: 'Liga Departamental',
      resultado: '1-1',
      estado: 'Finalizado'
    },
    {
      id: 3,
      equipo1: 'Equipo Femenino - La Paz',
      equipo2: 'Equipo A - La Paz',
      fecha: '2024-01-17',
      hora: '18:00',
      cancha: 'Cancha General',
      arbitro: 'Sofía Rodríguez',
      campeonato: 'Liga Femenina 2024',
      resultado: '0-0',
      estado: 'En Juego'
    },
    {
      id: 4,
      equipo1: 'Bolívar FC',
      equipo2: 'Club Independiente',
      fecha: '2024-01-18',
      hora: '20:00',
      cancha: 'Estadio San José',
      arbitro: 'Luis González',
      campeonato: 'Torneo Nacional 2024',
      resultado: '-',
      estado: 'Programado'
    },
    {
      id: 5,
      equipo1: 'Deportivo Municipal',
      equipo2: 'Club Jorge Wilstermann',
      fecha: '2024-01-19',
      hora: '16:30',
      cancha: 'Cancha La Paz Central',
      arbitro: 'Diego Martínez',
      campeonato: 'Torneo Sub-17',
      resultado: '-',
      estado: 'Programado'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartido, setEditingPartido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar partidos por búsqueda
  const filteredPartidos = partidos.filter(p =>
    p.equipo1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.equipo2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.campeonato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingPartido(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (partido) => {
    setEditingPartido(partido);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este partido?')) {
      setPartidos(partidos.filter(p => p.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingPartido) {
      // UPDATE
      setPartidos(partidos.map(p =>
        p.id === editingPartido.id ? { ...formData, id: p.id } : p
      ));
    } else {
      // CREATE
      setPartidos([...partidos, { ...formData, id: nextId }]);
      setNextId(nextId + 1);
    }
    setIsModalOpen(false);
  };

  // Configurar columnas de la tabla
  const columns = [
    {
      key: 'equipo1',
      label: 'Equipo 1',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'equipo2',
      label: 'Equipo 2',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'hora',
      label: 'Hora',
      render: (value) => (
        <div className="text-center text-gray-600">{value}</div>
      )
    },
    {
      key: 'resultado',
      label: 'Resultado',
      render: (value) => (
        <div className={`text-center font-bold text-lg ${
          value === '-' ? 'text-gray-400' : 'text-gray-900'
        }`}>
          {value}
        </div>
      )
    },
    {
      key: 'cancha',
      label: 'Cancha',
      render: (value) => (
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'arbitro',
      label: 'Árbitro',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'Programado'
            ? 'bg-blue-100 text-blue-700'
            : value === 'En Juego'
            ? 'bg-red-100 text-red-700'
            : value === 'Finalizado'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {value}
        </div>
      )
    }
  ];

  // Campos del formulario
// En PartidosPage.jsx
const formFields = [
  {
    name: 'equipo1',
    label: 'Equipo 1',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona equipo 1',
    options: [
      { value: 'Equipo A - La Paz', label: 'Equipo A - La Paz' },
      { value: 'Equipo B - Cochabamba', label: 'Equipo B - Cochabamba' },
      { value: 'Equipo Sub-20 - La Paz', label: 'Equipo Sub-20 - La Paz' },
      { value: 'Bolívar FC', label: 'Bolívar FC' }
    ]
  },
  {
    name: 'equipo2',
    label: 'Equipo 2',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona equipo 2',
    options: [
      { value: 'Equipo A - La Paz', label: 'Equipo A - La Paz' },
      { value: 'Equipo B - Cochabamba', label: 'Equipo B - Cochabamba' },
      { value: 'Equipo Sub-20 - La Paz', label: 'Equipo Sub-20 - La Paz' },
      { value: 'Club Independiente', label: 'Club Independiente' }
    ]
  },
  {
    name: 'fecha',
    label: 'Fecha',
    type: 'date',
    required: true
  },
  {
    name: 'hora',
    label: 'Hora',
    type: 'time',
    required: true
  },
  {
    name: 'cancha',
    label: 'Cancha',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona una cancha',
    options: [
      { value: 'Estadio Hernando Siles', label: 'Estadio Hernando Siles' },
      { value: 'Estadio Ramón Aguilera', label: 'Estadio Ramón Aguilera' },
      { value: 'Cancha General', label: 'Cancha General' },
      { value: 'Estadio San José', label: 'Estadio San José' }
    ]
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    options: [
      { value: 'Programado', label: 'Programado' },
      { value: 'En Juego', label: 'En Juego' },
      { value: 'Finalizado', label: 'Finalizado' },
      { value: 'Cancelado', label: 'Cancelado' }
    ]
  }
];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏐 Partidos</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los partidos de los campeonatos.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por equipos o campeonato..."
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
          Nuevo Partido
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Partidos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{partidos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Programados</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {partidos.filter(p => p.estado === 'Programado').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">En Juego</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {partidos.filter(p => p.estado === 'En Juego').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Finalizados</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {partidos.filter(p => p.estado === 'Finalizado').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Campeonatos</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(partidos.map(p => p.campeonato)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredPartidos}
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
        title={editingPartido ? 'Editar Partido' : 'Crear Nuevo Partido'}
        fields={formFields}
        initialData={editingPartido}
        size='xl'
      />
    </div>
  );
}