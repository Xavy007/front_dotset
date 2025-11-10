// ===============================================
// ARCHIVO: src/pages/UsuariosPage.jsx (CORREGIDO)
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Shield, KeyRound, Trash2, Mail, Power
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

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

  // Nacionalidades
  const [nacionalidades, setNacionalidades] = useState([]);
  const [nacError, setNacError] = useState(null);

  const API_URL = 'http://localhost:8080/api/usuario';
  const API_URLPersona = 'http://localhost:8080/api/persona';
  const API_URLNacionalidad = 'http://localhost:8080/api/nacionalidad/';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // VALIDACIÓN DE CONTRASEÑA SEGURA
  // ===============================================
  const validarContraseñaSegura = (password) => {
    const errores = [];

    if (password.length < 8) {
      errores.push('Debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errores.push('Debe contener al menos una letra mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      errores.push('Debe contener al menos una letra minúscula');
    }

    if (!/[0-9]/.test(password)) {
      errores.push('Debe contener al menos un número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errores.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
    }

    if (/012|123|234|345|456|567|678|789|890/.test(password)) {
      errores.push('No debe contener números consecutivos (123, 456, etc.)');
    }

    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
      errores.push('No debe contener letras consecutivas (abc, def, etc.)');
    }

    if (/(.)\1{2,}/.test(password)) {
      errores.push('No debe contener más de 2 caracteres iguales seguidos (aaa, 111, etc.)');
    }

    const contraseñasComunes = [
      'password', 'password1', '12345678', 'qwerty', 
      'admin123', 'letmein', 'welcome', 'monkey123',
      'abc123', '123456789', 'password123'
    ];
    
    if (contraseñasComunes.some(común => password.toLowerCase().includes(común.toLowerCase()))) {
      errores.push('No debe contener contraseñas comunes o predecibles');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  };

  const pickArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.usuarios)) return data.usuarios;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  // ✅ NORMALIZAR GÉNERO - convierte cualquier formato a lowercase
  const normalizarGenero = (genero) => {
    if (!genero) return null;
    const gen = String(genero).trim().toLowerCase();
    // Validar que sea uno de los valores permitidos
    if (['masculino', 'femenino', 'otro'].includes(gen)) {
      return gen;
    }
    return null;
  };

  // Normaliza usuario
  const flattenUsuario = (u) => {
    const p = u.persona ?? {};
    const id_persona = u.persona_id ?? p.id;
    const ci = p.ci;
    const ap = p.ap;
    const am = p.am;
    const apellidos = [ap, am].filter(Boolean).join(' ').trim();
    const nombre = p.nombre ?? u.nombre ?? '';
    const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();

    // Nacionalidad - asegurar que sea número
    const id_nacionalidad = p.id_nacionalidad ?? u.id_nacionalidad ?? null;
    const pais = p.nacionalidad?.pais ?? u.nacionalidad?.pais ?? null;

    // ✅ GÉNERO - normalizado a lowercase
    const genero = normalizarGenero(p.genero ?? u.genero);

    // ESTADO (activo/inactivo)
    const estadoBooleano = u.estado ?? true; // Por defecto true
    const estadoVista = estadoBooleano ? 'activo' : 'inactivo';

    return {
      ...u,
      ci, id_persona, nombre, ap, am, apellidos, nombreCompleto,
      id_nacionalidad, pais,
      genero,
      estadoBooleano,      // ✅ Valor original booleano de la BD
      estadoVista,   
      persona: u.persona ?? null
    };
  };

  // Montaje
  useEffect(() => {
    fetchUsuarios();
    fetchNacionalidades();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, { method: 'GET', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al cargar los usuarios');
      const data = await response.json();
      console.log('Usuarios cargados:', data); // Debug
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

  // Helper nacionalidades
  const pickArrayN = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.nacionalidades)) return data.nacionalidades;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

const fetchNacionalidades = async () => {
  setNacError(null);
  try {
    const res = await fetch(API_URLNacionalidad, {
      method: 'GET',
      headers: { ...getAuthHeaders(), Accept: 'application/json' }
    });
    if (!res.ok) throw new Error('Error al cargar nacionalidades');
    const data = await res.json();
    const arr = pickArrayN(data);
    
    // ✅ Asegurar que los valores sean strings
    const opts = arr.map((n) => ({
      label: n.pais ?? `#${n.id_nacionalidad}`,
      value: String(n.id_nacionalidad), // Siempre como string
      raw: n,
    }));
    
    console.log('✅ Nacionalidades cargadas:', opts);
    setNacionalidades(opts);
  } catch (e) {
    console.error(e);
    setNacError(e.message || 'No se pudo cargar nacionalidades');
    setNacionalidades([]);
  }
};

  const filteredUsuarios = Array.isArray(usuarios)
    ? usuarios.filter(u => {
        const term = searchTerm.toLowerCase();
        return (u.nombreCompleto ?? '').toLowerCase().includes(term)
            || (u.email ?? '').toLowerCase().includes(term);
      })
    : [];

  // Abrir modales
  const openCreateModal = () => { setIsCreateModalOpen(true); };
  
  // ✅ MEJORADO: Abrir modal de edición con logs
  const openPersonaEdit = (usuario) => { 
    console.log('Editando usuario:', usuario); // Debug
    console.log('ID Nacionalidad:', usuario.id_nacionalidad); // Debug
    console.log('Género:', usuario.genero); // Debug
    setEditingUsuario(usuario); 
    setIsPersonaModalOpen(true); 
  };
  
  const openEmailEdit = (usuario) => { setEditingUsuario(usuario); setIsEmailModalOpen(true); };
  const openRoleEdit = (usuario) => { setEditingUsuario(usuario); setIsRoleModalOpen(true); };
  const openPasswordEdit = (usuario) => { setEditingUsuario(usuario); setIsPasswordModalOpen(true); };

 // ===============================================
// CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) - CORREGIDO
// ===============================================
const toggleEstado = async (usuario) => {
  // ✅ Usar estadoVista (que es el string 'activo'/'inactivo')
  const nuevoEstado = usuario.estadoVista === 'activo' ? 'inactivo' : 'activo';
  
  const mensaje = nuevoEstado === 'activo' 
    ? '¿Estás seguro que deseas activar este usuario?' 
    : '¿Estás seguro que deseas desactivar este usuario?';
  
  if (!window.confirm(mensaje)) return;
  
  // ✅ Debug para verificar qué se está enviando
  console.log('🔍 Datos del usuario:', {
    id: usuario.id,
    estadoOriginal: usuario.estado,
    estadoBooleano: usuario.estadoBooleano,
    estadoVista: usuario.estadoVista,
    nuevoEstado: nuevoEstado
  });
  
  try {
    const res = await fetch(`${API_URL}/${usuario.id}/estado`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: nuevoEstado }) // ✅ Envía 'activo' o 'inactivo'
    });

    // ✅ Debug de la respuesta
    const responseText = await res.text();
    console.log('📥 Respuesta del servidor:', responseText);

    if (!res.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      throw new Error(errorData.message || 'Error al cambiar el estado del usuario');
    }

    // ✅ Calcular el nuevo booleano
    const nuevoBooleano = nuevoEstado === 'activo';

    // ✅ Actualizar localmente con todos los valores
    setUsuarios(prev => prev.map(u => 
      u.id === usuario.id 
        ? { 
            ...u, 
            estado: nuevoBooleano,              // Booleano para la BD
            estadoBooleano: nuevoBooleano,      // Booleano explícito
            estadoVista: nuevoEstado            // String para la vista
          } 
        : u
    ));

    alert(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
  } catch (err) {
    console.error('❌ Error:', err);
    alert('Error al cambiar el estado: ' + err.message);
  }
};

  // Eliminar
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este usuario?')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al eliminar el usuario');
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el usuario: ' + err.message);
    }
  };

  // ===============================================
  // CREAR USUARIO COMPLETO (CON VALIDACIÓN)
  // ===============================================
  const handleCreateUsuario = async (formData) => {
    try {
      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('El email no es válido');
      }

      const validacionPassword = validarContraseñaSegura(formData.password);
      if (!validacionPassword.valida) {
        const mensajesError = validacionPassword.errores.join('\n• ');
        throw new Error(`La contraseña no cumple con los requisitos de seguridad:\n\n• ${mensajesError}`);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const bodyData = {
        ci: formData.ci,
        nombre: formData.nombre,
        ap: formData.ap,
        am: formData.am,
        fnac: formData.fnac,
        id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : undefined,
        genero: formData.genero || undefined,
        email: formData.email,
        password: formData.password,
        rol: formData.rol || 'secretario'
      };

      console.log('Creando usuario:', bodyData); // Debug

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
      alert('Usuario creado exitosamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Guardar PERSONA
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
        id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : undefined,
        genero: formData.genero || undefined
      };

      console.log('Actualizando persona:', bodyPersona); // Debug

      const res = await fetch(`${API_URLPersona}/${editingUsuario.id_persona}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPersona)
      });

      if (!res.ok) throw new Error('Error al actualizar datos de persona');

      setIsPersonaModalOpen(false);
      setEditingUsuario(null);
      await fetchUsuarios(); // Recargar para obtener datos actualizados
      alert('Datos personales actualizados correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Guardar EMAIL
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
      alert('Email actualizado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Guardar ROL
  const handleRoleSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id) throw new Error('Usuario no válido');

      const res = await fetch(`${API_URL}/${editingUsuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rol: formData.rol })
      });

      if (!res.ok) throw new Error('Error al actualizar rol');

      const result = await res.json();
      const updated = flattenUsuario(result.usuario || result.data || result);
      setUsuarios(prev => prev.map(u => (u.id === editingUsuario.id ? updated : u)));
      setIsRoleModalOpen(false);
      setEditingUsuario(null);
      alert('Rol actualizado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // GUARDAR PASSWORD (CON VALIDACIÓN)
  // ===============================================
  const handlePasswordSubmit = async (formData) => {
    try {
      if (!editingUsuario?.id) throw new Error('Usuario no válido');
      
      const validacionPassword = validarContraseñaSegura(formData.password);
      if (!validacionPassword.valida) {
        const mensajesError = validacionPassword.errores.join('\n• ');
        throw new Error(`La contraseña no cumple con los requisitos de seguridad:\n\n• ${mensajesError}`);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const res = await fetch(`${API_URL}/${editingUsuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: formData.password })
      });

      if (!res.ok) throw new Error('Error al actualizar la contraseña');

      setIsPasswordModalOpen(false);
      setEditingUsuario(null);
      alert('Contraseña actualizada correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Botón de acción con icono
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

  // ===============================================
  // COLUMNAS CON ESTADO ACTIVO/INACTIVO
  // ===============================================
  const columns = [
    { 
      key: 'ci', 
      label: 'CI', 
      render: (value, row) => <div className="font-medium text-gray-900">{value || row.ci || 'N/A'}</div> 
    },
    { 
      key: 'nombre', 
      label: 'Nombre', 
      render: (value, row) => <div className="font-medium text-gray-900">{value || row.nombre || 'N/A'}</div> 
    },
    { 
      key: 'ap', 
      label: 'Apellido Paterno', 
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div> 
    },
    { 
      key: 'am', 
      label: 'Apellido Materno', 
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
      key: 'genero',
      label: 'Género',
      render: (value) => <div className="text-gray-600 capitalize">{value || '—'}</div>
    },
    {
key: 'estadoVista', // ✅ Usar estadoVista
  label: 'Estado',
  render: (value, row) => {
    // ✅ Verificar el booleano
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
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <IconBtn title="Editar Persona" onClick={() => openPersonaEdit(row)}>
            <Pencil size={18} />
          </IconBtn>
          {/*<IconBtn title="Cambiar Email" onClick={() => openEmailEdit(row)}>
            <Mail size={18} />
          </IconBtn>*/}
          <IconBtn title="Cambiar Rol" onClick={() => openRoleEdit(row)}>
            <Shield size={18} />
          </IconBtn>
          <IconBtn title="Cambiar Contraseña" onClick={() => openPasswordEdit(row)}>
            <KeyRound size={18} />
          </IconBtn>
          <IconBtn 
            title={row.estadoVista === 'activo' ? 'Desactivar Usuario' : 'Activar Usuario'} // ✅ Usar estadoVista
            onClick={() => toggleEstado(row)}
          >
            <Power size={18} className={row.estadoVista === 'activo' ? 'text-green-600' : 'text-gray-400'} /> {/* ✅ Usar estadoVista */}
          </IconBtn>
          {/*<IconBtn title="Eliminar Usuario" onClick={() => handleDelete(row.id)} danger>
            <Trash2 size={18} />
          </IconBtn>*/}
        </div>
      )
    }
  ];

  // ===== Campos formularios =====
  // Crear usuario (Persona + Usuario)
  const createUsuarioFields = [
    { name: 'ci', label: 'CI', type: 'text', placeholder: 'Ej: 12345678', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Juan', required: true },
    { name: 'ap', label: 'Apellido Paterno', type: 'text', placeholder: 'Ej: García', required: true },
    { name: 'am', label: 'Apellido Materno', type: 'text', placeholder: 'Opcional', required: false },
    { name: 'fnac', label: 'Fecha de Nacimiento', type: 'date', required: false },
    {
      name: 'id_nacionalidad',
      label: 'Nacionalidad',
      type: 'select',
      required: false,
      placeholder: 'Seleccione una nacionalidad',
      options: nacionalidades,
    },
    {
      name: 'genero',
      label: 'Género',
      type: 'select',
      required: false,
      placeholder: 'Seleccione un género',
      options: [
        { label: 'Masculino', value: 'masculino' },
        { label: 'Femenino', value: 'femenino' },
        { label: 'Otro', value: 'otro' },
      ],
    },
    { name: 'email', label: 'Email (Usuario)', type: 'email', placeholder: 'usuario@ejemplo.com', required: true },
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
    { 
      name: 'password', 
      label: 'Contraseña', 
      type: 'password', 
      placeholder: 'Mínimo 8 caracteres', 
      required: true,
      helpText: 'Debe contener mayúsculas, minúsculas, números y caracteres especiales'
    },
    { 
      name: 'confirmPassword', 
      label: 'Confirmar Contraseña', 
      type: 'password', 
      placeholder: 'Repite la contraseña', 
      required: true 
    },
  ];

  // Editar persona
  const personaFields = [
    { name: 'ci', label: 'CI', type: 'text', placeholder: 'XXXXXXX', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Juan', required: true },
    { name: 'ap', label: 'Apellido Paterno', type: 'text', placeholder: 'Ej: García', required: true },
    { name: 'am', label: 'Apellido Materno', type: 'text', placeholder: 'Opcional', required: false },
    {
      name: 'id_nacionalidad',
      label: 'Nacionalidad',
      type: 'select',
      required: false,
      placeholder: 'Seleccione una nacionalidad',
      options: nacionalidades,
    },
    {
      name: 'genero',
      label: 'Género',
      type: 'select',
      required: false,
      placeholder: 'Seleccione un género',
      options: [
        { label: 'Masculino', value: 'masculino' },
        { label: 'Femenino', value: 'femenino' },
        { label: 'Otro', value: 'otro' },
      ],
    },
  ];

  // Cambiar email
  const emailFields = [
    { name: 'email', label: 'Nuevo Email', type: 'email', placeholder: 'usuario@ejemplo.com', required: true },
  ];

  // Cambiar rol
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

  // Cambiar password
  const passwordFields = [
    { 
      name: 'password', 
      label: 'Nueva contraseña', 
      type: 'password', 
      placeholder: 'Mínimo 8 caracteres', 
      required: true,
      helpText: 'Debe contener mayúsculas, minúsculas, números y caracteres especiales'
    },
    { 
      name: 'confirmPassword', 
      label: 'Confirmar contraseña', 
      type: 'password', 
      placeholder: 'Repite la contraseña', 
      required: true 
    },
  ];

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
          No se pudieron cargar las nacionalidades: {nacError}
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
      {/* ✅ Usar estadoVista */}
      {loading ? '...' : usuarios.filter(u => u.estadoVista === 'activo').length}
    </p>
  </div>
  <div className="bg-white rounded-lg shadow-sm p-4">
    <p className="text-gray-600 text-sm">Inactivos</p>
    <p className="text-2xl font-bold text-red-600">
      {/* ✅ Usar estadoVista */}
      {loading ? '...' : usuarios.filter(u => u.estadoVista === 'inactivo').length}
    </p>
  </div>
</div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      ) : (
        <DataTable
          data={filteredUsuarios}
          columns={columns}
          itemsPerPage={5}
        />
      )}

      {/* Crear usuario */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUsuario}
        title="Crear Nuevo Usuario"
        size="2xl"
        fields={createUsuarioFields}
        initialData={{
          ci: '',
          nombre: '',
          ap: '',
          am: '',
          fnac: '',
          id_nacionalidad: '',
          genero: '',
          email: '',
          rol: 'secretario',
          password: '',
          confirmPassword: ''
        }}
      />

      {/* ✅ EDITAR PERSONA - CORREGIDO */}
      <FormModal
        key={`persona-${editingUsuario?.id || 'new'}`}
        isOpen={isPersonaModalOpen}
        onClose={() => { setIsPersonaModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handlePersonaSubmit}
        title="Editar Datos Personales"
        fields={personaFields}
        initialData={editingUsuario ? {
          ci: editingUsuario.ci ?? '',
          nombre: editingUsuario.nombre ?? '',
          ap: editingUsuario.ap ?? '',
          am: editingUsuario.am ?? '',
          id_nacionalidad: editingUsuario.id_nacionalidad != null 
            ? String(editingUsuario.id_nacionalidad) 
            : '',
          genero: editingUsuario.genero 
            ? String(editingUsuario.genero).toLowerCase().trim()
      : '',
        } : {}}
      />

      {/* Cambiar email */}
      <FormModal
        isOpen={isEmailModalOpen}
        onClose={() => { setIsEmailModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handleEmailSubmit}
        title="Cambiar Email"
        fields={emailFields}
        initialData={editingUsuario ? { email: editingUsuario.email ?? '' } : {}}
      />

      {/* Cambiar rol */}
      <FormModal
        isOpen={isRoleModalOpen}
        onClose={() => { setIsRoleModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handleRoleSubmit}
        title="Cambiar Rol de Usuario"
        fields={roleFields}
        initialData={editingUsuario ? { rol: editingUsuario.rol ?? 'secretario' } : {}}
      />

      {/* Cambiar contraseña */}
      <FormModal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setEditingUsuario(null); }}
        onSubmit={handlePasswordSubmit}
        title="Cambiar Contraseña"
        fields={passwordFields}
        initialData={{ password: '', confirmPassword: '' }}
      />
    </div>
  );
}