// ===============================================
// ARCHIVO: src/pages/UsuariosPage.jsx (LIMPIO + CLUBES)
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Shield, KeyRound, Trash2, Mail, Power
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import { toast } from 'sonner';
import { API_BASE } from '../services/api.config';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nacionalidades, setNacionalidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);

  const [nacError, setNacError] = useState(null);
  const [depError, setDepError] = useState(null);
  const [provError, setProvError] = useState(null);

  // 👉 NUEVO: estado para clubes
  const [clubs, setClubs] = useState([]);
  const [clubError, setClubError] = useState(null);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [usuarioClub, setUsuarioClub] = useState(null);

  const API_URL = `${API_BASE}/usuario`;
  const API_URLPersona = `${API_BASE}/persona`;
  const API_URLNacionalidad = `${API_BASE}/nacionalidad/`;
  const API_URLDepartamento = `${API_BASE}/departamentos`;
  const API_URLProvincia = `${API_BASE}/provincias`;
  const API_URL_CLUB = `${API_BASE}/club`; // 👉 NUEVO, ajusta si es distinto
  const API_URL_c = API_BASE;
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const validarContraseñaSegura = (password) => {
    const errores = [];
    if (password.length < 8) errores.push('Debe tener al menos 8 caracteres');
    if (!/[A-Z]/.test(password)) errores.push('Debe contener mayúscula');
    if (!/[a-z]/.test(password)) errores.push('Debe contener minúscula');
    if (!/[0-9]/.test(password)) errores.push('Debe contener número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errores.push('Debe contener carácter especial');
    
    return { valida: errores.length === 0, errores };
  };

  const pickArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.usuarios)) return data.usuarios;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

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

  // 👉 NUEVO: helper para clubs
  const pickArrayClubs = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.clubs)) return data.clubs;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const normalizarGenero = (genero) => {
    if (!genero) return '';
    const gen = String(genero).trim().toLowerCase();
    return ['masculino', 'femenino', 'otro'].includes(gen) ? gen : '';
  };

  const formatDateForInput = (value) => {
    console.log('🔍 formatDateForInput - valor recibido:', value, 'tipo:', typeof value);
    
    if (!value) return '';
    
    if (typeof value === 'string' && value.includes('T')) {
      const resultado = value.split('T')[0];
      console.log('✅ formatDateForInput - resultado:', resultado);
      return resultado;
    }
    
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      console.log('✅ formatDateForInput - ya estaba correcto:', value);
      return value;
    }
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.error('❌ formatDateForInput - fecha inválida');
        return '';
      }
      
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const resultado = `${year}-${month}-${day}`;
      
      console.log('✅ formatDateForInput - convertido desde Date:', resultado);
      return resultado;
    } catch (e) {
      console.error('❌ formatDateForInput - error:', e);
      return '';
    }
  };

  const flattenUsuario = (u) => {
    const p = u.Persona ?? u.persona ?? {};
    
    const id_persona = u.persona_id ?? p.id_persona ?? p.id;
    const ci = p.ci ?? '';
    const ap = p.ap ?? '';
    const am = p.am ?? '';
    const apellidos = [ap, am].filter(Boolean).join(' ').trim();
    const nombre = p.nombre ?? u.nombre ?? '';
    const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();

    const id_nacionalidad = p.id_nacionalidad ?? u.id_nacionalidad ?? null;
    const pais = p.nacionalidad?.pais ?? p.Nacionalidad?.pais ?? u.nacionalidad?.pais ?? null;

    const id_departamento = p.id_departamento ?? null;
    const nombreDepartamento = p.departamento?.nombre ?? p.Departamento?.nombre ?? null;

    const id_provincia_origen = p.id_provincia_origen ?? null;
    const nombreProvincia = p.provinciaOrigen?.nombre ?? p.ProvinciaOrigen?.nombre ?? p.Provincia?.nombre ?? null;

    const fnac = formatDateForInput(p.fnac);
    const genero = normalizarGenero(p.genero ?? u.genero);
    
    const estadoBooleano = u.estado ?? true;
    const estadoVista = estadoBooleano ? 'activo' : 'inactivo';

    // 👉 NUEVO: si backend ya manda club, mapeamos id_club
    const id_club = u.id_club ?? u.club_id ?? null;

    return {
      ...u,
      ci,
      id_persona,
      nombre,
      ap,
      am,
      apellidos,
      nombreCompleto,
      id_nacionalidad,
      pais,
      id_departamento,
      nombreDepartamento,
      id_provincia_origen,
      nombreProvincia,
      fnac,
      genero,
      estadoBooleano,
      estadoVista,
      id_club,
      persona: p
    };
  };

  useEffect(() => {
    fetchUsuarios();
    fetchNacionalidades();
    fetchDepartamentos();
    fetchProvincias();
    fetchClubs(); // 👉 NUEVO
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, { method: 'GET', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al cargar los usuarios');
      const data = await response.json();
      const arr = pickArray(data);
      setUsuarios(arr.map(flattenUsuario));
    } catch (err) {
      console.error(err);
      setError(err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNacionalidades = async () => {
    setNacError(null);
    try {
      const res = await fetch(API_URLNacionalidad, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      const arr = pickArrayN(data);
      const opts = arr.map((n) => ({
        label: n.pais ?? `#${n.id_nacionalidad}`,
        value: String(n.id_nacionalidad),
      }));
      setNacionalidades(opts);
    } catch (e) {
      console.error('❌ Error fetchNacionalidades:', e);
      setNacError(e.message);
      setNacionalidades([]);
    }
  };

  const fetchDepartamentos = async () => {
    setDepError(null);
    try {
      const res = await fetch(API_URLDepartamento, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      const arr = pickArrayD(data);
      const opts = arr.map((d) => ({
        label: d.nombre ?? `#${d.id_departamento}`,
        value: String(d.id_departamento),
        id_nacionalidad: d.id_nacionalidad,
      }));
      setDepartamentos(opts);
    } catch (e) {
      console.error('❌ Error fetchDepartamentos:', e);
      setDepError(e.message);
      setDepartamentos([]);
    }
  };

  const fetchProvincias = async () => {
    setProvError(null);
    try {
      const res = await fetch(API_URLProvincia, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      const arr = pickArrayP(data);
      const opts = arr.map((p) => ({
        label: p.nombre,
        value: String(p.id_provincia),
        id_departamento: p.id_departamento,
      }));
      setProvincias(opts);
    } catch (e) {
      console.error('❌ Error fetchProvincias:', e);
      setProvError(e.message);
      setProvincias([]);
    }
  };

  // 👉 NUEVO: fetch de clubes
  const fetchClubs = async () => {
    setClubError(null);
    try {
      const res = await fetch(API_URL_CLUB, {
        method: 'GET',
        headers: { ...getAuthHeaders(), Accept: 'application/json' }
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
      console.error('❌ Error fetchClubs:', e);
      setClubError(e.message);
      setClubs([]);
    }
  };

  const openCreateModal = () => { 
    setIsCreateModalOpen(true);
  };
  
  // openPersonaEdit con fetch individual
  const openPersonaEdit = async (usuario) => { 
    try {
      setLoading(true);
      
      console.log('═══════════════════════════════════════════════════');
      console.log('🔍 FETCH INDIVIDUAL - Obteniendo usuario del backend...');
      console.log('═══════════════════════════════════════════════════');
      
      const res = await fetch(`${API_URL}/${usuario.id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
      }

      const response = await res.json();
      
      console.log('📥 RESPUESTA DEL BACKEND:');
      console.log(JSON.stringify(response, null, 2));
      console.log('═══════════════════════════════════════════════════');
      
      const usuarioCompleto = response.data || response;
      const usuarioProcesado = flattenUsuario(usuarioCompleto);
      
      console.log('✅ USUARIO PROCESADO (para initialData):');
      console.log(JSON.stringify(usuarioProcesado, null, 2));
      console.log('═══════════════════════════════════════════════════');
      
      setEditingUsuario(usuarioProcesado); 
      setIsPersonaModalOpen(true);
    } catch (err) {
      console.error('❌ Error al cargar usuario:', err);
      toast.error(err.message || 'Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };
  
  const openEmailEdit = (usuario) => { setEditingUsuario(usuario); setIsEmailModalOpen(true); };
  const openRoleEdit = (usuario) => { setEditingUsuario(usuario); setIsRoleModalOpen(true); };
  const openPasswordEdit = (usuario) => { setEditingUsuario(usuario); setIsPasswordModalOpen(true); };

  // 👉 NUEVO: abrir modal de club
  const openClubModal = (usuario) => {
    setUsuarioClub(usuario);
    setIsClubModalOpen(true);
  };

  const toggleEstado = async (usuario) => {
    const nuevoEstado = usuario.estadoVista === 'activo' ? 'inactivo' : 'activo';
    const mensaje = nuevoEstado === 'activo' 
      ? '¿Estás seguro que deseas activar este usuario?' 
      : '¿Estás seguro que deseas desactivar este usuario?';
    
    if (!window.confirm(mensaje)) return;
    
    try {
      const res = await fetch(`${API_URL}/${usuario.id}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!res.ok) throw new Error('Error al cambiar estado');

      const nuevoBooleano = nuevoEstado === 'activo';
      setUsuarios(prev => prev.map(u => 
        u.id === usuario.id 
          ? { 
              ...u, 
              estado: nuevoBooleano,
              estadoBooleano: nuevoBooleano,
              estadoVista: nuevoEstado
            } 
          : u
      ));

      toast.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este usuario?')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al eliminar');
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleCreateUsuario = async (formData) => {
    try {
      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('El email no es válido');
      }

      const validacionPassword = validarContraseñaSegura(formData.password);
      if (!validacionPassword.valida) {
        throw new Error(`Contraseña: ${validacionPassword.errores.join(', ')}`);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const bodyData = {
        persona: {
          ci: formData.ci,
          nombre: formData.nombre,
          ap: formData.ap,
          am: formData.am,
          fnac: formData.fnac || undefined,
          id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : undefined,
          id_departamento: formData.id_departamento ? Number(formData.id_departamento) : undefined,
          id_provincia_origen: formData.id_provincia_origen ? Number(formData.id_provincia_origen) : undefined,
          genero: formData.genero || undefined,
        },
        usuario: {
          email: formData.email,
          password: formData.password,
          rol: formData.rol || 'secretario',
        }
      };

      const res = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        let msg = 'Error al crear usuario';
        try {
          const errorData = await res.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsCreateModalOpen(false);
      await fetchUsuarios();
      toast.success('Usuario creado exitosamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePersonaSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id_persona) {
        throw new Error('No se puede editar: persona no encontrada');
      }

      const bodyPersona = {
        ci: formData.ci,
        nombre: formData.nombre,
        ap: formData.ap,
        am: formData.am,
        fnac: formData.fnac || undefined,
        id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : undefined,
        id_departamento: formData.id_departamento ? Number(formData.id_departamento) : undefined,
        id_provincia_origen: formData.id_provincia_origen ? Number(formData.id_provincia_origen) : undefined,
        genero: formData.genero || undefined
      };

      const res = await fetch(`${API_URLPersona}/${editingUsuario.id_persona}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPersona)
      });

      if (!res.ok) throw new Error('Error al actualizar');

      setIsPersonaModalOpen(false);
      setEditingUsuario(null);
      await fetchUsuarios();
      toast.success('Datos personales actualizados correctamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEmailSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id) throw new Error('Usuario no válido');
      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('El email no es válido');
      }

      const res = await fetch(`${API_URL}/${editingUsuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: formData.email })
      });

      if (!res.ok) throw new Error('Error al actualizar email');

      const result = await res.json();
      const updated = flattenUsuario(result.usuario || result.data || result);
      setUsuarios(prev => prev.map(u => (u.id === editingUsuario.id ? updated : u)));
      setIsEmailModalOpen(false);
      setEditingUsuario(null);
      toast.success('Email actualizado correctamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id) throw new Error('Usuario no válido');

      const res = await fetch(`${API_URL}/${editingUsuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rol: formData.rol })
      });

      if (!res.ok) throw new Error('Error al actualizar');

      const result = await res.json();
      const updated = flattenUsuario(result.usuario || result.data || result);
      setUsuarios(prev => prev.map(u => (u.id === editingUsuario.id ? updated : u)));
      setIsRoleModalOpen(false);
      setEditingUsuario(null);
      toast.success('Rol actualizado correctamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id) throw new Error('Usuario no válido');
      
      const validacionPassword = validarContraseñaSegura(formData.password);
      if (!validacionPassword.valida) {
        throw new Error(`Contraseña: ${validacionPassword.errores.join(', ')}`);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const res = await fetch(`${API_URL}/${editingUsuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: formData.password })
      });

      if (!res.ok) throw new Error('Error al actualizar');

      setIsPasswordModalOpen(false);
      setEditingUsuario(null);
      toast.success('Contraseña actualizada correctamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 👉 NUEVO: submit asignar club
const handleClubSubmit = async (formData) => {
  try {
    // ✅ Cambiar editingUsuario por usuarioClub
    if (!usuarioClub?.id) throw new Error('Usuario no válido');
      const rolMap = {
      presidenteclub: 'presidente',
      representante: 'representante'
    }; 
    const rol=rolMap[usuarioClub.rol];
    const body = {
      id_usuario: Number(usuarioClub.id),
      id_club: formData.id_club ? Number(formData.id_club) : null,
      rol_en_club: rol || 'representante',
      fecha_inicio: new Date()
    };

    const res = await fetch(`${API_URL_c}/clubusuario`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Error al asignar club');

    setIsClubModalOpen(false);
    setUsuarioClub(null);
    await fetchUsuarios();
    toast.success('Club asignado correctamente');
  } catch (err) {
    toast.error(err.message);
  }
};

  const IconBtn = ({ title, onClick, children, danger }) => (
    <button
      title={title}
      onClick={onClick}
      className={
        `p-2 rounded-md border transition-colors
         ${danger ? 'text-red-600 hover:bg-red-50 border-red-200' : 'hover:bg-gray-50 border-gray-200'}`
      }
    >
      {children}
    </button>
  );

  const columns = [
    { 
      key: 'ci', 
      label: 'CI', 
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div> 
    },
    { 
      key: 'nombre', 
      label: 'Nombre', 
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div> 
    },
    { 
      key: 'ap', 
      label: 'Apellido Paterno', 
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div> 
    },
    { 
      key: 'email', 
      label: 'Email', 
      render: (value) => <div className="text-gray-600">{value || 'N/A'}</div> 
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (value) => (
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm w-fit">
          {value || 'Usuario'}
        </div>
      )
    },
    {
      key: 'nombreDepartamento',
      label: 'Departamento',
      render: (value) => <div className="text-gray-600">{value || '—'}</div>
    },
    {
      key: 'nombreProvincia',
      label: 'Provincia',
      render: (value) => <div className="text-gray-600">{value || '—'}</div>
    },
    {
      key: 'estadoVista',
      label: 'Estado',
      render: (value, row) => {
        const esActivo = row.estadoBooleano === true || row.estado === true;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${esActivo ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${esActivo ? 'text-green-700' : 'text-red-700'}`}>
              {esActivo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_v, row) => {
        const puedeAsignarClub =
          row.rol === 'representante' || row.rol === 'presidenteclub';
        return (
          <div className="flex items-center gap-2">
            <IconBtn title="Editar Persona" onClick={() => openPersonaEdit(row)}>
              <Pencil size={18} />
            </IconBtn>
            <IconBtn title="Cambiar Rol" onClick={() => openRoleEdit(row)}>
              <Shield size={18} />
            </IconBtn>
            <IconBtn title="Cambiar Contraseña" onClick={() => openPasswordEdit(row)}>
              <KeyRound size={18} />
            </IconBtn>

            {puedeAsignarClub && (
              <IconBtn title="Asignar Club" onClick={() => openClubModal(row)}>
                <Users size={18} />
              </IconBtn>
            )}

            <IconBtn 
              title={row.estadoVista === 'activo' ? 'Desactivar Usuario' : 'Activar Usuario'}
              onClick={() => toggleEstado(row)}
            >
              <Power size={18} className={row.estadoVista === 'activo' ? 'text-green-600' : 'text-gray-400'} />
            </IconBtn>
          </div>
        );
      }
    }
  ];

  const getCreateUsuarioFields = () => {
    return [
      { name: 'ci', label: 'CI', type: 'text', placeholder: 'Ej: 12345678', required: true, cols: 3 },
      { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Juan', required: true, cols: 3 },
      { name: 'ap', label: 'Apellido Paterno', type: 'text', placeholder: 'Ej: García', required: true, cols: 3 },
      { name: 'am', label: 'Apellido Materno', type: 'text', placeholder: 'Opcional', required: false, cols: 3 },
      { name: 'fnac', label: 'Fecha de Nacimiento', type: 'date', required: false, cols: 2 },
      {
        name: 'genero',
        label: 'Género',
        type: 'select',
        required: false,
        placeholder: 'Seleccione un género',
        cols: 2,
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
        resetChildren: ['id_departamento', 'id_provincia_origen'],
        cols: 2,
        options: nacionalidades,
      },
      {
        name: "id_departamento",
        label: "Departamento",
        type: "select",
        placeholder: 'Seleccione un departamento',
        resetChildren: ['id_provincia_origen'],
        cols: 2,
        getDynamicOptions: (formData) => {
          const nacionalidadId = formData.id_nacionalidad;
          if (!nacionalidadId) return departamentos;
          return departamentos.filter(
            d => String(d.id_nacionalidad) === String(nacionalidadId)
          );
        },
        options: departamentos,
      },
      {
        name: "id_provincia_origen",
        label: "Provincia",
        type: "select",
        placeholder: 'Seleccione una provincia',
        cols: 2,
        getDynamicOptions: (formData) => {
          const departamentoId = formData.id_departamento;
          if (!departamentoId) return provincias;
          return provincias.filter(
            p => String(p.id_departamento) === String(departamentoId)
          );
        },
        options: provincias,
      },
      { name: 'email', label: 'Email (Usuario)', type: 'email', placeholder: 'usuario@ejemplo.com', required: true, cols: 2 },
      {
        name: 'rol',
        label: 'Rol',
        type: 'select',
        required: true,
        cols: 2,
        options: [
          { label: 'Secretario', value: 'secretario' },
          { label: 'Administrador', value: 'admin' },
          { label: 'Presidente', value: 'presidente' },
          { label: 'Presidente de Club', value: 'presidenteclub' },
          { label: 'Representante', value: 'representante' },
          { label: 'Planillero', value: 'juez' }
        ]
      },
      { 
        name: 'password', 
        label: 'Contraseña', 
        type: 'password', 
        placeholder: 'Mínimo 8 caracteres', 
        required: true,
        cols: 2,
      },
      { 
        name: 'confirmPassword', 
        label: 'Confirmar Contraseña', 
        type: 'password', 
        placeholder: 'Repite la contraseña', 
        required: true,
        cols: 2,
      },
    ];
  };

  const getPersonaFields = () => {
    return [
      { name: 'ci', label: 'CI', type: 'text', placeholder: 'XXXXXXX', required: true, cols: 1 },
      { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Juan', required: true, cols: 1 },
      { name: 'ap', label: 'Apellido Paterno', type: 'text', placeholder: 'Ej: García', required: true, cols: 1 },
      { name: 'am', label: 'Apellido Materno', type: 'text', placeholder: 'Opcional', required: false, cols: 1 },
      { name: 'fnac', label: 'Fecha de Nacimiento', type: 'date', required: false, cols: 1 },
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
          { label: 'Otro', value: 'otro' },
        ],
      },
      {
        name: 'id_nacionalidad',
        label: 'Nacionalidad',
        type: 'select',
        required: false,
        placeholder: 'Seleccione una nacionalidad',
        resetChildren: ['id_departamento', 'id_provincia_origen'],
        cols: 1,
        options: nacionalidades,
      },
      {
        name: "id_departamento",
        label: "Departamento",
        type: "select",
        placeholder: 'Seleccione un departamento',
        resetChildren: ['id_provincia_origen'],
        cols: 1,
        getDynamicOptions: (formData) => {
          const nacionalidadId = formData.id_nacionalidad;
          if (!nacionalidadId) return departamentos;
          return departamentos.filter(
            d => String(d.id_nacionalidad) === String(nacionalidadId)
          );
        },
        options: departamentos,
      },
      {
        name: "id_provincia_origen",
        label: "Provincia",
        type: "select",
        placeholder: 'Seleccione una provincia',
        cols: 1,
        getDynamicOptions: (formData) => {
          const departamentoId = formData.id_departamento;
          if (!departamentoId) return provincias;
          return provincias.filter(
            p => String(p.id_departamento) === String(departamentoId)
          );
        },
        options: provincias,
      },
    ];
  };

  const getInitialDataForEdit = (usuario) => {
    if (!usuario) return {};
    
    const p = usuario.persona ?? usuario.Persona ?? {};
    const fnacValue = usuario.fnac ?? p.fnac ?? '';

    const data = {
      ci: usuario.ci ?? p.ci ?? '',
      nombre: usuario.nombre ?? p.nombre ?? '',
      ap: usuario.ap ?? p.ap ?? '',
      am: usuario.am ?? p.am ?? '',
      fnac: formatDateForInput(fnacValue),
      id_nacionalidad:
        usuario.id_nacionalidad != null
          ? String(usuario.id_nacionalidad)
          : (p.id_nacionalidad != null ? String(p.id_nacionalidad) : ''),
      id_departamento:
        usuario.id_departamento != null
          ? String(usuario.id_departamento)
          : (p.id_departamento != null ? String(p.id_departamento) : ''),
      id_provincia_origen:
        usuario.id_provincia_origen != null
          ? String(usuario.id_provincia_origen)
          : (p.id_provincia_origen != null ? String(p.id_provincia_origen) : ''),
      genero: normalizarGenero(usuario.genero ?? p.genero),
    };

    return data;
  };

  const emailFields = [
    { name: 'email', label: 'Nuevo Email', type: 'email', placeholder: 'usuario@ejemplo.com', required: true },
  ];

  const roleFields = [
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { label: 'Secretario', value: 'secretario' },
        { label: 'Administrador', value: 'admin' },
        { label: 'Presidente', value: 'presidente' },
        { label: 'Presidente de Club', value: 'presidenteclub' },
        { label: 'Representante', value: 'representante' },
        { label: 'Planillero', value: 'juez' }
      ]
    },
  ];

  const passwordFields = [
    { 
      name: 'password', 
      label: 'Nueva contraseña', 
      type: 'password', 
      placeholder: 'Mínimo 8 caracteres', 
      required: true,
    },
    { 
      name: 'confirmPassword', 
      label: 'Confirmar contraseña', 
      type: 'password', 
      placeholder: 'Repite la contraseña', 
      required: true 
    },
  ];

  // 👉 NUEVO: campos para asignar club
  const clubFields = [
    {
      name: 'id_club',
      label: 'Club',
      type: 'select',
      required: true,
      placeholder: 'Seleccione un club',
      options: clubs,
    },
  ];

  const filteredUsuarios = Array.isArray(usuarios)
    ? usuarios.filter(u => {
        const term = searchTerm.toLowerCase();
        return (u.nombreCompleto ?? '').toLowerCase().includes(term)
            || (u.email ?? '').toLowerCase().includes(term);
      })
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-600 mt-2">Gestiona los usuarios del sistema.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error al cargar usuarios</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchUsuarios}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
          Reintentar
          </button>
        </div>
      )}

      {nacError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          ⚠️ No se pudieron cargar las nacionalidades: {nacError}
        </div>
      )}
      {depError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          ⚠️ No se pudieron cargar los departamentos: {depError}
        </div>
      )}
      {provError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          ⚠️ No se pudieron cargar las provincias: {provError}
        </div>
      )}
      {clubError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          ⚠️ No se pudieron cargar los clubes: {clubError}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar usuario (nombre o email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : usuarios.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? '...' : usuarios.filter(u => u.estadoVista === 'activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">
            {loading ? '...' : usuarios.filter(u => u.estadoVista === 'inactivo').length}
          </p>
        </div>
      </div>

      <DataTable
        data={filteredUsuarios}
        columns={columns}
        itemsPerPage={5}
        loading={loading}
      />

      {/* Crear usuario */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUsuario}
        title="Crear Nuevo Usuario"
        size="7xl"
        fields={getCreateUsuarioFields()}
        initialData={{
          ci: '',
          nombre: '',
          ap: '',
          am: '',
          fnac: '',
          id_nacionalidad: '',
          id_departamento: '',
          id_provincia_origen: '',
          genero: '',
          email: '',
          rol: 'secretario',
          password: '',
          confirmPassword: ''
        }}
      />

      {/* Editar persona */}
      <FormModal
        key={`persona-${editingUsuario?.id || 'new'}`}
        isOpen={isPersonaModalOpen}
        onClose={() => { setIsPersonaModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handlePersonaSubmit}
        title="Editar Datos Personales"
        size="7xl"
        fields={getPersonaFields()}
        initialData={getInitialDataForEdit(editingUsuario)}
      />

      {/* Cambiar email */}
      <FormModal
        isOpen={isEmailModalOpen}
        onClose={() => { setIsEmailModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handleEmailSubmit}
        title="Cambiar Email"
        fields={emailFields}
        size="2xl"
        initialData={editingUsuario ? { email: editingUsuario.email ?? '' } : {}}
      />

      {/* Cambiar rol */}
      <FormModal
        isOpen={isRoleModalOpen}
        onClose={() => { setIsRoleModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handleRoleSubmit}
        title="Cambiar Rol de Usuario"
        fields={roleFields}
        size="2xl"
        initialData={editingUsuario ? { rol: editingUsuario.rol ?? 'secretario' } : {}}
      />

      {/* Cambiar contraseña */}
      <FormModal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handlePasswordSubmit}
        title="Cambiar Contraseña"
        fields={passwordFields}
        size="2xl"
        initialData={{ password: '', confirmPassword: '' }}
      />

      {/* 👉 NUEVO: Asignar club */}
      <FormModal
        key={`club-${usuarioClub?.id || 'new'}`}
        isOpen={isClubModalOpen}
        onClose={() => { setIsClubModalOpen(false); setUsuarioClub(null); }}
        onSubmit={handleClubSubmit}
        title="Asignar club al usuario"
        size="2xl"
        fields={clubFields}
        initialData={usuarioClub ? {
          id_club: usuarioClub.id_club ? String(usuarioClub.id_club) : '',
          id_usuario: usuarioClub.id_usuario ? String(usuarioClub.id_usuario) : (editingUsuario?.id ? String(editingUsuario.id) : '')
        } : {
          id_usuario: editingUsuario?.id ? String(editingUsuario.id) : ''
        }}

      />
    </div>
  );
}
