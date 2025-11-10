// ===============================================
// ARCHIVO: src/pages/JuecesPage.jsx
// PÁGINA DE ÁRBITROS/JUECES CON CRUD Y TABLA (SIMILAR A JUGADORES)
// ===============================================

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function JuecesPage() {
  // ESTADO: Datos de árbitros
  const [jueces, setJueces] = useState([
    {
      id: 1,
      nombre: 'Marco Antonio García',
      email: 'marco.garcia@example.com',
      categoria: 'Internacional',
      especialidad: 'Árbitro Central',
      experiencia: '20 años',
      licencia: 'FIFA 2024',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Roberto Fernández',
      email: 'roberto.fernandez@example.com',
      categoria: 'Nacional',
      especialidad: 'Árbitro de Línea',
      experiencia: '12 años',
      licencia: 'Confederación 2024',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Luis González',
      email: 'luis.gonzalez@example.com',
      categoria: 'Regional',
      especialidad: 'Árbitro Central',
      experiencia: '8 años',
      licencia: 'Regional 2024',
      estado: 'Activo'
    },
    {
      id: 4,
      nombre: 'Sofía Rodríguez',
      email: 'sofia.rodriguez@example.com',
      categoria: 'Nacional',
      especialidad: 'Árbitro Central',
      experiencia: '10 años',
      licencia: 'Confederación 2024',
      estado: 'Activo'
    },
    {
      id: 5,
      nombre: 'Diego Martínez',
      email: 'diego.martinez@example.com',
      categoria: 'Regional',
      especialidad: 'Árbitro de Línea',
      experiencia: '5 años',
      licencia: 'Regional 2024',
      estado: 'Activo'
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJuez, setEditingJuez] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(6);

  // Filtrar árbitros por búsqueda
  const filteredJueces = jueces.filter(j =>
    j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingJuez(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (juez) => {
    setEditingJuez(juez);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar a este árbitro?')) {
      setJueces(jueces.filter(j => j.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingJuez) {
      // UPDATE
      setJueces(jueces.map(j =>
        j.id === editingJuez.id ? { ...formData, id: j.id } : j
      ));
    } else {
      // CREATE
      setJueces([...jueces, { ...formData, id: nextId }]);
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
      key: 'categoria',
      label: 'Categoría',
      render: (value) => (
        <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'licencia',
      label: 'Licencia',
      render: (value) => (
        <div className="font-semibold text-gray-900">{value}</div>
      )
    },
    {
      key: 'experiencia',
      label: 'Experiencia',
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
      placeholder: 'Ej: Marco Antonio García',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Ej: marco@example.com',
      required: true
    },
    {
      name: 'categoria',
      label: 'Categoría',
      type: 'text',
      placeholder: 'Ej: Internacional, Nacional, Regional',
      required: true
    },
    {
      name: 'especialidad',
      label: 'Especialidad',
      type: 'text',
      placeholder: 'Ej: Árbitro Central, Árbitro de Línea',
      required: true
    },
    {
      name: 'licencia',
      label: 'Licencia/Certificación',
      type: 'text',
      placeholder: 'Ej: FIFA 2024',
      required: true
    },
    {
      name: 'experiencia',
      label: 'Experiencia',
      type: 'text',
      placeholder: 'Ej: 20 años',
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
        <h1 className="text-3xl font-bold text-gray-900"> Árbitros/Jueces</h1>
        <p className="text-gray-600 mt-2">Gestiona los árbitros y jueces de los campeonatos.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o categoría..."
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
          Nuevo Árbitro
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Árbitros</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{jueces.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {jueces.filter(j => j.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Categorías</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {new Set(jueces.map(j => j.categoria)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Especialidades</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(jueces.map(j => j.especialidad)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredJueces}
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
        title={editingJuez ? 'Editar Árbitro' : 'Agregar Nuevo Árbitro'}
        fields={formFields}
        initialData={editingJuez}
      />
    </div>
  );
}