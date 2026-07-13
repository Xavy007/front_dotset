// ===============================================
// ARCHIVO: src/pages/JuecesPage.jsx
// PÁGINA DE ÁRBITROS/JUECES (Persona + Juez)
// Con selects de Nacionalidad, Departamento y Provincia
// ===============================================

import React, { useState, useEffect } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { Users, Plus, Search, AlertCircle, CheckCircle, Award } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';
import StatCard, { StatsRow } from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { API_BASE } from '../services/api.config';
import { tienePermiso, getUsuarioActual } from '../utils/permissions.js';

// AJUSTA ESTAS URLs A TU BACKEND
const API_URL_JUEZ = `${API_BASE}/jueces`;
const API_URL_PERSONA = `${API_BASE}/persona`;
const API_URL_NACIONALIDAD = `${API_BASE}/nacionalidad`;
const API_URL_DEPARTAMENTO = `${API_BASE}/departamentos`;
const API_URL_PROVINCIA = `${API_BASE}/provincias`;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : undefined
  };
};

// Helpers pickArray como en JugadoresPage
const pickArrayN = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.nacionalidades)) return data.nacionalidades;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const pickArrayD = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.departamentos)) return data.departamentos;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const pickArrayP = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.provincias)) return data.provincias;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// Normalizar genero
const normalizarGenero = (genero) => {
  if (!genero) return null;
  const gen = String(genero).trim().toLowerCase();
  return ['masculino', 'femenino', 'otro'].includes(gen) ? gen : null;
};

// Flatten Juez + Persona
const flattenJuez = (j) => {
  const p = j.Persona ?? j.persona ?? {};
  const id_juez = j.id_juez ?? j.id;
  const id_persona = j.id_persona ?? p.id_persona ?? p.id;

  const ci = p.ci ?? '';
  const nombre = p.nombre ?? '';
  const ap = p.ap ?? '';
  const am = p.am ?? '';
  const apellidos = [ap, am].filter(Boolean).join(' ').trim();
  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();

  const fnac = p.fnac ?? null;
  const genero = normalizarGenero(p.genero);
  const foto = p.foto ?? null;

  const certificacion = j.certificacion ?? false;
  const juez_categoria = j.juez_categoria ?? 'juez';
  const grado = j.grado ?? 'municipal';
  const estado_juez = j.estado_juez ?? 'activo';
  const fecha_inicio = j.fecha_inicio ?? null;
  const fecha_fin = j.fecha_fin ?? null;
  const observaciones = j.observaciones ?? '';
  const estado = j.estado ?? true;

  const id_nacionalidad = p.id_nacionalidad ?? null;
  const id_provincia_origen = p.id_provincia_origen ?? null;

  return {
    id: id_juez,
    id_juez,
    id_persona,
    ci,
    nombre,
    ap,
    am,
    apellidos,
    nombreCompleto,
    fnac,
    genero,
    foto,
    certificacion,
    juez_categoria,
    grado,
    estado_juez,
    fecha_inicio,
    fecha_fin,
    observaciones,
    estado,
    id_nacionalidad,
    id_provincia_origen,
    persona: p,
    _raw: j
  };
};

export function JuecesPage() {
  const [jueces, setJueces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // catálogos
  const [nacionalidades, setNacionalidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [nacError, setNacError] = useState(null);
  const [depError, setDepError] = useState(null);
  const [provError, setProvError] = useState(null);

  // modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJuez, setEditingJuez] = useState(null);
  const [searchTerm, setSearchTerm] = usePersistedState('jueces:search', '');
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const _rol = getUsuarioActual()?.rol || '';
  const puedeEditarJuez   = tienePermiso(_rol, 'jueces', 'actualizar');
  const puedeEliminarJuez = tienePermiso(_rol, 'jueces', 'eliminar');
  const puedeCrearJuez    = tienePermiso(_rol, 'jueces', 'crear');

  const fetchJueces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL_JUEZ, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al cargar los jueces');
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.jueces)
        ? data.jueces
        : Array.isArray(data.data)
        ? data.data
        : [];
      setJueces(arr.map(flattenJuez));
    } catch (err) {
      console.error(err);
      setError(err.message);
      setJueces([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNacionalidades = async () => {
    setNacError(null);
    try {
      const res = await fetch(API_URL_NACIONALIDAD, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error al cargar nacionalidades');
      const data = await res.json();
      const arr = pickArrayN(data);
      const opts = arr.map((n) => ({
        label: n.pais ?? `Nacionalidad #${n.id_nacionalidad}`,
        value: String(n.id_nacionalidad)
      }));
      setNacionalidades(opts);
    } catch (e) {
      setNacError(e.message);
      setNacionalidades([]);
    }
  };

  const fetchDepartamentos = async () => {
    setDepError(null);
    try {
      const res = await fetch(API_URL_DEPARTAMENTO, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error al cargar departamentos');
      const data = await res.json();
      const arr = pickArrayD(data);
      const opts = arr.map((d) => ({
        label: d.nombre ?? `#${d.id_departamento}`,
        value: String(d.id_departamento),
        id_nacionalidad: d.id_nacionalidad
      }));
      setDepartamentos(opts);
    } catch (e) {
      setDepError(e.message);
      setDepartamentos([]);
    }
  };

  const fetchProvincias = async () => {
    setProvError(null);
    try {
      const res = await fetch(API_URL_PROVINCIA, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error al cargar provincias');
      const data = await res.json();
      const arr = pickArrayP(data);
      const opts = arr.map((p) => ({
        label: p.nombre,
        value: String(p.id_provincia),
        id_departamento: p.id_departamento
      }));
      setProvincias(opts);
    } catch (e) {
      setProvError(e.message);
      setProvincias([]);
    }
  };

  useEffect(() => {
    fetchJueces();
    fetchNacionalidades();
    fetchDepartamentos();
    fetchProvincias();
  }, []);

  const filteredJueces = Array.isArray(jueces)
    ? jueces.filter((j) => {
        const term = searchTerm.toLowerCase();
        return (
          (j.nombreCompleto ?? '').toLowerCase().includes(term) ||
          (j.ci ?? '').toLowerCase().includes(term) ||
          (j.grado ?? '').toLowerCase().includes(term)
        );
      })
    : [];

  const openCreateModal = () => {
    setEditingJuez(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (juez) => {
    setEditingJuez(juez);
    setIsEditModalOpen(true);
  };

  const handleCreateJuez = async (formData) => {
    if (!formData.ci?.trim()) { toast.error('La cédula de identidad es obligatoria'); return; }
    if (!formData.nombre?.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!formData.ap?.trim()) { toast.error('El apellido paterno es obligatorio'); return; }
    if (!formData.juez_categoria) { toast.error('Debes seleccionar la categoría del juez'); return; }
    if (!formData.grado) { toast.error('Debes seleccionar el grado del juez'); return; }
    if (!formData.estado_juez) { toast.error('Debes seleccionar el estado del juez'); return; }
    try {
      const bodyData = {
        persona: {
          ci: formData.ci.trim(),
          nombre: formData.nombre,
          ap: formData.ap,
          am: formData.am || null,
          fnac: formData.fnac || null,
          genero: formData.genero || null,
          id_nacionalidad: formData.id_nacionalidad
            ? Number(formData.id_nacionalidad)
            : null,
          id_provincia_origen: formData.id_provincia_origen
            ? Number(formData.id_provincia_origen)
            : null,
          foto: formData.foto || null
        },
        juez: {
          certificacion: !!formData.certificacion,
          juez_categoria: formData.juez_categoria,
          grado: formData.grado,
          estado_juez: formData.estado_juez,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_fin: formData.fecha_fin || null,
          observaciones: formData.observaciones || null
        }
      };

      const res = await fetch(API_URL_JUEZ, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        let msg = 'Error al crear juez';
        try {
          const errorData = await res.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsCreateModalOpen(false);
      await fetchJueces();
      toast.success('Juez creado exitosamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditJuez = async (formData) => {
    if (!formData.nombre?.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!formData.ap?.trim()) { toast.error('El apellido paterno es obligatorio'); return; }
    if (!formData.juez_categoria) { toast.error('Debes seleccionar la categoría del juez'); return; }
    if (!formData.grado) { toast.error('Debes seleccionar el grado del juez'); return; }
    if (!formData.estado_juez) { toast.error('Debes seleccionar el estado del juez'); return; }
    try {
      if (!editingJuez?.id_persona || !editingJuez?.id_juez) {
        throw new Error('No se puede editar: juez o persona no encontrados');
      }

      const bodyPersona = {
        ci: formData.ci,
        nombre: formData.nombre,
        ap: formData.ap,
        am: formData.am || null,
        fnac: formData.fnac || null,
        genero: formData.genero || null,
        id_nacionalidad: formData.id_nacionalidad
          ? Number(formData.id_nacionalidad)
          : null,
        id_provincia_origen: formData.id_provincia_origen
          ? Number(formData.id_provincia_origen)
          : null,
        foto: formData.foto || editingJuez.foto || null
      };

      const resP = await fetch(`${API_URL_PERSONA}/${editingJuez.id_persona}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPersona)
      });

      if (!resP.ok) {
        let msg = 'Error al actualizar datos personales';
        try {
          const errorData = await resP.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const bodyJuez = {
        certificacion: !!formData.certificacion,
        juez_categoria: formData.juez_categoria,
        grado: formData.grado,
        estado_juez: formData.estado_juez,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        observaciones: formData.observaciones || null
      };

      const resJ = await fetch(`${API_URL_JUEZ}/${editingJuez.id_juez}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyJuez)
      });

      if (!resJ.ok) {
        let msg = 'Error al actualizar juez';
        try {
          const errorData = await resJ.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsEditModalOpen(false);
      setEditingJuez(null);
      await fetchJueces();
      toast.success('Datos del juez actualizados correctamente');
    } catch (err) {
      console.error('Error al editar juez', err);
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = (id) => {
    setConfirm({ open: true, id });
  };

  const confirmDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL_JUEZ}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al eliminar juez');
      setJueces((prev) => prev.filter((j) => (j.id_juez ?? j.id) !== id));
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'foto',
      label: 'Foto',
      render: (value) =>
        value ? (
          <img
            src={value}
            alt="Juez"
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Users size={16} className="text-gray-400" />
          </div>
        )
    },
    {
      key: 'ci',
      label: 'CI',
      render: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre',
      render: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      key: 'juez_categoria',
      label: 'Tipo',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs w-fit capitalize">
          {value}
        </div>
      )
    },
    {
      key: 'grado',
      label: 'Grado',
      render: (value) => (
        <div className="text-gray-700 capitalize">{value}</div>
      )
    },
    {
      key: 'estado_juez',
      label: 'Estado juez',
      render: (value) => (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
            value === 'activo'
              ? 'bg-green-100 text-green-700'
              : value === 'suspendido'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value}
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {puedeEditarJuez && (
            <button
              title="Editar Juez"
              onClick={() => openEditModal(row)}
              className="p-2 rounded-md border hover:bg-gray-50"
            >
              ✏️
            </button>
          )}
          {puedeEliminarJuez && (
            <button
              title="Eliminar Juez"
              onClick={() => handleDelete(row.id_juez ?? row.id)}
              className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            >
              🗑️
            </button>
          )}
        </div>
      )
    }
  ];

  const getJuezFields = (isEditMode = false) => [
    // ── Datos personales ──────────────────────────────
    { type: 'section', name: 'sec_personal', label: 'Datos Personales', cols: 12 },
    {
      name: 'ci',
      label: 'CI',
      type: 'text',
      placeholder: 'Ej: 12345678',
      required: !isEditMode,
      cols: 1
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Ej: Juan',
      required: true,
      cols: 1
    },
    {
      name: 'ap',
      label: 'Apellido Paterno',
      type: 'text',
      placeholder: 'Ej: Pérez',
      required: true,
      cols: 1
    },
    {
      name: 'am',
      label: 'Apellido Materno',
      type: 'text',
      placeholder: 'Opcional',
      required: false,
      cols: 1
    },
    {
      name: 'fnac',
      label: 'Fecha de Nacimiento',
      type: 'date',
      required: false,
      cols: 1
    },
    {
      name: 'genero',
      label: 'Género',
      type: 'select',
      required: false,
      placeholder: 'Seleccione un género',
      cols: 1,
      options: [
        { label: 'Masculino', value: 'masculino' },
        { label: 'Femenino', value: 'femenino' },
        { label: 'Otro', value: 'otro' }
      ]
    },
    {
      name: 'id_nacionalidad',
      label: 'Nacionalidad',
      type: 'select',
      required: false,
      placeholder: 'Seleccione una nacionalidad',
      cols: 1,
      options: nacionalidades,
      resetChildren: ['id_departamento', 'id_provincia_origen']
    },
    {
      name: 'id_departamento',
      label: 'Departamento',
      type: 'select',
      placeholder: 'Seleccione un departamento',
      cols: 1,
      getDynamicOptions: (formData) => {
        const nacionalidadId = formData.id_nacionalidad;
        if (!nacionalidadId) return departamentos;
        return departamentos.filter(
          (d) => String(d.id_nacionalidad) === String(nacionalidadId)
        );
      },
      options: departamentos,
      resetChildren: ['id_provincia_origen']
    },
    {
      name: 'id_provincia_origen',
      label: 'Provincia',
      type: 'select',
      placeholder: 'Seleccione una provincia',
      cols: 1,
      getDynamicOptions: (formData) => {
        const departamentoId = formData.id_departamento;
        if (!departamentoId) return provincias;
        return provincias.filter(
          (p) => String(p.id_departamento) === String(departamentoId)
        );
      },
      options: provincias
    },
    // ── Perfil como juez ──────────────────────────────
    { type: 'section', name: 'sec_juez', label: 'Perfil como Juez', cols: 12 },
    {
      name: 'juez_categoria',
      label: 'Tipo de juez',
      type: 'select',
      required: true,
      cols: 1,
      options: [
        { label: 'Juez (central)', value: 'juez' },
        { label: 'Juez de línea', value: 'juez_linea' }
      ]
    },
    {
      name: 'grado',
      label: 'Grado',
      type: 'select',
      required: true,
      cols: 1,
      options: [
        { label: 'Municipal', value: 'municipal' },
        { label: 'Departamental', value: 'departamental' },
        { label: 'Federativo Nacional', value: 'federativo_nacional' },
        { label: 'Federativo Internacional', value: 'federativo_internacional' }
      ]
    },
    {
      name: 'estado_juez',
      label: 'Estado como juez',
      type: 'select',
      required: true,
      cols: 1,
      options: [
        { label: 'Activo', value: 'activo' },
        { label: 'Suspendido', value: 'suspendido' },
        { label: 'Inactivo', value: 'inactivo' }
      ]
    },
    {
      name: 'fecha_inicio',
      label: 'Fecha inicio como juez',
      type: 'date',
      required: false,
      cols: 1
    },
    {
      name: 'fecha_fin',
      label: 'Fecha fin (si aplica)',
      type: 'date',
      required: false,
      cols: 1
    },
    {
      name: 'certificacion',
      label: 'Tiene certificación oficial',
      type: 'checkbox',
      cols: 1
    },
    // ── Observaciones ─────────────────────────────────
    { type: 'section', name: 'sec_notas', label: 'Notas', cols: 12 },
    {
      name: 'observaciones',
      label: 'Observaciones',
      type: 'textarea',
      required: false,
      placeholder: 'Notas, sanciones, historial, etc.',
      rows: 3,
      cols: 12
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Árbitros / Jueces</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los árbitros y jueces del sistema (Persona + Juez).
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error al cargar jueces</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchJueces}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {nacError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          No se pudieron cargar las nacionalidades: {nacError}
        </div>
      )}
      {depError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          No se pudieron cargar los departamentos: {depError}
        </div>
      )}
      {provError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          No se pudieron cargar las provincias: {provError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar juez por nombre o CI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <StatCard compact title="Total Jueces" value={jueces.length} icon={Users} color="blue" loading={loading} />
        <StatCard compact title="Activos" value={jueces.filter(j => j.estado_juez === 'activo').length} icon={CheckCircle} color="green" loading={loading} />
        <StatCard compact title="Certificados" value={jueces.filter(j => j.certificacion).length} icon={Award} color="yellow" loading={loading} />

        {puedeCrearJuez && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Juez
          </button>
        )}
      </div>

      <DataTable
        data={filteredJueces}
        columns={columns}
        itemsPerPage={10}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJuez}
        title="Crear Nuevo Juez"
        size="5xl"
        columns={3}
        fields={getJuezFields(false)}
        initialData={{
          ci: '',
          nombre: '',
          ap: '',
          am: '',
          fnac: '',
          genero: '',
          id_nacionalidad: '',
          id_departamento: '',
          id_provincia_origen: '',
          certificacion: false,
          juez_categoria: 'juez',
          grado: 'municipal',
          estado_juez: 'activo',
          fecha_inicio: '',
          fecha_fin: '',
          observaciones: ''
        }}
      />

      {editingJuez && (
        <FormModal
          key={`edit-juez-${editingJuez.id_juez}-${Date.now()}`}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingJuez(null);
          }}
          onSubmit={handleEditJuez}
          title="Editar Juez"
          size="5xl"
          columns={3}
          fields={getJuezFields(true)}
          initialData={{
            ci: editingJuez.ci,
            nombre: editingJuez.nombre,
            ap: editingJuez.ap,
            am: editingJuez.am,
            fnac: editingJuez.fnac
              ? editingJuez.fnac.substring(0, 10)
              : '',
            genero: editingJuez.genero || '',
            id_nacionalidad: editingJuez.id_nacionalidad
              ? String(editingJuez.id_nacionalidad)
              : '',
            id_departamento: '', // no lo tenemos directo en flatten, depende de Provincia
            id_provincia_origen: editingJuez.id_provincia_origen
              ? String(editingJuez.id_provincia_origen)
              : '',
            certificacion: editingJuez.certificacion,
            juez_categoria: editingJuez.juez_categoria,
            grado: editingJuez.grado,
            estado_juez: editingJuez.estado_juez,
            fecha_inicio: editingJuez.fecha_inicio
              ? editingJuez.fecha_inicio.substring(0, 10)
              : '',
            fecha_fin: editingJuez.fecha_fin
              ? editingJuez.fecha_fin.substring(0, 10)
              : '',
            observaciones: editingJuez.observaciones || ''
          }}
        />
      )}
    </div>
  );
}
