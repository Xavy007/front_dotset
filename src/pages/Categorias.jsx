// ===============================================
// ARCHIVO: src/pages/CategoriasPage.jsx
// PÁGINA DE CATEGORÍAS CON CRUD Y TABLA (SIMILAR A PARTIDOS)
// ===============================================

import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function CategoriasPage() {
  // ESTADO: Datos de categorías
  const [categorias, setCategorias] = useState([
    {
      id: 1,
      nombre: 'Sub-13',
      edadMinima: 11,
      edadMaxima: 13,
      descripcion: 'Categoría infantil para jugadores de 11 a 13 años',
      genero: 'Mixto',
      estado: 'Activa',
      cantidadEquipos: 8,
      cantidadJugadores: 120
    },
    {
      id: 2,
      nombre: 'Sub-15',
      edadMinima: 13,
      edadMaxima: 15,
      descripcion: 'Categoría juvenil menor',
      genero: 'Mixto',
      estado: 'Activa',
      cantidadEquipos: 10,
      cantidadJugadores: 150
    },
    {
      id: 3,
      nombre: 'Sub-17',
      edadMinima: 15,
      edadMaxima: 17,
      descripcion: 'Categoría juvenil intermedia',
      genero: 'Masculino',
      estado: 'Activa',
      cantidadEquipos: 12,
      cantidadJugadores: 180
    },
    {
      id: 4,
      nombre: 'Sub-20',
      edadMinima: 17,
      edadMaxima: 20,
      descripcion: 'Categoría juvenil mayor',
      genero: 'Masculino',
      estado: 'Activa',
      cantidadEquipos: 8,
      cantidadJugadores: 140
    },
    {
      id: 5,
      nombre: 'Primera División',
      edadMinima: 18,
      edadMaxima: 99,
      descripcion: 'Categoría profesional adultos',
      genero: 'Masculino',
      estado: 'Activa',
      cantidadEquipos: 16,
      cantidadJugadores: 350
    },
    {
      id: 6,
      nombre: 'Femenina',
      edadMinima: 16,
      edadMaxima: 99,
      descripcion: 'Liga femenina profesional',
      genero: 'Femenino',
      estado: 'Activa',
      cantidadEquipos: 10,
      cantidadJugadores: 180
    },
    {
      id: 7,
      nombre: 'Veteranos',
      edadMinima: 35,
      edadMaxima: 99,
      descripcion: 'Categoría para jugadores mayores de 35 años',
      genero: 'Masculino',
      estado: 'Activa',
      cantidadEquipos: 6,
      cantidadJugadores: 90
    },
  ]);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO: Contador para IDs
  const [nextId, setNextId] = useState(8);

  // Filtrar categorías por búsqueda
  const filteredCategorias = categorias.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.genero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  // CREATE
  const handleCreate = () => {
    setEditingCategoria(null);
    setIsModalOpen(true);
  };

  // EDIT
  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setIsModalOpen(true);
  };

  // DELETE
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar esta categoría?')) {
      setCategorias(categorias.filter(c => c.id !== id));
    }
  };

  // SUBMIT FORM (CREATE or UPDATE)
  const handleFormSubmit = (formData) => {
    if (editingCategoria) {
      // UPDATE
      setCategorias(categorias.map(c =>
        c.id === editingCategoria.id ? { ...formData, id: c.id } : c
      ));
    } else {
      // CREATE
      setCategorias([...categorias, { ...formData, id: nextId }]);
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
        <div className="font-bold text-gray-900 text-lg">{value}</div>
      )
    },
    {
      key: 'edadMinima',
      label: 'Edad Mínima',
      render: (value) => (
        <div className="text-center text-gray-700 font-medium">{value} años</div>
      )
    },
    {
      key: 'edadMaxima',
      label: 'Edad Máxima',
      render: (value) => (
        <div className="text-center text-gray-700 font-medium">{value === 99 ? 'Sin límite' : `${value} años`}</div>
      )
    },
    {
      key: 'genero',
      label: 'Género',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'Masculino'
            ? 'bg-blue-100 text-blue-700'
            : value === 'Femenino'
            ? 'bg-pink-100 text-pink-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {value}
        </div>
      )
    },
    {
      key: 'cantidadEquipos',
      label: 'Equipos',
      render: (value) => (
        <div className="text-center text-gray-700 font-semibold">{value}</div>
      )
    },
    {
      key: 'cantidadJugadores',
      label: 'Jugadores',
      render: (value) => (
        <div className="text-center text-gray-700 font-semibold">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'Activa'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {value}
        </div>
      )
    }
  ];

  // Campos del formulario
  // En CategoriasPage.jsx
const formFields = [
  {
    name: 'nombre',
    label: 'Nombre de la Categoría',
    type: 'text',
    placeholder: 'Ej: Sub-17',
    required: true
  },
  {
    name: 'edadMinima',
    label: 'Edad Mínima',
    type: 'number',
    placeholder: '15',
    required: true,
    min: 5,
    max: 99
  },
  {
    name: 'edadMaxima',
    label: 'Edad Máxima',
    type: 'number',
    placeholder: '17',
    required: true,
    min: 5,
    max: 99
  },
  {
    name: 'genero',
    label: 'Género',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    placeholder: 'Selecciona un género',
    options: [
      { value: 'Masculino', label: 'Masculino' },
      { value: 'Femenino', label: 'Femenino' },
      { value: 'Mixto', label: 'Mixto' }
    ]
  },
  {
    name: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Describe la categoría',
    required: true,
    rows: 3
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select', // ✅ SELECT/DROPDOWN
    required: true,
    options: [
      { value: 'Activa', label: 'Activa' },
      { value: 'Inactiva', label: 'Inactiva' },
      { value: 'Suspendida', label: 'Suspendida' }
    ]
  }
];

  // Calcular totales
  const totalEquipos = categorias.reduce((sum, c) => sum + parseInt(c.cantidadEquipos || 0), 0);
  const totalJugadores = categorias.reduce((sum, c) => sum + parseInt(c.cantidadJugadores || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Categorías</h1>
        <p className="text-gray-600 mt-2">Gestiona las categorías y divisiones de los torneos.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o género..."
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
          Nueva Categoría
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Categorías</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{categorias.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activas</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {categorias.filter(c => c.estado === 'Activa').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Total Equipos</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totalEquipos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Total Jugadores</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{totalJugadores}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
          <p className="text-gray-600 text-sm">Géneros</p>
          <p className="text-3xl font-bold text-pink-600 mt-2">
            {new Set(categorias.map(c => c.genero)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredCategorias}
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
        title={editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
        fields={formFields}
        initialData={editingCategoria}
      />
    </div>
  );
}