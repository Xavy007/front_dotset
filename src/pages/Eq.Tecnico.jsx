// ===============================================
// ARCHIVO: src/pages/EqTecnicoPage.jsx
// PÁGINA DE CUERPO TÉCNICO CON AUTOCOMPLETADO POR CI
// ===============================================

import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, AlertCircle } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import { toast } from 'sonner';

import { API_BASE } from '../services/api.config.js';

// AJUSTADAS AL NUEVO BACKEND
const API_URL_EQTECNICO = `${API_BASE}/eqtecnico`;
const API_URL_PERSONA = `${API_BASE}/persona`;
const API_URL_NACIONALIDAD = `${API_BASE}/nacionalidad`;
const API_URL_DEPARTAMENTO = `${API_BASE}/departamentos`;
const API_URL_PROVINCIA = `${API_BASE}/provincias`;
const API_URL_CLUB = `${API_BASE}/club`;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : undefined,
  };
};

// Helpers para arrays
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

const pickArrayClubs = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clubs)) return data.clubs;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizarGenero = (genero) => {
  if (!genero) return null;
  const gen = String(genero).trim().toLowerCase();
  return ['masculino', 'femenino', 'otro'].includes(gen) ? gen : null;
};

const rolToTexto = (rol) => {
  const map = {
    DT: 'Director Técnico',
    EA: 'Entrenador Asistente',
    AC: 'Ayudante de Campo',
    M: 'Médico',
    F: 'Fisioterapeuta',
  };
  return map[rol] || rol;
};

const estadoToTexto = (estado) => {
  const map = {
    activo: 'Activo',
    suspendido: 'Suspendido',
    inactivo: 'Inactivo',
  };
  return map[estado] || estado;
};

// Flatten EqTecnico + Persona + Club
const flattenEqTecnico = (e) => {
  const p = e.Persona ?? e.persona ?? {};
  const club = e.Club ?? e.club ?? {};
  const id_eqtecnico = e.id_eqtecnico ?? e.id;
  const id_persona = e.id_persona ?? p.id_persona ?? p.id;
  const id_club = e.id_club ?? club.id_club ?? club.id;

  const ci = p.ci ?? '';
  const nombre = p.nombre ?? '';
  const ap = p.ap ?? '';
  const am = p.am ?? '';
  const apellidos = [ap, am].filter(Boolean).join(' ').trim();
  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();

  const fnac = p.fnac ?? null;
  const genero = normalizarGenero(p.genero);
  const foto = p.foto ?? null;

  const rol = e.rol ?? 'DT';
  const rolTexto = rolToTexto(rol);

  const estado_eq = e.estado_eq ?? 'activo';
  const estadoTexto = estadoToTexto(estado_eq);
  const estadoBool = e.estado !== undefined ? !!e.estado : true;

  const fecha_inicio = e.fecha_inicio ?? null;
  const fecha_fin = e.fecha_fin ?? null;
  const observaciones = e.observaciones ?? '';

  const id_nacionalidad = p.id_nacionalidad ?? null;
  const id_provincia_origen = p.id_provincia_origen ?? null;
  const nombreClub = club.nombre ?? null;

  return {
    id: id_eqtecnico,
    id_eqtecnico,
    id_persona,
    id_club,
    ci,
    nombre,
    ap,
    am,
    apellidos,
    nombreCompleto,
    fnac,
    genero,
    foto,
    rol,
    rolTexto,
    estado_eq,
    estadoTexto,
    estado: estadoBool,
    fecha_inicio,
    fecha_fin,
    observaciones,
    id_nacionalidad,
    id_provincia_origen,
    nombreClub,
    persona: p,
    club,
    _raw: e,
  };
};

export function EqTecnicoPage() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nacionalidades, setNacionalidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [nacError, setNacError] = useState(null);
  const [depError, setDepError] = useState(null);
  const [provError, setProvError] = useState(null);
  const [clubError, setClubError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ====== NUEVO: Estados para autocompletar CI ======
  const [ciMessage, setCiMessage] = useState('');
  const [ciMessageType, setCiMessageType] = useState('');

  // ====== NUEVO: useRef para el debounce ======
  const debounceTimeout = useRef(null);

  // ====== NUEVO: Verificar CI y autocompletar CON DEBUG ======
  const verificarCI = async (ci, updateFormData) => {
    console.log('🔍 verificarCI llamado con:', { ci, updateFormData: !!updateFormData });
    
    if (!ci || ci.trim() === '') {
      setCiMessage('');
      setCiMessageType('');
      return;
    }

    try {
      const res = await fetch(`${API_URL_PERSONA}/ci/${ci.trim()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('📡 Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        const persona = data.data || data;

        console.log('✅ Persona encontrada:', persona);

        // Autocompletar campos SOLO si se encuentra
        if (updateFormData) {
          const datosParaAutocompletar = {
            ci: persona.ci || ci,
            nombre: persona.nombre || '',
            ap: persona.ap || '',
            am: persona.am || '',
            fnac: persona.fnac ? persona.fnac.substring(0, 10) : '',
            genero: persona.genero || '',
            id_nacionalidad: persona.id_nacionalidad 
              ? String(persona.id_nacionalidad) 
              : '',
            id_provincia_origen: persona.id_provincia_origen
              ? String(persona.id_provincia_origen)
              : '',
          };
          
          console.log('🔄 Llamando updateFormData con:', datosParaAutocompletar);
          updateFormData(datosParaAutocompletar);
          console.log('✅ updateFormData ejecutado');
        } else {
          console.error('❌ updateFormData es null o undefined');
        }

        const nombreCompleto = [persona.nombre, persona.ap, persona.am]
          .filter(Boolean)
          .join(' ');
        setCiMessage(`✓ Persona ya registrada: ${nombreCompleto} - datos autocargados`);
        setCiMessageType('info');
        
      } else if (res.status === 404) {
        console.log('⚠️ CI no encontrado (404)');
        // SOLO mostrar mensaje, NO borrar campos
        setCiMessage('CI no encontrado - ingrese los datos manualmente');
        setCiMessageType('warning');
        // NO llamar updateFormData aquí
        
      } else {
        console.log('⚠️ Error inesperado:', res.status);
        setCiMessage('Error al verificar CI');
        setCiMessageType('warning');
      }
      
    } catch (error) {
      console.error('❌ Error al verificar CI:', error);
      setCiMessage('Error de conexión al verificar CI');
      setCiMessageType('warning');
      // NO borrar campos en caso de error
    }
  };

  // ====== NUEVO: Versión con debounce ======
  const verificarCIDebounced = (ci, updateFormData) => {
    // Cancelar el timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Crear nuevo timeout
    debounceTimeout.current = setTimeout(() => {
      verificarCI(ci, updateFormData);
    }, 600);
  };

  // GET /api/eqtecnico
  const fetchTecnicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL_EQTECNICO, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar cuerpo técnico');
      const data = await res.json();

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      setTecnicos(arr.map(flattenEqTecnico));
    } catch (err) {
      console.error(err);
      setError(err.message);
      setTecnicos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNacionalidades = async () => {
    setNacError(null);
    try {
      const res = await fetch(API_URL_NACIONALIDAD, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Error al cargar nacionalidades');
      const data = await res.json();
      const arr = pickArrayN(data);
      const opts = arr.map((n) => ({
        label: n.pais ?? `Nacionalidad #${n.id_nacionalidad}`,
        value: String(n.id_nacionalidad),
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
        headers: { ...getAuthHeaders(), Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Error al cargar departamentos');
      const data = await res.json();
      const arr = pickArrayD(data);
      const opts = arr.map((d) => ({
        label: d.nombre ?? `#${d.id_departamento}`,
        value: String(d.id_departamento),
        id_nacionalidad: d.id_nacionalidad,
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
        headers: { ...getAuthHeaders(), Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Error al cargar provincias');
      const data = await res.json();
      const arr = pickArrayP(data);
      const opts = arr.map((p) => ({
        label: p.nombre,
        value: String(p.id_provincia),
        id_departamento: p.id_departamento,
      }));
      setProvincias(opts);
    } catch (e) {
      setProvError(e.message);
      setProvincias([]);
    }
  };

  const fetchClubs = async () => {
    setClubError(null);
    try {
      const res = await fetch(API_URL_CLUB, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Error al cargar clubes');
      const data = await res.json();
      const arr = pickArrayClubs(data);
      const opts = arr.map((c) => ({
        label: c.nombre ?? `Club #${c.id_club ?? c.id}`,
        value: String(c.id_club ?? c.id),
      }));
      setClubs(opts);
    } catch (e) {
      setClubError(e.message);
      setClubs([]);
    }
  };

  useEffect(() => {
    fetchTecnicos();
    fetchNacionalidades();
    fetchDepartamentos();
    fetchProvincias();
    fetchClubs();
  }, []);

  const filteredTecnicos = Array.isArray(tecnicos)
    ? tecnicos.filter((t) => {
        const term = searchTerm.toLowerCase();
        return (
          (t.nombreCompleto ?? '').toLowerCase().includes(term) ||
          (t.ci ?? '').toLowerCase().includes(term) ||
          (t.rolTexto ?? '').toLowerCase().includes(term) ||
          (t.nombreClub ?? '').toLowerCase().includes(term)
        );
      })
    : [];

  const openCreateModal = () => {
    setEditingTecnico(null);
    setCiMessage('');
    setCiMessageType('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (tecnico) => {
    setEditingTecnico(tecnico);
    setIsEditModalOpen(true);
  };

  const handleCreateTecnico = async (formData) => {
    try {
      if (!formData.id_club) throw new Error('Debe seleccionar un club');

      const bodyData = {
        id_club: Number(formData.id_club),
        rol: formData.rol,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        observaciones: formData.observaciones || null,
        datoPersona: {
          nombre: formData.nombre,
          ap: formData.ap,
          am: formData.am || '',
          ci: formData.ci,
          id_nacionalidad: formData.id_nacionalidad
            ? Number(formData.id_nacionalidad)
            : null,
          genero: formData.genero || null,
          fnac: formData.fnac || null,
        },
      };

      const res = await fetch(API_URL_EQTECNICO, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        let msg = 'Error al crear miembro del cuerpo técnico';
        try {
          const errorData = await res.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsCreateModalOpen(false);
      setCiMessage('');
      setCiMessageType('');
      await fetchTecnicos();
      toast.success('Miembro del cuerpo técnico creado exitosamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

const handleEditTecnico = async (formData) => {
  try {
    if (!editingTecnico?.id_persona || !editingTecnico?.id_eqtecnico) {
      throw new Error('No se puede editar: técnico o persona no encontrados');
    }

    const safeTrim = (v) => (v == null ? '' : String(v).trim());

    // Datos de la persona (SIN el CI si no cambió)
    const bodyPersona = {
      nombre: safeTrim(formData.nombre),
      ap: safeTrim(formData.ap),
      am: formData.am == null ? null : safeTrim(formData.am),
      fnac: formData.fnac || null,
      genero: formData.genero || null,
      id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : null,
      id_provincia_origen: formData.id_provincia_origen ? Number(formData.id_provincia_origen) : null,
      foto: formData.foto || editingTecnico.foto || null,
    };

    // ⚠️ IMPORTANTE: NO enviar CI si no cambió
    if (formData.ci !== editingTecnico.ci) {
      bodyPersona.ci = safeTrim(formData.ci);
    }

    console.log('📝 Actualizando Persona:', bodyPersona);

    // Actualizar Persona
    const resP = await fetch(`${API_URL_PERSONA}/${editingTecnico.id_persona}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyPersona),
    });

    if (!resP.ok) {
      let msg = 'Error al actualizar datos personales';
      try {
        const errorData = await resP.json();
        msg = errorData.message || msg;
      } catch {}
      throw new Error(msg);
    }

    // Datos del EqTecnico
    const bodyEq = {
      id_club: formData.id_club ? Number(formData.id_club) : editingTecnico.id_club,
      rol: formData.rol,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      observaciones: formData.observaciones || null,
    };

    console.log('📝 Actualizando EqTecnico:', bodyEq);

    // Actualizar EqTecnico
    const resEq = await fetch(`${API_URL_EQTECNICO}/${editingTecnico.id_eqtecnico}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyEq),
    });

    if (!resEq.ok) {
      let msg = 'Error al actualizar miembro del cuerpo técnico';
      try {
        const errorData = await resEq.json();
        msg = errorData.message || msg;
      } catch {}
      throw new Error(msg);
    }

    setIsEditModalOpen(false);
    setEditingTecnico(null);
    await fetchTecnicos();
    toast.success('Datos del cuerpo técnico actualizados correctamente');
    
  } catch (err) {
    console.error('❌ Error al editar técnico:', err);
    toast.error(`Error: ${err.message}`);
  }
};


  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '¿Estás seguro que deseas eliminar este miembro del cuerpo técnico?'
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL_EQTECNICO}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar cuerpo técnico');
      setTecnicos((prev) =>
        prev.filter((t) => (t.id_eqtecnico ?? t.id) !== id)
      );
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
            alt="Técnico"
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Users size={16} className="text-gray-400" />
          </div>
        ),
    },
    {
      key: 'ci',
      label: 'CI',
      render: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      ),
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre',
      render: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      ),
    },
    {
      key: 'rolTexto',
      label: 'Rol',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs w-fit">
          {value}
        </div>
      ),
    },
    {
      key: 'nombreClub',
      label: 'Club',
      render: (value) => (
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs w-fit">
          {value || 'Sin club'}
        </div>
      ),
    },
    {
      key: 'estado_eq',
      label: 'Estado',
      render: (value, row) => (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
            value === 'activo'
              ? 'bg-green-100 text-green-700'
              : value === 'suspendido'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.estadoTexto}
        </div>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <button
            title="Editar"
            onClick={() => openEditModal(row)}
            className="p-2 rounded-md border hover:bg-gray-50"
          >
            ✏️
          </button>
          <button
            title="Eliminar"
            onClick={() => handleDelete(row.id_eqtecnico ?? row.id)}
            className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  const getTecnicoFields = (isEditMode = false, updateFormData = null) => {
    
    const baseFields = [
      {
          name: 'ci',
          label: 'CI',
          ype: 'text',
          placeholder: 'Ej: 12345678',
          required: !isEditMode,
          cols: 3,
          disabled: isEditMode, // ← Deshabilitar en modo edición
          helpText: isEditMode ? 'El CI no se puede modificar' : undefined,
      },
      {
        name: 'nombre',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Ej: Juan',
        required: true,
        cols: 3,
      },
      {
        name: 'ap',
        label: 'Apellido Paterno',
        type: 'text',
        placeholder: 'Ej: Pérez',
        required: true,
        cols: 3,
      },
      {
        name: 'am',
        label: 'Apellido Materno',
        type: 'text',
        placeholder: 'Opcional',
        required: false,
        cols: 3,
      },
      {
        name: 'fnac',
        label: 'Fecha de Nacimiento',
        type: 'date',
        required: false,
        cols: 3,
      },
      {
        name: 'genero',
        label: 'Género',
        type: 'select',
        required: false,
        placeholder: 'Seleccione un género',
        cols: 3,
        options: [
          { label: 'Masculino', value: 'masculino' },
          { label: 'Femenino', value: 'femenino' },
          { label: 'Otro', value: 'otro' },
        ],
      },
      {
        name: 'id_nacionalidad',
        label: 'Nacionalidad',
        type: 'select',
        required: false,
        placeholder: 'Seleccione una nacionalidad',
        cols: 3,
        options: nacionalidades,
        resetChildren: ['id_departamento', 'id_provincia_origen'],
      },
      {
        name: 'id_departamento',
        label: 'Departamento',
        type: 'select',
        placeholder: 'Seleccione un departamento',
        cols: 3,
        getDynamicOptions: (formData) => {
          const nacionalidadId = formData.id_nacionalidad;
          if (!nacionalidadId) return departamentos;
          return departamentos.filter(
            (d) => String(d.id_nacionalidad) === String(nacionalidadId)
          );
        },
        options: departamentos,
        resetChildren: ['id_provincia_origen'],
      },
      {
        name: 'id_provincia_origen',
        label: 'Provincia',
        type: 'select',
        placeholder: 'Seleccione una provincia',
        cols: 3,
        getDynamicOptions: (formData) => {
          const departamentoId = formData.id_departamento;
          if (!departamentoId) return provincias;
          return provincias.filter(
            (p) => String(p.id_departamento) === String(departamentoId)
          );
        },
        options: provincias,
      },
      {
        name: 'id_club',
        label: 'Club',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un club',
        cols: 3,
        options: clubs,
      },
      {
        name: 'rol',
        label: 'Rol',
        type: 'select',
        required: true,
        cols: 3,
        options: [
          { label: 'Director Técnico', value: 'DT' },
          { label: 'Entrenador Asistente', value: 'EA' },
          { label: 'Ayudante de Campo', value: 'AC' },
          { label: 'Médico', value: 'M' },
          { label: 'Fisioterapeuta', value: 'F' },
        ],
      },
      {
        name: 'fecha_inicio',
        label: 'Fecha inicio',
        type: 'date',
        required: false,
        cols: 3,
      },
      {
        name: 'fecha_fin',
        label: 'Fecha fin (si aplica)',
        type: 'date',
        required: false,
        cols: 3,
      },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        required: false,
        placeholder: 'Notas, sanciones, etc.',
        rows: 3,
        cols: 12,
      },
    ];

    // Agregar helpText al campo CI solo en modo creación SI hay mensaje
    if (!isEditMode && ciMessage) {
      const ciField = baseFields.find(f => f.name === 'ci');
      if (ciField) {
        ciField.helpText = ciMessage;
      }
    }

    return baseFields;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cuerpo Técnico</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los miembros del cuerpo técnico (Persona + EqTecnico + Club).
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <div>
            <p className="text-red-800 font-medium">
              Error al cargar cuerpo técnico
            </p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchTecnicos}
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
      {clubError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          No se pudieron cargar los clubes: {clubError}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, CI, rol o club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo integrante
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Total Cuerpo Técnico</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : tecnicos.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {loading
              ? '...'
              : tecnicos.filter((t) => t.estado_eq === 'activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Clubs con técnicos</p>
          <p className="text-2xl font-bold text-indigo-600">
            {loading
              ? '...'
              : new Set(
                  tecnicos.map((t) => t.nombreClub).filter(Boolean)
                ).size}
          </p>
        </div>
      </div>

      <DataTable
        data={filteredTecnicos}
        columns={columns}
        itemsPerPage={10}
        loading={loading}
        /*onEdit={openEditModal}
        onDelete={handleDelete}*/
      />

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCiMessage('');
          setCiMessageType('');
        }}
        onSubmit={handleCreateTecnico}
        title="Agregar integrante del cuerpo técnico"
        size="5xl"
        fields={(updateFormData) => getTecnicoFields(false, updateFormData)}
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
          id_club: '',
          rol: 'DT',
          fecha_inicio: '',
          fecha_fin: '',
          observaciones: '',
        }}
      />

      {editingTecnico && (
        <FormModal
          key={`edit-eqtecnico-${editingTecnico.id_eqtecnico}-${Date.now()}`}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTecnico(null);
          }}
          onSubmit={handleEditTecnico}
          title="Editar integrante del cuerpo técnico"
          size="5xl"
          fields={getTecnicoFields(true)}
          initialData={{
            ci: editingTecnico.ci,
            nombre: editingTecnico.nombre,
            ap: editingTecnico.ap,
            am: editingTecnico.am,
            fnac: editingTecnico.fnac
              ? editingTecnico.fnac.substring(0, 10)
              : '',
            genero: editingTecnico.genero || '',
            id_nacionalidad: editingTecnico.id_nacionalidad
              ? String(editingTecnico.id_nacionalidad)
              : '',
            id_departamento: '',
            id_provincia_origen: editingTecnico.id_provincia_origen
              ? String(editingTecnico.id_provincia_origen)
              : '',
            id_club: editingTecnico.id_club
              ? String(editingTecnico.id_club)
              : '',
            rol: editingTecnico.rol,
            fecha_inicio: editingTecnico.fecha_inicio
              ? editingTecnico.fecha_inicio.substring(0, 10)
              : '',
            fecha_fin: editingTecnico.fecha_fin
              ? editingTecnico.fecha_fin.substring(0, 10)
              : '',
            observaciones: editingTecnico.observaciones || '',
          }}
        />
      )}
    </div>
  );
}
