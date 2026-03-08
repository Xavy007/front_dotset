// ===============================================
// ARCHIVO: src/pages/EquiposPage.jsx
// CRUD COMPLETO DE EQUIPOS - CON ÍCONOS Y MODALES
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Search, AlertCircle,
  Pencil, Power, Trash2, Users, ClipboardList, CreditCard, Printer
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para gestión de plantilla
  const [isGestionarPlantillaOpen, setIsGestionarPlantillaOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [campeonatos, setCampeonatos] = useState([]);

  // Estados para ver plantilla
  const [isVerPlantillaOpen, setIsVerPlantillaOpen] = useState(false);
  const [plantillaActual, setPlantillaActual] = useState([]);
  const [plantillaCompleta, setPlantillaCompleta] = useState([]);
  const [loadingPlantilla, setLoadingPlantilla] = useState(false);
  const [campeonatosFiltro, setCampeonatosFiltro] = useState([]);
  const [campeonatoSeleccionadoFiltro, setCampeonatoSeleccionadoFiltro] = useState(null);

  // Estados para modal del carnet
  const [isCarnetModalOpen, setIsCarnetModalOpen] = useState(false);
  const [carnetSeleccionado, setCarnetSeleccionado] = useState(null);
  const [loadingCarnet, setLoadingCarnet] = useState(false);

  const API_URL = 'http://localhost:8080/api/equipo';
  const API_URL_CLUB = 'http://localhost:8080/api/club';
  const API_URL_CATEGORIA = 'http://localhost:8080/api/categoria';

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // CARGAR EQUIPOS, CLUBES Y CATEGORÍAS
  // ===============================================
  useEffect(() => {
    fetchEquipos();
    fetchClubes();
    fetchCategorias();
  }, []);

  const fetchEquipos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar equipos');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setEquipos(arr.map(normalizarEquipo));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubes = async () => {
    try {
      const res = await fetch(API_URL_CLUB, { headers: getAuthHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setClubes(
        arr.map((c) => ({
          label: c.nombre,
          value: c.id_club,
        }))
      );
    } catch (err) {
      console.error('Error al cargar clubes', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(API_URL_CATEGORIA, { headers: getAuthHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setCategorias(
        arr.map((cat) => ({
          label: cat.nombre,
          value: cat.id_categoria,
        }))
      );
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  // ===============================================
  // FUNCIONES PARA GESTIÓN DE PLANTILLA
  // ===============================================
  const fetchJugadoresDelEquipo = async (id_equipo, id_gestion) => {
    try {
      // Construir URL con parámetro de gestión si existe
      const url = id_gestion
        ? `${API_URL}/${id_equipo}/jugadores?id_gestion=${id_gestion}`
        : `${API_URL}/${id_equipo}/jugadores`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setJugadoresDisponibles(arr);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
      setJugadoresDisponibles([]);
    }
  };

  const fetchCampeonatos = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/campeonato', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setCampeonatos(arr.map(c => ({
        label: `${c.nombre} (${c.gestion || 'Sin año'})`,
        value: c.id_campeonato
      })));
    } catch (err) {
      console.error('Error cargando campeonatos:', err);
    }
  };

  // ===============================================
  // NORMALIZACIÓN DE DATOS
  // ===============================================
  const normalizarEquipo = (e) => {
    const estadoBooleano = e.estado === true || e.estado === 1;
    return {
      ...e,
      id_equipo: e.id_equipo ?? e.id,
      nombre: e.nombre ?? '',
      id_club: e.id_club ?? null,
      id_categoria: e.id_categoria ?? null,
      club_nombre: e.club?.nombre ?? 'Sin club',
      categoria_nombre: e.categoria?.nombre ?? 'Sin categoría',
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activo' : 'inactivo',
      freg: e.freg ? new Date(e.freg).toLocaleDateString() : '—',
    };
  };

  // ===============================================
  // CREAR / EDITAR EQUIPO
  // ===============================================
  const handleSubmit = async (formData) => {
    try {
      const body = {
        nombre: formData.nombre,
        id_club: Number(formData.id_club),
        id_categoria: Number(formData.id_categoria),
        estado: formData.estado === 'true' || formData.estado === true,
      };

      const method = editingEquipo ? 'PUT' : 'POST';
      const url = editingEquipo ? `${API_URL}/${editingEquipo.id_equipo}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar el equipo');
      }

      await fetchEquipos();
      setIsModalOpen(false);
      setEditingEquipo(null);
      alert('Equipo guardado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (equipo) => {
    const nuevoEstado = !equipo.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este equipo?`)) return;

    try {
      const res = await fetch(`${API_URL}/${equipo.id_equipo}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error('Error al cambiar el estado');

      setEquipos(prev =>
        prev.map(e =>
          e.id_equipo === equipo.id_equipo
            ? { ...e, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activo' : 'inactivo' }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // ELIMINAR EQUIPO
  // ===============================================
  const handleDelete = async (id_equipo) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este equipo?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_equipo}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el equipo');
      setEquipos(prev => prev.filter(e => e.id_equipo !== id_equipo));
      alert('Equipo eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // GESTIONAR PLANTILLA - INSCRIPCIÓN MASIVA
  // ===============================================
  const handleGestionarPlantilla = (equipo) => {
    setEquipoSeleccionado(equipo);
    setJugadoresDisponibles([]); // Limpiar jugadores previos
    fetchCampeonatos(); // Solo cargar campeonatos, los jugadores se cargan al seleccionar campeonato
    setIsGestionarPlantillaOpen(true);
  };

  const handleVerPlantilla = async (equipo) => {
    setEquipoSeleccionado(equipo);
    setPlantillaActual([]);
    setPlantillaCompleta([]);
    setCampeonatosFiltro([]);
    setCampeonatoSeleccionadoFiltro(null);
    setLoadingPlantilla(true);
    setIsVerPlantillaOpen(true);

    // Cargar plantilla del backend
    try {
      console.log('🔍 Cargando plantilla para equipo:', equipo.id_equipo);
      const res = await fetch(`${API_URL}/${equipo.id_equipo}/plantilla`, {
        headers: getAuthHeaders()
      });

      console.log('📡 Response status:', res.status);
      const data = await res.json();
      console.log('📊 Datos recibidos:', data);

      const arr = Array.isArray(data.data) ? data.data : [];
      console.log('✅ Plantilla procesada:', arr.length, 'jugadores');

      setPlantillaCompleta(arr);
      setPlantillaActual(arr);

      // Extraer campeonatos únicos
      const campeonatosUnicos = [...new Set(arr.map(p => p.campeonato.id_campeonato))];
      const campeonatosOptions = campeonatosUnicos.map(id => {
        const participacion = arr.find(p => p.campeonato.id_campeonato === id);
        return {
          id: participacion.campeonato.id_campeonato,
          nombre: participacion.campeonato.nombre,
          gestion: participacion.campeonato.gestion
        };
      });

      setCampeonatosFiltro(campeonatosOptions);

      // Si solo hay un campeonato, seleccionarlo automáticamente
      if (campeonatosOptions.length === 1) {
        setCampeonatoSeleccionadoFiltro(campeonatosOptions[0].id);
        setPlantillaActual(arr.filter(p => p.campeonato.id_campeonato === campeonatosOptions[0].id));
      }
    } catch (err) {
      console.error('❌ Error cargando plantilla:', err);
      alert('Error al cargar la plantilla: ' + err.message);
    } finally {
      setLoadingPlantilla(false);
    }
  };

  const handleFiltrarPorCampeonato = (id_campeonato) => {
    setCampeonatoSeleccionadoFiltro(id_campeonato);
    if (id_campeonato === null) {
      setPlantillaActual(plantillaCompleta);
    } else {
      setPlantillaActual(plantillaCompleta.filter(p => p.campeonato.id_campeonato === parseInt(id_campeonato)));
    }
  };

  const handleVerCarnet = async (participacion) => {
    setLoadingCarnet(true);
    setIsCarnetModalOpen(true);
    setCarnetSeleccionado(null);

    try {
      // Obtener id_gestion del campeonato
      const id_gestion = participacion.campeonato.id_gestion || participacion.campeonato.gestion;

      const res = await fetch(
        `http://localhost:8080/api/carnet/jugador/${participacion.jugador.id_jugador}/gestion/${id_gestion}`,
        { headers: getAuthHeaders() }
      );

      const data = await res.json();

      if (data.success && data.data) {
        setCarnetSeleccionado({
          ...data.data,
          jugador: participacion.jugador,
          categoria: participacion.categoria
        });
      } else {
        alert('Este jugador no tiene carnet activo para esta gestión');
        setIsCarnetModalOpen(false);
      }
    } catch (err) {
      console.error('Error cargando carnet:', err);
      alert('Error al cargar el carnet');
      setIsCarnetModalOpen(false);
    } finally {
      setLoadingCarnet(false);
    }
  };

  const handleImprimirCarnet = () => {
    window.print();
  };

  const handleGuardarInscripciones = async (formData) => {
    try {
      if (!formData.jugadores_seleccionados || formData.jugadores_seleccionados.length === 0) {
        alert('Debes seleccionar al menos un jugador');
        return;
      }

      // Crear inscripciones en batch
      const promesas = formData.jugadores_seleccionados.map(id_jugador => {
        // Buscar el jugador en jugadoresDisponibles para obtener su dorsal
        const jugador = jugadoresDisponibles.find(j => String(j.id) === String(id_jugador));
        const dorsal = jugador?.number || 1; // Usar dorsal del carnet o 1 por defecto

        const bodyData = {
          id_jugador: parseInt(id_jugador),
          id_campeonato: parseInt(formData.id_campeonato),
          id_categoria: equipoSeleccionado.id_categoria,
          id_equipo: equipoSeleccionado.id_equipo,
          dorsal: parseInt(dorsal), // Usar dorsal del carnet del jugador
          posicion: jugador?.position || null,
          estado: 'activo'
        };

        return fetch('http://localhost:8080/api/participaciones', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(bodyData)
        }).then(res => {
          if (!res.ok) throw new Error('Error guardando inscripción');
          return res.json();
        });
      });

      await Promise.all(promesas);

      alert(`✅ ${formData.jugadores_seleccionados.length} jugador(es) inscrito(s) exitosamente`);
      setIsGestionarPlantillaOpen(false);
      setEquipoSeleccionado(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredEquipos = equipos.filter((e) => {
    const term = searchTerm.toLowerCase();
    return e.nombre.toLowerCase().includes(term);
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
  // COLUMNAS TABLA
  // ===============================================
  const columns = [
    { key: 'nombre', label: 'Nombre del Equipo', render: (v) => <div className="font-bold text-gray-900">{v}</div> },
    { key: 'club_nombre', label: 'Club', render: (v) => <div className="text-gray-700">{v}</div> },
    { key: 'categoria_nombre', label: 'Categoría', render: (v) => <div className="text-gray-700">{v}</div> },
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
          <IconBtn
            title="Ver Plantilla"
            onClick={() => handleVerPlantilla(row)}
          >
            <ClipboardList size={18} className="text-blue-600" />
          </IconBtn>

          <IconBtn
            title="Gestionar Plantilla"
            onClick={() => handleGestionarPlantilla(row)}
          >
            <Users size={18} />
          </IconBtn>

          <IconBtn title="Editar" onClick={() => { setEditingEquipo(row); setIsModalOpen(true); }}>
            <Pencil size={18} />
          </IconBtn>

          <IconBtn
            title={row.estadoBooleano ? 'Desactivar Equipo' : 'Activar Equipo'}
            onClick={() => toggleEstado(row)}
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </IconBtn>

          <IconBtn title="Eliminar Equipo" onClick={() => handleDelete(row.id_equipo)} danger>
            <Trash2 size={18} />
          </IconBtn>
        </div>
      )
    }
  ];

  // ===============================================
  // FORMULARIO CAMPOS
  // ===============================================
  const formFields = [
    { name: 'nombre', label: 'Nombre del Equipo', type: 'text', required: true },
    {
      name: 'id_club',
      label: 'Club',
      type: 'select',
      required: true,
      placeholder: 'Selecciona un club',
      options: clubes
    },
    {
      name: 'id_categoria',
      label: 'Categoría',
      type: 'select',
      required: true,
      placeholder: 'Selecciona una categoría',
      options: categorias
    },
   /* {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ]
    },*/
  ];

  // ===============================================
  // FORMULARIO CAMPOS GESTIÓN PLANTILLA
  // ===============================================
  const getGestionPlantillaFields = () => {
    const camposCampeonato = [
      {
        name: 'id_campeonato',
        label: 'Campeonato',
        type: 'select',
        required: true,
        placeholder: 'Selecciona un campeonato',
        options: campeonatos,
        onChange: async (value) => {
          if (value && equipoSeleccionado) {
            // Obtener datos del campeonato seleccionado para extraer la gestión
            const res = await fetch(`http://localhost:8080/api/campeonato/${value}`, {
              headers: getAuthHeaders()
            });
            const data = await res.json();
            const campeonato = data.data || data;

            // Cargar jugadores filtrados por la gestión del campeonato
            // Intentar obtener id_gestion de varias formas: directo, de la relación, o del objeto gestion
            const idGestion = campeonato.id_gestion || campeonato.gestion?.id_gestion || campeonato.gestion;

            if (idGestion) {
              await fetchJugadoresDelEquipo(equipoSeleccionado.id_equipo, idGestion);
            }
          }
        }
      }
    ];

    const camposJugadores = jugadoresDisponibles.length > 0 ? [
      {
        name: 'jugadores_seleccionados',
        label: `Seleccionar Jugadores (${jugadoresDisponibles.length} disponibles)`,
        type: 'checkbox',
        required: true,
        options: jugadoresDisponibles.map(j => ({
          label: `${j.name} ${j.ap} ${j.am || ''} - Dorsal: ${j.number || 'N/A'}`.trim(),
          value: String(j.id)
        })),
        helperText: 'Solo se muestran jugadores con carnet activo en esta categoría y gestión del campeonato'
      }
    ] : [];

    return [...camposCampeonato, ...camposJugadores];
  };

  // ===============================================
  // ESTADÍSTICAS
  // ===============================================
  const totalActivos = equipos.filter(e => e.estadoBooleano).length;
  const totalInactivos = equipos.filter(e => !e.estadoBooleano).length;

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⚽ Equipos</h1>
        <p className="text-gray-600 mt-2">Gestiona los equipos registrados en el sistema.</p>
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
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingEquipo(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Equipos</p>
          <p className="text-2xl font-bold text-gray-900">{equipos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">{totalActivos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{totalInactivos}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando equipos...</p>
        </div>
      ) : (
        <DataTable data={filteredEquipos} columns={columns} itemsPerPage={5} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEquipo(null); }}
        onSubmit={handleSubmit}
        title={editingEquipo ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
        fields={formFields}
        initialData={editingEquipo || {}}
        size="3xl"
      />

      {/* Modal de Gestión de Plantilla */}
      {equipoSeleccionado && (
        <FormModal
          isOpen={isGestionarPlantillaOpen}
          onClose={() => {
            setIsGestionarPlantillaOpen(false);
            setEquipoSeleccionado(null);
            setJugadoresDisponibles([]);
          }}
          onSubmit={handleGuardarInscripciones}
          title={`Gestionar Plantilla - ${equipoSeleccionado.nombre}`}
          fields={getGestionPlantillaFields()}
          initialData={{}}
          size="3xl"
        />
      )}

      {/* Modal de Ver Plantilla */}
      {isVerPlantillaOpen && equipoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Plantilla de {equipoSeleccionado.nombre}
              </h3>
              <button
                onClick={() => {
                  setIsVerPlantillaOpen(false);
                  setEquipoSeleccionado(null);
                  setPlantillaActual([]);
                }}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingPlantilla ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto rounded-full mb-4"></div>
                  <p className="text-gray-600 text-lg">Cargando plantilla...</p>
                </div>
              ) : plantillaActual.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">No hay jugadores inscritos en este equipo</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Usa el botón "Gestionar Plantilla" para inscribir jugadores
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filtro por campeonato */}
                  {campeonatosFiltro.length > 1 && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrar por Campeonato:
                      </label>
                      <select
                        value={campeonatoSeleccionadoFiltro || ''}
                        onChange={(e) => handleFiltrarPorCampeonato(e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Todos los campeonatos ({plantillaCompleta.length} jugadores)</option>
                        {campeonatosFiltro.map(camp => (
                          <option key={camp.id} value={camp.id}>
                            {camp.nombre} - Gestión {camp.gestion} ({plantillaCompleta.filter(p => p.campeonato.id_campeonato === camp.id).length} jugadores)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <p className="text-blue-800 font-semibold">
                      Total de jugadores{campeonatoSeleccionadoFiltro ? ' en este campeonato' : ''}: {plantillaActual.length}
                    </p>
                    {campeonatoSeleccionadoFiltro && (
                      <span className="text-sm text-blue-600">
                        {campeonatosFiltro.find(c => c.id === campeonatoSeleccionadoFiltro)?.nombre} - {campeonatosFiltro.find(c => c.id === campeonatoSeleccionadoFiltro)?.gestion}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dorsal</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campeonato</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estadísticas</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Carnet</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {plantillaActual.map((p) => (
                          <tr key={p.id_participacion} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                                {p.dorsal}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {p.jugador.foto && (
                                  <img
                                    src={p.jugador.foto}
                                    alt={p.jugador.nombre_completo}
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900">{p.jugador.nombre_completo}</p>
                                  <p className="text-xs text-gray-500">
                                    {p.jugador.genero} • {p.jugador.edad} años
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {p.posicion || 'Sin definir'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                p.estado === 'activo' ? 'bg-green-100 text-green-800' :
                                p.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                                p.estado === 'baja' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {p.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {p.campeonato.nombre}
                              <br />
                              <span className="text-xs text-gray-500">Gestión {p.campeonato.gestion}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {p.categoria.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="space-y-1">
                                <p><strong>PJ:</strong> {p.estadisticas.partidos_jugados}</p>
                                <p><strong>Goles:</strong> {p.estadisticas.goles}</p>
                                <p className="text-xs text-gray-500">
                                  <strong>TA:</strong> {p.estadisticas.tarjetas_amarillas} •
                                  <strong> TR:</strong> {p.estadisticas.tarjetas_rojas}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {p.estado === 'activo' && (
                                <button
                                  onClick={() => handleVerCarnet(p)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                  title="Ver y imprimir carnet"
                                >
                                  <CreditCard size={16} />
                                  Ver Carnet
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                onClick={() => {
                  setIsVerPlantillaOpen(false);
                  setEquipoSeleccionado(null);
                  setPlantillaActual([]);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carnet */}
      {isCarnetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center print:hidden">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard size={24} />
                Carnet del Jugador
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleImprimirCarnet}
                  className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-semibold"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
                <button
                  onClick={() => {
                    setIsCarnetModalOpen(false);
                    setCarnetSeleccionado(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingCarnet ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto rounded-full mb-4"></div>
                  <p className="text-gray-600 text-lg">Cargando carnet...</p>
                </div>
              ) : carnetSeleccionado ? (
                <div className="space-y-6">
                  {/* Carnet Visual */}
                  <div className="border-4 border-green-600 rounded-lg p-6 bg-gradient-to-br from-green-50 to-white">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Foto del jugador */}
                      <div className="col-span-1">
                        {carnetSeleccionado.foto_carnet || carnetSeleccionado.jugador.foto ? (
                          <img
                            src={carnetSeleccionado.foto_carnet || carnetSeleccionado.jugador.foto}
                            alt={carnetSeleccionado.jugador.nombre_completo}
                            className="w-full h-48 object-cover rounded-lg border-2 border-green-600"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg border-2 border-green-600 flex items-center justify-center">
                            <span className="text-gray-400 text-4xl">👤</span>
                          </div>
                        )}
                      </div>

                      {/* Información del carnet */}
                      <div className="col-span-2 space-y-3">
                        <div className="text-center mb-4">
                          <h4 className="text-2xl font-bold text-green-800">CARNET DE JUGADOR</h4>
                          <p className="text-sm text-gray-600">Federación de Voleibol</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">N° Carnet</p>
                            <p className="text-lg font-bold text-green-700">{carnetSeleccionado.numero_carnet}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Dorsal</p>
                            <p className="text-lg font-bold text-gray-900">{carnetSeleccionado.numero_dorsal || 'N/A'}</p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Nombre Completo</p>
                            <p className="text-lg font-bold text-gray-900">{carnetSeleccionado.jugador.nombre_completo}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Categoría</p>
                            <p className="text-sm font-medium text-gray-900">{carnetSeleccionado.categoria?.nombre || 'N/A'}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Posición</p>
                            <p className="text-sm font-medium text-gray-900">{carnetSeleccionado.posicion || 'N/A'}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Fecha Emisión</p>
                            <p className="text-sm text-gray-700">{new Date(carnetSeleccionado.fecha_solicitud).toLocaleDateString()}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Vencimiento</p>
                            <p className="text-sm text-gray-700">{new Date(carnetSeleccionado.fecha_vencimiento).toLocaleDateString()}</p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Estado</p>
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              carnetSeleccionado.estado_carnet === 'activo' ? 'bg-green-100 text-green-800' :
                              carnetSeleccionado.estado_carnet === 'vencido' ? 'bg-red-100 text-red-800' :
                              carnetSeleccionado.estado_carnet === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {carnetSeleccionado.estado_carnet?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-green-300 text-center">
                      <p className="text-xs text-gray-600">
                        Este carnet es personal e intransferible. Válido únicamente con identificación oficial.
                      </p>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 rounded-lg p-4 print:hidden">
                    <h5 className="font-semibold text-gray-900 mb-2">Información Adicional</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Género:</strong> {carnetSeleccionado.jugador.genero}</p>
                      <p><strong>Edad:</strong> {carnetSeleccionado.jugador.edad} años</p>
                      <p><strong>Duración:</strong> {carnetSeleccionado.duracion_dias} días</p>
                      {carnetSeleccionado.solicitado_por && (
                        <p className="col-span-2"><strong>Solicitado por:</strong> {carnetSeleccionado.solicitado_por}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">No se pudo cargar el carnet</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t print:hidden">
              <button
                onClick={() => {
                  setIsCarnetModalOpen(false);
                  setCarnetSeleccionado(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
