// ===============================================
// ARCHIVO: src/pages/CampeonatosPage.jsx
// PÁGINA DE CAMPEONATOS CON CRUD Y TABLA (SIMILAR A JUGADORES)
// ===============================================

import React, { useState } from 'react';
import { Trophy, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function CampeonatosPage() {
  // ESTADO: Datos de campeonatos
  const [campeonatos, setCampeonatos] = useState([
    {
      id: 1,
      nombre: 'Torneo Nacional 2024',
      tipo: 'Liga',
      categoria: 'Mayor',
      fecha_inicio: '2024-01-15',
      fecha_fin: '2024-12-15',
      participantes: 16,
      organizador: 'Federación Boliviana',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Liga Departamental Cochabamba',
      tipo: 'Liga',
      categoria: 'Mayor',
      fecha_inicio: '2024-03-01',
      fecha_fin: '2024-10-31',
      participantes: 10,
      organizador: 'Confederación Cochabamba',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Torneo Sub-20 2024',
      tipo: 'Torneo',
      categoria: 'Sub-20',
      fecha_inicio: '2024-02-01',
      fecha_fin: '2024-08-15',
      participantes: 12,
      organizador: 'Federación Boliviana',
      estado: 'Completado'
    },
    {
      id: 4,
      nombre: 'Copa Femenina 2024',
      tipo: 'Copa',
      categoria: 'Femenino',
      fecha_inicio: '2024-04-10',
      fecha_fin: '2024-09-20',
      participantes: 8,
      organizador: 'Federación Boliviana',
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Torneo Sub-17 Santa Cruz',
      tipo: 'Torneo',
      categoria: 'Sub-17',
      fecha_inicio: '2024-05-15',
      fecha_fin: '2024-11-15',
      participantes: 14,
      organizador: 'Confederación Santa Cruz',
      estado: 'Activo'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampeonato, setEditingCampeonato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar campeonatos por búsqueda
  const filteredCampeonatos = campeonatos.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingCampeonato(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (campeonato) => {
    setEditingCampeonato(campeonato);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este campeonato?')) {
      setCampeonatos(campeonatos.filter(c => c.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingCampeonato) {
      // UPDATE
      setCampeonatos(campeonatos.map(c =>
        c.id === editingCampeonato.id ? { ...formData, id: c.id } : c
      ));
    } else {
      // CREATE
      setCampeonatos([...campeonatos, { ...formData, id: nextId }]);
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
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'categoria',
      label: 'Categoría',
      render: (value) => (
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'fecha_inicio',
      label: 'Inicio',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'participantes',
      label: 'Participantes',
      render: (value) => (
        <div className="text-center font-semibold text-gray-900">{value}</div>
      )
    },
    {
      key: 'organizador',
      label: 'Organizador',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'Activo'
            ? 'bg-green-100 text-green-700'
            : value === 'Completado'
            ? 'bg-blue-100 text-blue-700'
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
      label: 'Nombre del Campeonato',
      type: 'text',
      placeholder: 'Ej: Torneo Nacional 2024',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'text',
      placeholder: 'Ej: Liga, Torneo, Copa',
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
      name: 'fecha_inicio',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true
    },
    {
      name: 'fecha_fin',
      label: 'Fecha de Fin',
      type: 'date',
      required: true
    },
    {
      name: 'participantes',
      label: 'Número de Participantes',
      type: 'number',
      placeholder: 'Ej: 16',
      required: true
    },
    {
      name: 'organizador',
      label: 'Organizador',
      type: 'text',
      placeholder: 'Ej: Federación Boliviana',
      required: true
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'text',
      placeholder: 'Ej: Activo, Completado, Cancelado',
      required: true
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Campeonatos</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los campeonatos y torneos disponibles.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o categoría..."
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
          Nuevo Campeonato
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Campeonatos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{campeonatos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {campeonatos.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Tipos</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(campeonatos.map(c => c.tipo)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
          <p className="text-gray-600 text-sm">Categorías</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {new Set(campeonatos.map(c => c.categoria)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Total Participantes</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {campeonatos.reduce((sum, c) => sum + c.participantes, 0)}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredCampeonatos}
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
        title={editingCampeonato ? 'Editar Campeonato' : 'Crear Nuevo Campeonato'}
        fields={formFields}
        initialData={editingCampeonato}
      />
    </div>
  );
}