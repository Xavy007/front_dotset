// ===============================================
// ARCHIVO: src/pages/JugadoresPage.jsx (CON FORMMODAL GESTIÓN)
// ===============================================

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Trash2, CreditCard, Clock, CheckCircle, XCircle, Bell, UserPlus, Printer
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import InscripcionParticipacionModal from '../components/InscripcionParticipacionModal';

export function JugadoresPage() {
  const [jugadores, setJugadores] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJugador, setEditingJugador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nacionalidades, setNacionalidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [gestiones, setGestiones] = useState([]);

  const [nacError, setNacError] = useState(null);
  const [depError, setDepError] = useState(null);
  const [provError, setProvError] = useState(null);
  const [clubError, setClubError] = useState(null);

  const [carnetsPendientes, setCarnetsPendientes] = useState([]);
  const [isCarnetModalOpen, setIsCarnetModalOpen] = useState(false);
  const [selectedCarnet, setSelectedCarnet] = useState(null);

  // ✅ NUEVOS ESTADOS PARA MODAL DE GESTIÓN
  const [isGestionModalOpen, setIsGestionModalOpen] = useState(false);
  const [jugadorParaCarnet, setJugadorParaCarnet] = useState(null);
  const [accionCarnet, setAccionCarnet] = useState(null); // 'crear' o 'solicitar'

  // ✅ ESTADO PARA MODAL DE INSCRIPCIÓN EN EQUIPOS
  const [isInscripcionModalOpen, setIsInscripcionModalOpen] = useState(false);
  const [jugadorParaInscripcion, setJugadorParaInscripcion] = useState(null);


  const [categorias, setCategorias] = useState([]);
  const [categoriasCompletas, setCategoriasCompletas] = useState([]); // Guardar datos completos con edad_inicio y edad_limite
  const [catError, setCatError] = useState(null);

  const getUsuarioLogueado = () => {
    try {
      const raw = sessionStorage.getItem('usuario');
      if (!raw) return {};

      const parsed = JSON.parse(raw);
      console.log(parsed)
      if (parsed.rol) return parsed;
      if (parsed.usuario) return parsed.usuario;
      if (parsed.data?.usuario) return parsed.data.usuario;
      

      return parsed;
    } catch {
      return {};
    }
  };

  const usuario = getUsuarioLogueado();
  const rolUsuario = usuario.rol || '';
  const usuarioId = usuario.id_usuario || usuario.id;   // 👈 aquí está el ID

  const esAdminOSecretario = ['admin', 'secretario', 'presidente'].includes(rolUsuario);
  const esClubRepresentante = ['presidenteclub', 'representante'].includes(rolUsuario);

  const API_URL_JUGADOR = 'http://localhost:8080/api/jugadores';
  const API_URLPersona = 'http://localhost:8080/api/persona';
  const API_URLNacionalidad = 'http://localhost:8080/api/nacionalidad/';
  const API_URLDepartamento = 'http://localhost:8080/api/departamentos';
  const API_URLProvincia = 'http://localhost:8080/api/provincias';
  const API_URL_CLUB = 'http://localhost:8080/api/club';
  const API_URL_CARNET = 'http://localhost:8080/api/carnets';
  const API_URL_GESTION = 'http://localhost:8080/api/gestion';
  const API_URL_CATEGORIA = 'http://localhost:8080/api/categoria'; // ajusta si cambia

  
  
const pickArrayCategorias = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categorias)) return data.categorias;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const fetchCategorias = async () => {
  setCatError(null);
  try {
    const res = await fetch(API_URL_CATEGORIA, {
      method: 'GET',
      headers: { ...getAuthHeaders(), Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Error al cargar categorías');
    const data = await res.json();
    const arr = pickArrayCategorias(data);

    // Guardar categorías completas con todos los datos
    setCategoriasCompletas(arr);

    // Opciones para select (todas las categorías)
    const opts = arr.map((c) => ({
      label: c.nombre ?? `Categoría #${c.id_categoria ?? c.id}`,
      value: String(c.id_categoria ?? c.id),
      edad_inicio: c.edad_inicio,
      edad_limite: c.edad_limite,
      color: c.color || '#3B82F6', // Color HEX de la categoría (default azul)
    }));
    setCategorias(opts);
  } catch (e) {
    console.error('❌ Error fetchCategorias:', e);
    setCatError(e.message);
    setCategorias([]);
    setCategoriasCompletas([]);
  }
};
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ✅ Función para calcular edad del jugador
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // ✅ Función para obtener categorías elegibles según edad del jugador
  const obtenerCategoriasElegibles = (jugador) => {
    const edad = calcularEdad(jugador.fnac || jugador.persona?.fnac);

    if (edad === null || categorias.length === 0) {
      console.warn('⚠️ No se pudo calcular edad o no hay categorías disponibles');
      return categorias; // Devolver todas si no se puede calcular
    }

    console.log(`📅 Edad del jugador: ${edad} años`);

    // Ordenar categorías por edad_inicio ascendente
    const categoriasOrdenadas = [...categorias].sort((a, b) =>
      (a.edad_inicio || 0) - (b.edad_inicio || 0)
    );

    // Encontrar la categoría natural del jugador (donde su edad está dentro del rango)
    const indiceCategoriaBase = categoriasOrdenadas.findIndex(cat => {
      const edadInicio = cat.edad_inicio || 0;
      const edadLimite = cat.edad_limite || 999;
      return edad >= edadInicio && edad <= edadLimite;
    });

    if (indiceCategoriaBase === -1) {
      console.warn('⚠️ No se encontró categoría base para edad', edad);
      return categorias; // Devolver todas si no hay categoría base
    }

    const categoriaBase = categoriasOrdenadas[indiceCategoriaBase];
    console.log(`✅ Categoría base: ${categoriaBase.label} (${categoriaBase.edad_inicio}-${categoriaBase.edad_limite} años)`);

    // Incluir categoría base + hasta 3 categorías superiores
    const categoriasElegibles = categoriasOrdenadas.slice(
      indiceCategoriaBase,
      indiceCategoriaBase + 4 // Base + 3 superiores = 4 categorías
    );

    console.log(`📋 Categorías elegibles (${categoriasElegibles.length}):`,
      categoriasElegibles.map(c => c.label).join(', ')
    );

    return categoriasElegibles;
  };

  const pickArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.jugadores)) return data.jugadores;
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

  const pickArrayClubs = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.clubs)) return data.clubs;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const pickArrayCarnets = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.carnets)) return data.carnets;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const pickArrayGestiones = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.gestiones)) return data.gestiones;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const normalizarGenero = (genero) => {
    if (!genero) return null;
    const gen = String(genero).trim().toLowerCase();
    return ['masculino', 'femenino', 'otro'].includes(gen) ? gen : null;
  };

  const flattenJugador = (j) => {
    const p = j.Persona ?? j.persona ?? {};
    
    const id_jugador = j.id_jugador ?? j.id;
    const id_persona = j.id_persona ?? p.id_persona ?? p.id;
    const id_club = j.id_club ?? null;
    
    const ci = p.ci ?? '';
    const ap = p.ap ?? '';
    const am = p.am ?? '';
    const apellidos = [ap, am].filter(Boolean).join(' ').trim();
    const nombre = p.nombre ?? '';
    const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim();
    const fnac = p.fnac ?? '';
    const genero = normalizarGenero(p.genero);

    const id_nacionalidad = p.id_nacionalidad ?? null;
    const pais = p.nacionalidad?.pais ?? p.Nacionalidad?.pais ?? null;
    
    const id_provincia_origen = p.id_provincia_origen ?? null;
    const provinciaObj = p.provinciaOrigen ?? p.ProvinciaOrigen ?? null;
    const nombreProvincia = provinciaObj?.nombre ?? null;
    
    const departamentoObj = provinciaObj?.departamento ?? provinciaObj?.Departamento ?? null;
    const id_departamento = departamentoObj?.id_departamento ?? null;
    const nombreDepartamento = departamentoObj?.nombre ?? null;

    const estatura = j.estatura ?? 0;
    const foto = j.foto ?? p.foto ?? null;
    const nombreClub = j.Club?.nombre ?? j.club?.nombre ?? null;

    const carnet = j.Carnet ?? j.carnet ?? j.carnets?.[0] ?? null;
    const estadoCarnet = carnet?.estado_carnet ?? 'sin_carnet';
    const numeroCarnet = carnet?.numero_carnet ?? null;

    return {
      ...j,
      id: id_jugador,
      id_jugador,
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
      id_nacionalidad,
      pais,
      id_departamento,
      nombreDepartamento,
      id_provincia_origen,
      nombreProvincia,
      estatura,
      foto,
      nombreClub,
      carnet,
      estadoCarnet,
      numeroCarnet,
      persona: p,
    };
  };

  useEffect(() => {
    fetchJugadores();
    fetchNacionalidades();
    fetchDepartamentos();
    fetchProvincias();
    fetchClubs();
    fetchGestiones();
    fetchCategorias();
    if (esAdminOSecretario) {
      fetchCarnetsPendientes();
      fetchCategorias();
    }
  }, []);

  const fetchJugadores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL_JUGADOR, { method: 'GET', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al cargar los jugadores');
      const data = await response.json();
      const arr = pickArray(data);
      setJugadores(arr.map(flattenJugador));
    } catch (err) {
      console.error(err);
      setError(err.message);
      setJugadores([]);
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
      setProvError(e.message);
      setProvincias([]);
    }
  };

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
      setClubError(e.message);
      setClubs([]);
    }
  };

  const fetchGestiones = async () => {
    try {
      const res = await fetch(API_URL_GESTION, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al cargar gestiones');
      const data = await res.json();
      const arr = pickArrayGestiones(data);
      const activas = arr.filter(g => g.estado === true || g.activo === true);
      const opts = activas.map((g) => ({
        label: g.nombre ?? g.anio ?? `Gestión #${g.id_gestion}`,
        value: String(g.id_gestion),
      }));
      setGestiones(opts);
    } catch (e) {
      console.error('Error fetchGestiones:', e);
      setGestiones([]);
    }
  };

  const fetchCarnetsPendientes = async () => {
    try {
      const res = await fetch(`${API_URL_CARNET}?estado_carnet=pendiente`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!res.ok) return;
      const data = await res.json();
      console.log('📋 Respuesta de carnets pendientes:', data);
      const arr = pickArrayCarnets(data);
      console.log('📋 Carnets pendientes procesados:', arr);
      setCarnetsPendientes(arr);
    } catch (e) {
      console.error('Error fetchCarnetsPendientes:', e);
    }
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openEditModal = (jugador) => {
    console.log('🔵 Abriendo modal de edición con:', jugador);
    setEditingJugador(jugador);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este jugador?')) return;
    try {
      const response = await fetch(`${API_URL_JUGADOR}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error al eliminar');
      setJugadores(prev => prev.filter(j => (j.id_jugador ?? j.id) !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ✅ ACTUALIZADO: Ahora abre el modal
  const handleCrearCarnet = async (jugador) => {
    if (gestiones.length === 0) {
      alert('No hay gestiones activas disponibles. Cree una gestión primero.');
      return;
    }

    setJugadorParaCarnet(jugador);
    setAccionCarnet('crear');
    setIsGestionModalOpen(true);
  };

  // ✅ NUEVA FUNCIÓN: Procesar creación de carnet
  const procesarCrearCarnet = async (formData) => {
    alert('🎯 PROCESANDO CARNET - VER CONSOLA');
    console.log('🎯 procesarCrearCarnet iniciado');
    console.log('📋 formData completo:', formData);
    console.log('📷 formData.foto_carnet:', formData.foto_carnet);
    console.log(usuario)
    try {
      const bodyCarnet = {
        id_jugador: Number(jugadorParaCarnet.id_jugador || jugadorParaCarnet.id),
        id_gestion: Number(formData.id_gestion),
        id_categoria: formData.id_categoria ? Number(formData.id_categoria) : null,
        numero_dorsal: formData.numero_dorsal ? Number(formData.numero_dorsal) : null,
        posicion: formData.posicion || null,
        solicitado_por: usuarioId,
        estado_carnet: 'pendiente',
        duracion_dias: 365,
        observaciones: formData.observaciones || `Carnet creado por ${usuario.email || 'administrador'}`
      };

      // ✅ SIEMPRE usar FormData (con o sin foto)
      let body = new FormData();
      let headers = { ...getAuthHeaders() };

      // Agregar todos los campos del carnet
      Object.keys(bodyCarnet).forEach(key => {
        if (bodyCarnet[key] !== null && bodyCarnet[key] !== undefined) {
          body.append(key, bodyCarnet[key]);
        }
      });

      // Agregar foto si existe
      if (formData.foto_carnet) {
        console.log('📷 Agregando foto:', formData.foto_carnet.name);
        body.append('foto', formData.foto_carnet);
      } else {
        console.log('⚠️ No hay foto en formData');
      }

      // Remover Content-Type para que el navegador lo configure automáticamente con boundary
      delete headers['Content-Type'];

      const res = await fetch(`${API_URL_CARNET}/solicitar`, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear carnet');
      }

      setIsGestionModalOpen(false);
      setJugadorParaCarnet(null);
      alert('✅ Carnet creado. Ahora puedes revisarlo y activarlo.');
      await fetchJugadores();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ✅ ACTUALIZADO: Ahora abre el modal
  const handleSolicitarCarnet = async (jugador) => {
    if (gestiones.length === 0) {
      alert('No hay gestiones activas disponibles.');
      return;
    }
    console.log("entro en solicitar");
        console.log(usuario)
    setJugadorParaCarnet(jugador);
    setAccionCarnet('solicitar');
    setIsGestionModalOpen(true);
  };

  // ✅ NUEVA FUNCIÓN: Procesar solicitud de carnet
  const procesarSolicitarCarnet = async (formData) => {
    try {
      const body = {
        id_jugador: Number(jugadorParaCarnet.id_jugador || jugadorParaCarnet.id),
        id_gestion: Number(formData.id_gestion),
        id_categoria: formData.id_categoria ? Number(formData.id_categoria) : null, // 👈 NUEVO
        solicitado_por: usuario.id_usuario,
        estado_carnet: 'pendiente',
        duracion_dias: 365,
        observaciones: formData.observaciones || `Solicitud creada por ${usuario.email || 'usuario'} (${rolUsuario})`
      };

      const api = API_URL_CARNET + '/solicitar';
      const res = await fetch(api, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear solicitud');
      }

      setIsGestionModalOpen(false);
      setJugadorParaCarnet(null);
      alert('📋 Solicitud enviada correctamente.\n\nEstado: EN PROCESO DE CERTIFICACIÓN');
      await fetchJugadores();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ✅ NUEVA FUNCIÓN: Abrir modal de inscripción en equipos
  const handleInscribirEnEquipo = (jugador) => {
    console.log('📝 Abriendo modal de inscripción para:', jugador);
    setJugadorParaInscripcion(jugador);
    setIsInscripcionModalOpen(true);
  };

  // ✅ NUEVA FUNCIÓN: Callback después de inscribir exitosamente
  const handleInscripcionSuccess = async () => {
    console.log('✅ Inscripción exitosa, recargando jugadores...');
    await fetchJugadores();
  };

  const handleCreateJugador = async (formData) => {
    try {
      if (!formData.id_club) {
        throw new Error('Debe seleccionar un club');
      }

      const bodyData = {
        datosPersona: {
          ci: formData.ci,
          nombre: formData.nombre,
          ap: formData.ap,
          am: formData.am || null,
          fnac: formData.fnac || null,
          id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : null,
          id_provincia_origen: formData.id_provincia_origen ? Number(formData.id_provincia_origen) : null,
          genero: formData.genero || null,
        },
        datosJugador: {
          estatura: formData.estatura ? Number(formData.estatura) : 0,
          id_club: Number(formData.id_club),
          foto: formData.foto || null,
        },
      };

      const res = await fetch(API_URL_JUGADOR, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        let msg = 'Error al crear jugador';
        try {
          const errorData = await res.json();
          msg = errorData.message || msg;
        } catch { }
        throw new Error(msg);
      }

      setIsCreateModalOpen(false);
      alert('✅ Jugador creado exitosamente');
      await fetchJugadores();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditJugador = async (formData) => {
    try {
      if (!editingJugador?.id_persona || !editingJugador?.id_jugador) {
        throw new Error('No se puede editar: jugador o persona no encontrados');
      }

      const bodyPersona = {
        ci: formData.ci,
        nombre: formData.nombre,
        ap: formData.ap,
        am: formData.am || null,
        fnac: formData.fnac || null,
        id_nacionalidad: formData.id_nacionalidad ? Number(formData.id_nacionalidad) : null,
        id_provincia_origen: formData.id_provincia_origen ? Number(formData.id_provincia_origen) : null,
        genero: formData.genero || null
      };

      const resP = await fetch(`${API_URLPersona}/${editingJugador.id_persona}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPersona)
      });

      if (!resP.ok) {
        const errorData = await resP.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar datos personales');
      }

      // Preparar FormData para el jugador (igual que en clubes - siempre FormData)
      const formDataJugador = new FormData();
      formDataJugador.append('datosPersona', JSON.stringify(bodyPersona));
      formDataJugador.append('datosJugador', JSON.stringify({
        estatura: formData.estatura ? Number(formData.estatura) : 0,
        id_club: formData.id_club ? Number(formData.id_club) : editingJugador.id_club,
      }));

      // Agregar foto si existe (igual que clubes)
      if (formData.foto instanceof File) {
        formDataJugador.append('foto', formData.foto);
        console.log('📷 Enviando con foto nueva:', formData.foto.name);
      } else if (editingJugador.foto) {
        console.log('📷 Manteniendo foto existente:', editingJugador.foto);
      }

      // Preparar headers sin Content-Type para FormData (igual que clubes)
      const headersJugador = getAuthHeaders();
      delete headersJugador['Content-Type']; // Dejar que el navegador configure multipart/form-data

      const resJ = await fetch(`${API_URL_JUGADOR}/${editingJugador.id_jugador}`, {
        method: 'PUT',
        headers: headersJugador,
        body: formDataJugador
      });

      if (!resJ.ok) {
        const errorData = await resJ.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar jugador');
      }

      setIsEditModalOpen(false);
      setEditingJugador(null);
      await fetchJugadores();
      alert('✅ Datos del jugador actualizados correctamente');
    } catch (err) {
      console.error('Error al editar:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const aprobarCarnet = async (carnet, silencioso = false) => {
    try {
      const idCarnet = carnet.id_carnet || carnet.id;
      
      const res = await fetch(`${API_URL_CARNET}/activar/${idCarnet}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          estado_carnet: 'activo',
          fecha_aprobacion: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Error al aprobar carnet');

      if (!silencioso) {
        alert('✅ Carnet aprobado correctamente');
        await fetchCarnetsPendientes();
        await fetchJugadores();
      }
      
      setIsCarnetModalOpen(false);
      setSelectedCarnet(null);
    } catch (err) {
      if (!silencioso) alert('Error: ' + err.message);
      throw err;
    }
  };

  const rechazarCarnet = async (carnet) => {
    const motivo = window.prompt('Ingrese el motivo del rechazo:');
    if (!motivo) return;

    try {
      const idCarnet = carnet.id_carnet || carnet.id;
      
      const res = await fetch(`${API_URL_CARNET}/${idCarnet}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          estado_carnet: 'cancelado',
          observaciones: `Rechazado: ${motivo}`
        })
      });

      if (!res.ok) throw new Error('Error al rechazar carnet');

      alert('Carnet rechazado');
      await fetchCarnetsPendientes();
      await fetchJugadores();
      setIsCarnetModalOpen(false);
      setSelectedCarnet(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const IconBtn = ({ title, onClick, children, danger, success }) => (
    <button
      title={title}
      onClick={onClick}
      className={
        `p-2 rounded-md border transition-colors
         ${danger ? 'text-red-600 hover:bg-red-50 border-red-200' : 
           success ? 'text-green-600 hover:bg-green-50 border-green-200' :
           'hover:bg-gray-50 border-gray-200'}`
      }
    >
      {children}
    </button>
  );

  const EstadoCarnetBadge = ({ estado }) => {
    const config = {
      'sin_carnet': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Sin carnet' },
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En proceso' },
      'activo': { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo' },
      'vencido': { bg: 'bg-red-100', text: 'text-red-700', label: 'Vencido' },
      'cancelado': { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
    };
    
    const { bg, text, label } = config[estado] || config['sin_carnet'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: 'foto',
      label: 'Foto',
      render: (value) => value ? (
        <img 
          src={value} 
          alt="Jugador" 
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
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div>
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre',
      render: (value) => <div className="font-medium text-gray-900">{value || 'N/A'}</div>
    },
    {
      key: 'estatura',
      label: 'Estatura (cm)',
      render: (value) => <div className="text-gray-800">{value ? `${value} cm` : '—'}</div>
    },
    {
      key: 'nombreClub',
      label: 'Club',
      render: (value) => (
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
          {value || 'Sin club'}
        </div>
      )
    },
    {
      key: 'estadoCarnet',
      label: 'Carnet',
      render: (value, row) => {
        const estado = (value || 'sin_carnet').toString().trim().toLowerCase();
        const puedeCrearDirecto = esAdminOSecretario && (estado === 'sin_carnet' || estado === 'sin carnet');
        const puedeSolicitarCarnet = esClubRepresentante && (estado === 'sin_carnet' || estado === 'sin carnet');
        const puedeAprobar = esAdminOSecretario && estado === 'pendiente';

        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <EstadoCarnetBadge estado={estado} />
              {row.numeroCarnet && (
                <span className="text-xs text-gray-500">#{row.numeroCarnet}</span>
              )}
            </div>

            <div className="flex-shrink-0">
              {puedeCrearDirecto && (
                <button
                  onClick={() => handleCrearCarnet(row)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Crear carnet pendiente de revisión"
                >
                  <CreditCard size={14} />
                  Crear
                </button>
              )}

              {puedeSolicitarCarnet && (
                <button
                  onClick={() => handleSolicitarCarnet(row)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Solicitar carnet"
                >
                  <CreditCard size={14} />
                  Solicitar
                </button>
              )}

              {puedeAprobar && (
                <button
                  onClick={async () => {
                    try {
                      // Obtener el carnet completo del backend
                      const carnetId = row.carnet.id_carnet || row.carnet.id;
                      console.log('🔍 Consultando carnet ID:', carnetId);

                      const res = await fetch(`${API_URL_CARNET}/${carnetId}`, {
                        method: 'GET',
                        headers: getAuthHeaders()
                      });

                      if (res.ok) {
                        const data = await res.json();
                        console.log('✅ Carnet obtenido del backend:', data);
                        const carnetCompleto = data.data || data.carnet || data;
                        console.log('📷 Foto carnet en objeto:', carnetCompleto.foto_carnet);
                        setSelectedCarnet(carnetCompleto);
                      } else {
                        console.error('❌ Error al obtener carnet');
                        setSelectedCarnet(row.carnet);
                      }

                      setIsCarnetModalOpen(true);
                    } catch (error) {
                      console.error('❌ Error:', error);
                      setSelectedCarnet(row.carnet);
                      setIsCarnetModalOpen(true);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Revisar solicitud"
                >
                  <CheckCircle size={14} />
                  Revisar
                </button>
              )}

              {estado === 'activo' && (
                <button
                  onClick={async () => {
                    try {
                      // Obtener el carnet completo del backend
                      const carnetId = row.carnet.id_carnet || row.carnet.id;
                      console.log('🔍 Consultando carnet ID:', carnetId);

                      const res = await fetch(`${API_URL_CARNET}/${carnetId}`, {
                        method: 'GET',
                        headers: getAuthHeaders()
                      });

                      if (res.ok) {
                        const data = await res.json();
                        console.log('✅ Carnet obtenido del backend:', data);
                        const carnetCompleto = data.data || data.carnet || data;
                        console.log('📷 Foto carnet en objeto:', carnetCompleto.foto_carnet);
                        setSelectedCarnet(carnetCompleto);
                      } else {
                        console.error('❌ Error al obtener carnet');
                        setSelectedCarnet(row.carnet);
                      }

                      setIsCarnetModalOpen(true);
                    } catch (error) {
                      console.error('❌ Error:', error);
                      setSelectedCarnet(row.carnet);
                      setIsCarnetModalOpen(true);
                    }
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Ver e imprimir carnet"
                >
                  <CreditCard size={14} />
                  Ver Carnet
                </button>
              )}

              {estado === 'vencido' && (
                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <XCircle size={14} />
                  Vencido
                </span>
              )}

              {estado === 'cancelado' && (
                <span className="text-xs text-gray-500 font-medium">
                  Cancelado
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'nombreDepartamento',
      label: 'Departamento',
      render: (value) => <div className="text-gray-600">{value || '—'}</div>
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_v, row) => {
        return (
          <div className="flex items-center gap-2">
            <IconBtn title="Editar Jugador" onClick={() => openEditModal(row)}>
              <Pencil size={18} />
            </IconBtn>

            <IconBtn
              title="Eliminar Jugador"
              onClick={() => handleDelete(row.id_jugador ?? row.id)}
              danger
            >
              <Trash2 size={18} />
            </IconBtn>
          </div>
        );
      }
    }
  ];

  const getJugadorFields = (isEditMode = false) => {
    const campos = [
      { name: 'ci', label: 'CI', type: 'text', placeholder: 'Ej: 12345678', required: true, cols: 3 },
      { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Juan', required: true, cols: 3 },
      { name: 'ap', label: 'Apellido Paterno', type: 'text', placeholder: 'Ej: Pérez', required: true, cols: 3 },
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
        name: 'id_departamento',
        label: 'Departamento',
        type: 'select',
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
        name: 'id_provincia_origen',
        label: 'Provincia',
        type: 'select',
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
      {
        name: 'id_club',
        label: 'Club',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un club',
        cols: 2,
        options: clubs,
      },
      {
        name: 'estatura',
        label: 'Estatura (cm)',
        type: 'number',
        placeholder: 'Ej: 175',
        required: false,
        min: 100,
        max: 250,
        cols: 2,
      },
      {
        name: 'foto',
        label: 'Foto del Jugador',
        type: 'file',
        accept: 'image/*',
        required: false,
        cols: 2,
        helperText: 'Formatos: JPG, PNG, GIF o WEBP (máx. 5MB)',
      },
    ];

    if (!isEditMode && gestiones.length > 0) {
      campos.push({
        name: 'id_gestion',
        label: 'Gestión/Temporada (para carnet)',
        type: 'select',
        required: esClubRepresentante,
        placeholder: 'Seleccione gestión',
        cols: 2,
        options: gestiones,
      });
    }

    return campos;
  };

  // ✅ NUEVA FUNCIÓN: Campos para modal de gestión
  const getGestionFields = () => {
    // Debug: ver datos del jugador
    if (jugadorParaCarnet) {
      console.log('🔍 Jugador para carnet:', jugadorParaCarnet);
      console.log('📅 Fecha nacimiento (fnac):', jugadorParaCarnet.fnac);
      console.log('📅 Fecha nacimiento (persona.fnac):', jugadorParaCarnet.persona?.fnac);
    }

    // Obtener categorías elegibles para el jugador seleccionado
    const categoriasElegibles = jugadorParaCarnet
      ? obtenerCategoriasElegibles(jugadorParaCarnet)
      : categorias;

    const edad = jugadorParaCarnet
      ? calcularEdad(jugadorParaCarnet.fnac || jugadorParaCarnet.persona?.fnac)
      : null;

    console.log('✅ Edad calculada:', edad);
    console.log('✅ Categorías elegibles:', categoriasElegibles.length);

    return [
      {
        name: 'id_gestion',
        label: 'Gestión / Temporada',
        type: 'select',
        required: true,
        placeholder: 'Seleccione una gestión',
        cols: 12,
        options: gestiones,
      },
      {
        name: 'id_categoria',
        label: edad
          ? `Categoría del carnet (Edad: ${edad} años)`
          : 'Categoría del carnet',
        type: 'select',
        required: true,
        placeholder: 'Seleccione una categoría',
        cols: 12,
        options: categoriasElegibles, // ✅ Ahora usa solo las categorías elegibles
        helperText: categoriasElegibles.length < categorias.length
          ? `✅ Se muestran ${categoriasElegibles.length} categorías elegibles: categoría base + hasta 3 superiores según edad del jugador`
          : null,
      },
      {
        name: 'numero_dorsal',
        label: 'Número de Dorsal',
        type: 'number',
        required: false,
        placeholder: 'Ej: 10',
        min: 1,
        max: 99,
        cols: 6,
      },
      {
        name: 'posicion',
        label: 'Posición',
        type: 'text',
        required: false,
        placeholder: 'Ej: Líbero, Colocador, etc.',
        cols: 6,
      },
      {
        name: 'foto_carnet',
        label: 'Foto del Carnet (opcional)',
        type: 'file',
        accept: 'image/*',
        required: false,
        cols: 12,
        helperText: 'Suba una foto tipo carnet del jugador (fondo blanco recomendado, máx. 5MB)',
      },
      {
        name: 'observaciones',
        label: 'Observaciones (opcional)',
        type: 'textarea',
        required: false,
        placeholder: 'Agregue cualquier comentario adicional...',
        rows: 3,
        cols: 12,
      },
    ];
  };

  const filteredJugadores = Array.isArray(jugadores)
    ? jugadores.filter(j => {
      const term = searchTerm.toLowerCase();
      return (j.nombreCompleto ?? '').toLowerCase().includes(term)
        || (j.ci ?? '').toLowerCase().includes(term);
    })
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jugadores</h1>
        <p className="text-gray-600 mt-2">Gestiona los jugadores del sistema.</p>
      </div>

      {esAdminOSecretario && carnetsPendientes.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Bell className="text-amber-600" size={24} />
            <div className="flex-1">
              <p className="text-amber-800 font-medium">
                Carnets pendientes de aprobación
              </p>
              <p className="text-amber-600 text-sm">
                Hay {carnetsPendientes.length} solicitud(es) de carnet esperando revisión
              </p>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              Ver solicitudes
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error al cargar jugadores</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchJugadores}
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
              placeholder="Buscar jugador (nombre o CI)..."
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
          Nuevo Jugador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Total Jugadores</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : jugadores.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-gray-600 text-sm">Carnets Activos</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {loading ? '...' : jugadores.filter(j => j.estadoCarnet === 'activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={20} />
            <p className="text-gray-600 text-sm">En Proceso</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {loading ? '...' : jugadores.filter(j => j.estadoCarnet === 'pendiente').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2">
            <XCircle className="text-gray-400" size={20} />
            <p className="text-gray-600 text-sm">Sin Carnet</p>
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {loading ? '...' : jugadores.filter(j => j.estadoCarnet === 'sin_carnet').length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando jugadores...</p>
        </div>
      ) : (
        <DataTable
          data={filteredJugadores}
          columns={columns}
          itemsPerPage={10}
        />
      )}

      {/* Modal de creación */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJugador}
        title="Crear Nuevo Jugador"
        size="5xl"
        fields={getJugadorFields(false)}
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
          id_club: '',
          estatura: '0',
          foto: '',
          id_gestion: gestiones.length > 0 ? gestiones[0].value : '',
        }}
      />

      {/* Modal de edición */}
      {editingJugador && (
        <FormModal
          key={`edit-jugador-${editingJugador.id_jugador}-${Date.now()}`}
          isOpen={isEditModalOpen}
          onClose={() => { 
            setIsEditModalOpen(false); 
            setEditingJugador(null); 
          }}
          onSubmit={handleEditJugador}
          title="Editar Jugador"
          size="5xl"
          fields={getJugadorFields(true)}
          initialData={{
            ci: editingJugador.ci || '',
            nombre: editingJugador.nombre || '',
            ap: editingJugador.ap || '',
            am: editingJugador.am || '',
            fnac: editingJugador.fnac || '',
            id_nacionalidad: editingJugador.id_nacionalidad != null 
              ? String(editingJugador.id_nacionalidad) 
              : '',
            id_departamento: editingJugador.id_departamento != null 
              ? String(editingJugador.id_departamento) 
              : '',
            id_provincia_origen: editingJugador.id_provincia_origen != null 
              ? String(editingJugador.id_provincia_origen) 
              : '',
            genero: editingJugador.genero || '',
            id_club: editingJugador.id_club != null 
              ? String(editingJugador.id_club) 
              : '',
            estatura: editingJugador.estatura != null 
              ? String(editingJugador.estatura) 
              : '0',
            foto: editingJugador.foto || '',
          }}
        />
      )}

      {/* ✅ MODAL DE SELECCIÓN DE GESTIÓN */}
      {jugadorParaCarnet && (
        <FormModal
          isOpen={isGestionModalOpen}
          onClose={() => {
            setIsGestionModalOpen(false);
            setJugadorParaCarnet(null);
            setAccionCarnet(null);
          }}
          onSubmit={accionCarnet === 'crear' ? procesarCrearCarnet : procesarSolicitarCarnet}
          title={
            accionCarnet === 'crear' 
              ? `🎫 Crear Carnet - ${jugadorParaCarnet.nombreCompleto}` 
              : `📋 Solicitar Carnet - ${jugadorParaCarnet.nombreCompleto}`
          }
          size="lg"
          fields={getGestionFields()}
          initialData={{
            id_gestion: gestiones.length > 0 ? gestiones[0].value : '',
            observaciones: '',
          }}
        />
      )}

      {/* Modal de gestión de carnets */}
      {isCarnetModalOpen && selectedCarnet && (() => {
        // Debug: Ver qué datos tenemos
        console.log('🔍 selectedCarnet completo:', selectedCarnet);
        console.log('🔍 selectedCarnet.jugador:', selectedCarnet.jugador);
        console.log('🔍 selectedCarnet.id_jugador:', selectedCarnet.id_jugador);

        // Obtener información del jugador y persona
        const jugadorData = selectedCarnet.jugador || {};
        const personaData = jugadorData.Persona || {};

        console.log('🔍 jugadorData:', jugadorData);
        console.log('🔍 personaData:', personaData);

        const nombreCompleto = personaData.nombre
          ? `${personaData.nombre} ${personaData.ap || ''} ${personaData.am || ''}`.trim()
          : 'N/A';

        // Obtener club del jugador desde los datos del carnet
        const clubNombre = jugadorData.Club?.nombre || jugadorData.club?.nombre || null;

        console.log('🔍 jugadorData.Club:', jugadorData.Club);
        console.log('🔍 clubNombre:', clubNombre);

        // Obtener categoría
        const categoriaData = selectedCarnet.id_categoria
          ? categorias.find(c => String(c.value) === String(selectedCarnet.id_categoria))
          : null;

        console.log('🔍 categoriaData:', categoriaData);
        console.log('🔍 selectedCarnet.id_categoria:', selectedCarnet.id_categoria);

        // Obtener el color de la categoría (default azul si no hay)
        const categoriaColor = categoriaData?.color || '#3B82F6';

        // Función para oscurecer un color HEX
        const darkenColor = (hex, percent) => {
          const num = parseInt(hex.replace('#', ''), 16);
          const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
          const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
          const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
          return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        };

        // Función para aclarar un color HEX
        const lightenColor = (hex, percent) => {
          const num = parseInt(hex.replace('#', ''), 16);
          const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
          const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent));
          const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent));
          return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        };

        const colorBase = categoriaColor;
        const colorOscuro = darkenColor(categoriaColor, 0.3);
        const colorMuyOscuro = darkenColor(categoriaColor, 0.5);
        const colorClaro = lightenColor(categoriaColor, 0.4);

        return (
          <>
            {/* Overlay del modal - Oculto en impresión */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Botones del modal (NO se imprimen) */}
                <div className="flex gap-3 p-6 border-b">
                  {selectedCarnet.estado_carnet === 'pendiente' ? (
                    <>
                      <button
                        onClick={() => aprobarCarnet(selectedCarnet)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rechazarCarnet(selectedCarnet)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <XCircle size={18} />
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => window.print()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Printer size={18} />
                      Imprimir Carnet
                    </button>
                  )}
                  <button
                    onClick={() => { setIsCarnetModalOpen(false); setSelectedCarnet(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>

                {/* Vista previa del carnet en el modal */}
                <div className="flex justify-center p-6 bg-gray-100">
                  <div
                    className="relative overflow-hidden shadow-2xl"
                    style={{
                      width: '700px',
                      height: '441px',
                      background: '#FFFFFF',
                      border: `6px solid ${colorBase}`
                    }}
                  >
                    {/* Barra lateral izquierda con texto VOLEIBOL vertical */}
                    <div
                      className="absolute left-0 top-0 bottom-0 flex items-center justify-center"
                      style={{
                        width: '50px',
                        background: colorBase,
                        borderRight: `3px solid ${colorOscuro}`
                      }}
                    >
                      <p
                        className="text-white font-black tracking-widest"
                        style={{
                          fontSize: '20px',
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          letterSpacing: '0.15em'
                        }}
                      >
                        VOLEIBOL * CERCADO
                      </p>
                    </div>

                    {/* Marca de agua en el fondo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <p className="text-gray-400 font-black" style={{fontSize: '200px', transform: 'rotate(-15deg)'}}>
                        FEDERACIÓN
                      </p>
                    </div>

                    {/* Header con borde de color de categoría */}
                    <div
                      className="relative pt-6 pb-4 text-center"
                      style={{
                        marginLeft: '50px',
                        borderBottom: `5px solid ${colorBase}`
                      }}
                    >
                      <p className="font-bold uppercase" style={{fontSize: '22px', color: '#1a1a1a', letterSpacing: '0.2em'}}>
                        ASOCIACIÓN MUNICIPAL
                      </p>
                      <h1 className="font-black uppercase" style={{fontSize: '32px', color: '#000', letterSpacing: '0.15em'}}>
                        CARNET DE JUGADOR
                      </h1>
                    </div>

                    {/* Contenido principal */}
                    <div className="relative flex" style={{marginLeft: '50px', padding: '12px 30px', gap: '24px'}}>
                      {/* Foto del jugador */}
                      <div className="flex-shrink-0">
                        {selectedCarnet.foto_carnet ? (
                          <div
                            className="overflow-hidden shadow-xl"
                            style={{ width: '175px', height: '205px', border: `5px solid ${colorBase}` }}
                          >
                            <img
                              src={`http://localhost:8080${selectedCarnet.foto_carnet}`}
                              alt="Foto"
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center bg-gray-200 shadow-xl"
                            style={{ width: '175px', height: '205px', border: `5px solid ${colorBase}` }}
                          >
                            <span className="text-gray-400" style={{fontSize: '16px'}}>Sin foto</span>
                          </div>
                        )}
                      </div>

                      {/* Información del jugador */}
                      <div className="flex-1" style={{display: 'flex', flexDirection: 'column', gap: '7px'}}>
                        {/* Nombres */}
                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '1px'}}>NOMBRES:</p>
                          <p className="font-bold leading-tight" style={{fontSize: '17px', color: '#000'}}>{personaData.nombre || '—'}</p>
                        </div>

                        {/* Apellidos */}
                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '1px'}}>APELLIDOS:</p>
                          <p className="font-bold leading-tight" style={{fontSize: '17px', color: '#000'}}>
                            {[personaData.ap, personaData.am].filter(Boolean).join(' ') || '—'}
                          </p>
                        </div>

                        {/* Club */}
                        {clubNombre && (
                          <div>
                            <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '1px'}}>CLUB:</p>
                            <p className="font-bold leading-tight" style={{fontSize: '17px', color: '#000'}}>{clubNombre}</p>
                          </div>
                        )}

                        {/* Categoría */}
                        {categoriaData && (
                          <div>
                            <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '1px'}}>CATEGORÍA:</p>
                            <div className="inline-block px-3 py-0.5" style={{ background: colorBase, borderRadius: '4px' }}>
                              <p className="font-black uppercase text-white" style={{fontSize: '14px'}}>{categoriaData.label}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Datos adicionales en la parte inferior */}
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        marginLeft: '50px',
                        padding: '12px 30px',
                        background: '#f8f8f8',
                        borderTop: `4px solid ${colorBase}`
                      }}
                    >
                      <div className="flex gap-10">
                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '3px'}}>F. NACIMTO.</p>
                          <p className="font-bold" style={{fontSize: '15px', color: '#000'}}>
                            {personaData.fnac
                              ? new Date(personaData.fnac).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '3px'}}>C.I.</p>
                          <p className="font-bold" style={{fontSize: '15px', color: '#000'}}>{personaData.ci || '—'}</p>
                        </div>

                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '3px'}}>GESTIÓN:</p>
                          <p className="font-bold" style={{fontSize: '15px', color: '#000'}}>
                            {selectedCarnet.gestion?.gestion || selectedCarnet.gestion?.nombre || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="font-bold uppercase" style={{fontSize: '11px', color: '#555', marginBottom: '3px'}}>RAMA:</p>
                          <p className="font-bold" style={{fontSize: '15px', color: '#000'}}>
                            {(() => {
                              const lbl = (categoriaData?.label || '').toLowerCase();
                              return lbl.includes('femenino') || lbl.includes('damas') || lbl.includes('mujer')
                                ? 'FEMENINO'
                                : lbl.includes('masculino') || lbl.includes('varones') || lbl.includes('hombre')
                                  ? 'MASCULINO'
                                  : 'MIXTO';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCarnet.observaciones && (
                  <div className="px-6 pb-4">
                    <span className="text-gray-600 text-sm block mb-2">Observaciones</span>
                    <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                      {selectedCarnet.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CARNET FUTURISTA PARA IMPRESIÓN - Solo visible al imprimir */}
            <div id="carnet-imprimible" className="hidden print:block print:m-0">
              <style>{`
                @media print {
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #carnet-imprimible, #carnet-imprimible * {
                    visibility: visible;
                  }
                  #carnet-imprimible {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  @page {
                    size: A4 landscape;
                    margin: 0;
                  }
                }
              `}</style>

              {/* Diseño del Carnet - Estilo Profesional con fondo claro */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: '100mm',
                  height: '63mm',
                  background: '#FFFFFF',
                  border: `4px solid ${colorBase}`
                }}
              >
                {/* Barra lateral izquierda con texto VOLEIBOL vertical */}
                <div
                  className="absolute left-0 top-0 bottom-0 flex items-center justify-center"
                  style={{
                    width: '18px',
                    background: colorBase,
                    borderRight: `2px solid ${colorOscuro}`
                  }}
                >
                  <p
                    className="text-white font-black tracking-widest"
                    style={{
                      fontSize: '9px',
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    VOLEIBOL * CERCADO
                  </p>
                </div>

                {/* Marca de agua en el fondo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <p className="text-gray-400 font-black" style={{fontSize: '80px', transform: 'rotate(-15deg)'}}>
                    FEDERACIÓN
                  </p>
                </div>

                {/* Header con borde de color de categoría */}
                <div
                  className="relative pt-2 pb-2 text-center"
                  style={{
                    marginLeft: '18px',
                    borderBottom: `3px solid ${colorBase}`
                  }}
                >
                  <p className="font-bold uppercase" style={{fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em'}}>
                    ASOCIACIÓN MUNICIPAL
                  </p>
                  <h1 className="font-black uppercase" style={{fontSize: '16px', color: '#000', letterSpacing: '0.1em'}}>
                    CARNET DE JUGADOR
                  </h1>
                </div>

                {/* Contenido principal */}
                <div className="relative flex" style={{marginLeft: '18px', padding: '8px 10px', gap: '10px'}}>
                  {/* Foto del jugador con borde de categoría */}
                  <div className="flex-shrink-0">
                    {selectedCarnet.foto_carnet ? (
                      <div
                        className="overflow-hidden"
                        style={{
                          width: '70px',
                          height: '84px',
                          border: `3px solid ${colorBase}`
                        }}
                      >
                        <img
                          src={`http://localhost:8080${selectedCarnet.foto_carnet}`}
                          alt="Foto"
                          style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-gray-200"
                        style={{
                          width: '70px',
                          height: '84px',
                          border: `3px solid ${colorBase}`
                        }}
                      >
                        <span className="text-gray-400" style={{fontSize: '9px'}}>Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Información del jugador */}
                  <div className="flex-1" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {/* Nombres */}
                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '7px', color: '#000', marginBottom: '1px'}}>NOMBRES:</p>
                      <p className="font-bold leading-tight" style={{fontSize: '10px', color: '#000'}}>{personaData.nombre || '—'}</p>
                    </div>

                    {/* Apellidos */}
                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '7px', color: '#000', marginBottom: '1px'}}>APELLIDOS:</p>
                      <p className="font-bold leading-tight" style={{fontSize: '10px', color: '#000'}}>
                        {[personaData.ap, personaData.am].filter(Boolean).join(' ') || '—'}
                      </p>
                    </div>

                    {/* Club */}
                    {clubNombre && (
                      <div>
                        <p className="font-bold uppercase" style={{fontSize: '7px', color: '#000', marginBottom: '1px'}}>CLUB:</p>
                        <p className="font-bold leading-tight" style={{fontSize: '11px', color: '#000'}}>{clubNombre}</p>
                      </div>
                    )}

                    {/* Categoría con color de fondo */}
                    {categoriaData && (
                      <div>
                        <p className="font-bold uppercase" style={{fontSize: '7px', color: '#000', marginBottom: '1px'}}>CATEGORÍA:</p>
                        <div
                          className="inline-block px-2 py-0.5"
                          style={{ background: colorBase, borderRadius: '2px' }}
                        >
                          <p className="font-black uppercase text-white" style={{fontSize: '10px'}}>{categoriaData.label}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Datos adicionales en la parte inferior */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    marginLeft: '18px',
                    padding: '6px 10px',
                    background: '#f8f8f8',
                    borderTop: `2px solid ${colorBase}`
                  }}
                >
                  <div className="flex gap-5">
                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '6px', color: '#555', marginBottom: '1px'}}>F. NACIMTO.</p>
                      <p className="font-bold" style={{fontSize: '8px', color: '#000'}}>
                        {personaData.fnac
                          ? new Date(personaData.fnac).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '6px', color: '#555', marginBottom: '1px'}}>C.I.</p>
                      <p className="font-bold" style={{fontSize: '8px', color: '#000'}}>{personaData.ci || '—'}</p>
                    </div>

                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '6px', color: '#555', marginBottom: '1px'}}>GESTIÓN:</p>
                      <p className="font-bold" style={{fontSize: '8px', color: '#000'}}>
                        {selectedCarnet.gestion?.gestion || selectedCarnet.gestion?.nombre || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold uppercase" style={{fontSize: '6px', color: '#555', marginBottom: '1px'}}>RAMA:</p>
                      <p className="font-bold" style={{fontSize: '8px', color: '#000'}}>
                        {(() => {
                          const lbl = (categoriaData?.label || '').toLowerCase();
                          return lbl.includes('femenino') || lbl.includes('damas') || lbl.includes('mujer')
                            ? 'FEMENINO'
                            : lbl.includes('masculino') || lbl.includes('varones') || lbl.includes('hombre')
                              ? 'MASCULINO'
                              : 'MIXTO';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedCarnet.observaciones && selectedCarnet.estado_carnet === 'pendiente' && (
                  <div className="hidden">
                    <p className="text-xs">{selectedCarnet.observaciones}</p>
                  </div>
                )}
              </div>
            </div>

          </>
        );
      })()}


      {/* ✅ MODAL DE INSCRIPCIÓN EN EQUIPOS */}
      {jugadorParaInscripcion && (
        <InscripcionParticipacionModal
          isOpen={isInscripcionModalOpen}
          onClose={() => {
            setIsInscripcionModalOpen(false);
            setJugadorParaInscripcion(null);
          }}
          jugador={{
            id_jugador: jugadorParaInscripcion.id_jugador,
            nombre: jugadorParaInscripcion.nombre,
            ap: jugadorParaInscripcion.ap,
            am: jugadorParaInscripcion.am,
            fnac: jugadorParaInscripcion.fnac
          }}
          categoriasPermitidas={obtenerCategoriasElegibles(jugadorParaInscripcion)}
          todasCategorias={categorias}
          onSuccess={handleInscripcionSuccess}
        />
      )}
    </div>
  );
}