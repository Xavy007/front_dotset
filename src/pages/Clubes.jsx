// ===============================================
// ARCHIVO: src/pages/ClubesPage.jsx
// PÁGINA DE GESTIÓN DE CLUBES CON SUBIDA DE ARCHIVOS
// ===============================================

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Globe, Mail, Phone, Power, Trash2, Shield, X, CheckCircle, FileCheck,
  Eye, MapPin, UserCheck, Calendar, Building2
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import PageHeader from '../components/PageHeader';
import StatCard, { StatsRow } from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { API_BASE, SERVER_URL } from '../services/api.config.js';
import { tienePermiso, getUsuarioActual } from '../utils/permissions.js';

export function ClubesPage() {
  const [clubes, setClubes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  // --- Modal de detalle ---
  const [selectedClub, setSelectedClub] = useState(null);
  const [detailTab, setDetailTab] = useState('info');
  const [tecnicosClub, setTecnicosClub] = useState([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [equiposClub, setEquiposClub] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [jugadoresClub, setJugadoresClub] = useState([]);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [jugadorSearch, setJugadorSearch] = useState('');

  const _rol = getUsuarioActual()?.rol || '';
  const puedeEditarClub   = tienePermiso(_rol, 'club', 'actualizar');
  const puedeEliminarClub = tienePermiso(_rol, 'club', 'eliminar');
  const puedeCrearClub    = tienePermiso(_rol, 'club', 'crear');

  const API_URL = `${API_BASE}/club`;

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`
    };
  };

  // ===============================================
  // CARGAR CLUBES
  // ===============================================
  useEffect(() => {
    fetchClubes();
  }, []);

  const fetchClubes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { 
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } 
      });
      if (!res.ok) throw new Error('Error al cargar clubes');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setClubes(arr.map(normalizarClub));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // NORMALIZACIÓN DE DATOS
  // ===============================================
  const normalizarClub = (c) => {
    const estadoBooleano = c.estado === true || c.estado === 1;
    
    let redesParsed = {};
    if (c.redes_sociales) {
      try {
        redesParsed = typeof c.redes_sociales === 'string' 
          ? JSON.parse(c.redes_sociales) 
          : c.redes_sociales;
      } catch (e) {
        redesParsed = {};
      }
    }

    return {
      ...c,
      id_club: c.id_club ?? c.id,
      nombre: c.nombre ?? '',
      acronimo: c.acronimo ?? '',
      direccion: c.direccion ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      facebook: redesParsed.facebook || '',
      instagram: redesParsed.instagram || '',
      whatsapp: redesParsed.whatsapp || '',
      tiktok: redesParsed.tiktok || '',
      twitter: redesParsed.twitter || '',
      youtube: redesParsed.youtube || '',
      personeria: c.personeria ?? false,
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activo' : 'inactivo',
      logo: c.logo ?? '',
      freg: c.freg ? new Date(c.freg).toLocaleDateString() : '—'
    };
  };

  // ===============================================
  // MANEJAR ARCHIVO (useCallback para evitar re-renders)
  // ===============================================
  const handleFileChange = useCallback((file) => {
    console.log('📷 ClubesPage - Archivo recibido:', file?.name);
    
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        console.log('🖼️ Preview generado');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    console.log('🗑️ Preview limpiado');
  }, []);

  // ===============================================
  // CREAR / EDITAR CLUB CON FORMDATA
  // ===============================================
  const handleSubmit = async (formData) => {
    // Validaciones
    if (!formData.nombre?.trim()) { toast.error('El nombre del club es obligatorio'); return; }
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('El correo electrónico no tiene un formato válido'); return;
    }
    if (formData.telefono?.trim() && formData.telefono.trim().length < 7) {
      toast.error('El teléfono debe tener al menos 7 dígitos'); return;
    }
    try {
      console.log('📨 FormData recibido:', formData);

      // Construir objeto de redes sociales
      const redesSociales = {
        facebook: formData.facebook || '',
        instagram: formData.instagram || '',
        whatsapp: formData.whatsapp || '',
        tiktok: formData.tiktok || '',
        twitter: formData.twitter || '',
        youtube: formData.youtube || '',
      };

      // Crear FormData para enviar archivo
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre || '');
      formDataToSend.append('acronimo', formData.acronimo || '');
      formDataToSend.append('direccion', formData.direccion || '');
      formDataToSend.append('telefono', formData.telefono || '');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('redes_sociales', JSON.stringify(redesSociales));
      formDataToSend.append('personeria', formData.personeria === 'true' || formData.personeria === true);
      
      // Estado: Si es edición, mantener el actual; si es nuevo, activo por defecto
      const estadoValue = editingClub 
        ? (editingClub.estadoBooleano !== undefined ? editingClub.estadoBooleano : true)
        : true;
      formDataToSend.append('estado', estadoValue);
      console.log('📊 Estado enviado:', estadoValue);

      // 📷 Agregar archivo solo si existe en formData.logo
      if (formData.logo instanceof File) {
        formDataToSend.append('logo', formData.logo);
        console.log('📷 Enviando archivo nuevo:', formData.logo.name);
      } else if (editingClub && editingClub.logo) {
        formDataToSend.append('logoExistente', editingClub.logo);
        console.log('📷 Manteniendo logo existente:', editingClub.logo);
      }

      // Debug: Ver qué hay en FormData
      console.log('📦 FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `[File: ${value.name}]` : value);
      }

      const method = editingClub ? 'PUT' : 'POST';
      const url = editingClub ? `${API_URL}/${editingClub.id_club}` : API_URL;

      console.log(`📡 Enviando ${method} a: ${url}`);

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formDataToSend
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        let errorMessage = 'Error al guardar el club';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Error del servidor:', errorData);
        } catch (parseError) {
          console.error('❌ Error al parsear respuesta de error');
        }
        throw new Error(errorMessage);
      }

      const resultado = await res.json();
      console.log('✅ Club guardado exitosamente:', resultado);

      await fetchClubes();
      setIsModalOpen(false);
      setEditingClub(null);
      setPreviewUrl(null);
      toast.success('Club guardado correctamente');
    } catch (err) {
      console.error('❌ Error completo:', err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (club) => {
    const nuevoEstado = !club.estadoBooleano;

    try {
      const res = await fetch(`${API_URL}/${club.id_club}/estado`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (!res.ok) throw new Error('Error al cambiar el estado');

      setClubes(prev =>
        prev.map(c =>
          c.id_club === club.id_club
            ? { ...c, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activo' : 'inactivo' }
            : c
        )
      );
      
      toast.success(`Club ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // ELIMINAR CLUB
  // ===============================================
  const handleDelete = (id_club) => {
    setConfirm({ open: true, id: id_club });
  };

  const doDelete = async (id_club) => {
    try {
      const res = await fetch(`${API_URL}/${id_club}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el club');
      setClubes(prev => prev.filter(c => c.id_club !== id_club));
      toast.success('Club eliminado correctamente');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // FETCH EQUIPO TÉCNICO POR CLUB
  // ===============================================
  const fetchTecnicosClub = async (id_club) => {
    setLoadingTecnicos(true);
    setTecnicosClub([]);
    try {
      const res = await fetch(`${API_BASE}/eqtecnicos/club/${id_club}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar equipo técnico');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setTecnicosClub(arr);
    } catch (err) {
      console.error(err);
      setTecnicosClub([]);
    } finally {
      setLoadingTecnicos(false);
    }
  };

  const fetchEquiposClub = async (id_club) => {
    setLoadingEquipos(true);
    setEquiposClub([]);
    try {
      const res = await fetch(`${API_BASE}/equipo/club/${id_club}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar equipos');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setEquiposClub(arr);
    } catch (err) {
      console.error(err);
      setEquiposClub([]);
    } finally {
      setLoadingEquipos(false);
    }
  };

  const fetchJugadoresClub = async (id_club) => {
    setLoadingJugadores(true);
    setJugadoresClub([]);
    try {
      const res = await fetch(`${API_BASE}/jugadores/club/${id_club}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar jugadores');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setJugadoresClub(arr);
    } catch (err) {
      console.error(err);
      setJugadoresClub([]);
    } finally {
      setLoadingJugadores(false);
    }
  };

  const abrirDetalle = (club) => {
    setSelectedClub(club);
    setDetailTab('info');
    setTecnicosClub([]);
    setEquiposClub([]);
    setJugadoresClub([]);
    setJugadorSearch('');
  };

  const cambiarTab = (tab) => {
    setDetailTab(tab);
    if (tab === 'tecnico' && selectedClub) fetchTecnicosClub(selectedClub.id_club);
    if (tab === 'equipos' && selectedClub) fetchEquiposClub(selectedClub.id_club);
    if (tab === 'jugadores' && selectedClub) fetchJugadoresClub(selectedClub.id_club);
  };

  const ROL_TEXTO = { DT: 'Director Técnico', EA: 'Entrenador Asistente', AC: 'Ayudante de Campo', M: 'Médico', F: 'Fisioterapeuta' };

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredClubes = clubes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.acronimo.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
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
  // COLUMNAS DE TABLA
  // ===============================================
  const columns = [
{
  key: 'logo',
  label: 'Logo',
  render: (value) => {
    console.log('🖼️ Logo value:', value); // ← AGREGAR para debug
    
    if (!value) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          🏐
        </div>
      );
    }
    
    // Construir URL correcta
    const imageUrl = value.startsWith('http')
      ? value
      : `${SERVER_URL}${value.startsWith('/') ? value : '/' + value}`;
    
    console.log('🖼️ Image URL:', imageUrl); // ← AGREGAR para debug
    
    return (
      <img 
        src={imageUrl}
        alt="logo club" 
        className="w-10 h-10 object-cover rounded-full border"
        onError={(e) => {
          console.error('❌ Error cargando imagen:', imageUrl);
          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23ddd" width="40" height="40"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">🏐</text></svg>';
        }}
      />
    );
  }
}
,
    { key: 'nombre', label: 'Nombre', render: (v) => <div className="font-bold text-gray-900">{v}</div> },
    { key: 'acronimo', label: 'Sigla', render: (v) => <div>{v || '—'}</div> },
    { key: 'telefono', label: 'Teléfono', render: (v) => <div>{v || '—'}</div> },
    { key: 'email', label: 'Email', render: (v) => <div className="text-gray-600">{v || '—'}</div> },
    {
      key: 'personeria',
      label: 'Personería',
      render: (v) => (
        <div className={`px-3 py-1 text-sm rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {v ? 'Sí' : 'No'}
        </div>
      )
    },
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
          <IconBtn title="Ver detalle" onClick={() => abrirDetalle(row)}>
            <Eye size={18} className="text-blue-600" />
          </IconBtn>
          {puedeEditarClub && (
            <IconBtn title="Editar" onClick={() => { setEditingClub(row); setPreviewUrl(null); setIsModalOpen(true); }}>
              <Pencil size={18} />
            </IconBtn>
          )}
          {puedeEditarClub && (
            <IconBtn title={row.estadoBooleano ? 'Desactivar Club' : 'Activar Club'} onClick={() => toggleEstado(row)}>
              <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
            </IconBtn>
          )}
          {puedeEliminarClub && (
            <IconBtn title="Eliminar Club" onClick={() => handleDelete(row.id_club)} danger>
              <Trash2 size={18} />
            </IconBtn>
          )}
        </div>
      )
    }
  ];

  // ===============================================
  // CAMPOS DEL FORMULARIO (MEMOIZADOS con useCallback)
  // ===============================================
  const formFields = [
    { 
      name: 'nombre', 
      label: 'Nombre del Club', 
      type: 'text', 
      required: true,
      cols: 2,
    },
    { 
      name: 'acronimo', 
      label: 'Acrónimo', 
      type: 'text', 
      required: false,
      cols: 1,
    },
    { 
      name: 'direccion', 
      label: 'Dirección', 
      type: 'text', 
      required: false,
      cols: 3,
    },
    { 
      name: 'telefono', 
      label: 'Teléfono', 
      type: 'text', 
      required: false,
      cols: 2,
    },
    { 
      name: 'email', 
      label: 'Correo Electrónico', 
      type: 'email', 
      required: false,
      cols: 1,
    },
    { 
      name: 'logo', 
      label: 'Logo del Club', 
      type: 'file', 
      required: false,
      accept: 'image/*',
      onChange: handleFileChange, // ← useCallback
      cols: 3,
      helperText: 'Sube una imagen (JPG, PNG, etc.) - Máximo 5MB',
      renderCustom: () => (
        previewUrl && (
          <div className="mt-4 relative inline-block">
            <img 
              src={previewUrl} 
              alt="Preview logo" 
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
            />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              title="Eliminar imagen"
            >
              <X size={16} />
            </button>
          </div>
        )
      )
    },
    
    { 
      name: 'facebook', 
      label: '📘 Facebook', 
      type: 'text', 
      required: false,
      placeholder: 'https://facebook.com/club',
      cols: 1,
    },
    { 
      name: 'instagram', 
      label: '📷 Instagram', 
      type: 'text', 
      required: false,
      placeholder: '@nombreclub',
      cols: 1,
    },
    { 
      name: 'whatsapp', 
      label: '💬 WhatsApp', 
      type: 'text', 
      required: false,
      placeholder: '+591 XXXXXXXX',
      cols: 1,
    },
    { 
      name: 'tiktok', 
      label: '🎵 TikTok', 
      type: 'text', 
      required: false,
      placeholder: '@nombreclub',
      cols: 1,
    },
    { 
      name: 'twitter', 
      label: '🐦 Twitter/X', 
      type: 'text', 
      required: false,
      placeholder: '@nombreclub',
      cols: 1,
    },
    { 
      name: 'youtube', 
      label: '📹 YouTube', 
      type: 'text', 
      required: false,
      placeholder: 'https://youtube.com/@canal',
      cols: 1,
    },
    
    {
      name: 'personeria',
      label: '¿Tiene Personería Jurídica?',
      type: 'select',
      required: true,
      cols: 3,
      options: [
        { label: 'Sí', value: true },
        { label: 'No', value: false },
      ]
    },
  ];

  // ===============================================
  // ESTADÍSTICAS
  // ===============================================
  const totalActivos = clubes.filter(c => c.estadoBooleano).length;
  const totalInactivos = clubes.filter(c => !c.estadoBooleano).length;
  const totalPersoneria = clubes.filter(c => c.personeria).length;

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Clubes"
        subtitle="Administra los clubes registrados en el sistema."
        action={puedeCrearClub ? { label: 'Nuevo Club', icon: Plus, onClick: () => { setEditingClub(null); setPreviewUrl(null); setIsModalOpen(true); } } : null}
      />

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
            placeholder="Buscar club (nombre, email o sigla)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <StatsRow cols={3}>
        <StatCard title="Total Clubes" value={clubes.length} icon={Shield} color="blue" loading={loading} />
        <StatCard title="Activos" value={totalActivos} icon={CheckCircle} color="green" loading={loading} />
        <StatCard title="Con Personería Jurídica" value={totalPersoneria} icon={FileCheck} color="yellow" loading={loading} />
      </StatsRow>

      <DataTable data={filteredClubes} columns={columns} itemsPerPage={5} loading={loading} />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClub(null);
          setPreviewUrl(null);
        }}
        onSubmit={handleSubmit}
        title={editingClub ? 'Editar Club' : 'Registrar Nuevo Club'}
        size="4xl"
        fields={formFields}
        initialData={editingClub || {}}
      />

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => doDelete(confirm.id)}
        title="¿Eliminar Club?"
        message="Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />

      {/* ── MODAL DETALLE CLUB ── */}
      {selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Cabecera */}
            <div className="flex items-center gap-4 p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <div className="flex-shrink-0">
                {selectedClub.logo ? (
                  <img
                    src={selectedClub.logo.startsWith('http') ? selectedClub.logo : `${SERVER_URL}${selectedClub.logo.startsWith('/') ? selectedClub.logo : '/' + selectedClub.logo}`}
                    alt="logo"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">🏐</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{selectedClub.nombre}</h2>
                <p className="text-blue-100 text-sm">{selectedClub.acronimo || 'Sin acrónimo'}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedClub.estadoBooleano ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
                  {selectedClub.estadoBooleano ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <button onClick={() => setSelectedClub(null)} className="text-white/70 hover:text-white transition ml-2">
                <X size={22} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6 bg-gray-50">
              {[
                { id: 'info',      label: 'Información',    icon: Building2 },
                { id: 'tecnico',   label: 'Eq. Técnico',    icon: Users },
                { id: 'equipos',   label: 'Equipos',        icon: Shield },
                { id: 'jugadores', label: 'Jugadores',      icon: UserCheck },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => cambiarTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* TAB: INFORMACIÓN */}
              {detailTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Dirección</p>
                        <p className="text-gray-800 font-medium">{selectedClub.direccion || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                        <p className="text-gray-800 font-medium">{selectedClub.telefono || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Correo</p>
                        <p className="text-gray-800 font-medium">{selectedClub.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserCheck size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Personería Jurídica</p>
                        <p className={`font-medium ${selectedClub.personeria ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedClub.personeria ? 'Sí cuenta' : 'No cuenta'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha de registro</p>
                        <p className="text-gray-800 font-medium">{selectedClub.freg || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Redes sociales */}
                  {(selectedClub.facebook || selectedClub.instagram || selectedClub.whatsapp || selectedClub.tiktok || selectedClub.twitter || selectedClub.youtube) && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Globe size={14} /> Redes Sociales
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'facebook', label: '📘 Facebook' },
                          { key: 'instagram', label: '📷 Instagram' },
                          { key: 'whatsapp', label: '💬 WhatsApp' },
                          { key: 'tiktok', label: '🎵 TikTok' },
                          { key: 'twitter', label: '🐦 Twitter/X' },
                          { key: 'youtube', label: '📹 YouTube' },
                        ].filter(({ key }) => selectedClub[key]).map(({ key, label }) => (
                          <a
                            key={key}
                            href={selectedClub[key].startsWith('http') ? selectedClub[key] : `https://${selectedClub[key]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors border border-gray-200"
                          >
                            {label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: EQUIPOS */}
              {detailTab === 'equipos' && (
                <div>
                  {loadingEquipos ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                      Cargando equipos...
                    </div>
                  ) : equiposClub.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Shield size={40} className="mb-3 opacity-40" />
                      <p className="font-medium">Sin equipos registrados</p>
                      <p className="text-sm mt-1">Este club aún no tiene equipos.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Agrupar por categoría */}
                      {Object.entries(
                        equiposClub.reduce((grupos, equipo) => {
                          const cat = equipo.categoria?.nombre ?? equipo.Categoria?.nombre ?? 'Sin categoría';
                          if (!grupos[cat]) grupos[cat] = [];
                          grupos[cat].push(equipo);
                          return grupos;
                        }, {})
                      ).map(([categoria, equipos]) => (
                        <div key={categoria}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                              {categoria}
                            </span>
                            <span className="text-xs text-gray-400">{equipos.length} equipo{equipos.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {equipos.map((eq) => (
                              <div key={eq.id_equipo} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <Shield size={16} className="text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{eq.nombre}</p>
                                  {eq.anio_fundacion && (
                                    <p className="text-xs text-gray-400">Fundado: {eq.anio_fundacion}</p>
                                  )}
                                </div>
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${eq.estado ? 'bg-green-400' : 'bg-gray-300'}`} title={eq.estado ? 'Activo' : 'Inactivo'} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: EQUIPO TÉCNICO */}
              {detailTab === 'tecnico' && (
                <div>
                  {loadingTecnicos ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                      Cargando equipo técnico...
                    </div>
                  ) : tecnicosClub.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Users size={40} className="mb-3 opacity-40" />
                      <p className="font-medium">Sin equipo técnico registrado</p>
                      <p className="text-sm mt-1">Este club aún no tiene técnicos asignados.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tecnicosClub.map((t) => {
                        const persona = t.Persona ?? t.persona ?? {};
                        const nombre = [persona.nombre, persona.ap, persona.am].filter(Boolean).join(' ') || '—';
                        const rol = ROL_TEXTO[t.rol] || t.rol;
                        const estadoEq = t.estado_eq ?? 'activo';
                        return (
                          <div key={t.id_eqtecnico} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users size={18} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{nombre}</p>
                              <p className="text-sm text-gray-500">{persona.ci ? `CI: ${persona.ci}` : ''}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{rol}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                estadoEq === 'activo' ? 'bg-green-100 text-green-700' :
                                estadoEq === 'suspendido' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {estadoEq.charAt(0).toUpperCase() + estadoEq.slice(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* TAB: JUGADORES */}
              {detailTab === 'jugadores' && (
                <div>
                  {loadingJugadores ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                      Cargando jugadores...
                    </div>
                  ) : jugadoresClub.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <UserCheck size={40} className="mb-3 opacity-40" />
                      <p className="font-medium">Sin jugadores registrados</p>
                      <p className="text-sm mt-1">Este club aún no tiene jugadores.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Buscador + contador */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar jugador por nombre o CI..."
                            value={jugadorSearch}
                            onChange={(e) => setJugadorSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <span className="flex-shrink-0 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                          {jugadoresClub.length} jugador{jugadoresClub.length !== 1 ? 'es' : ''}
                        </span>
                      </div>

                      {/* Lista */}
                      <div className="space-y-2">
                        {jugadoresClub
                          .filter((j) => {
                            const p = j.Persona ?? j.persona ?? {};
                            const nombre = [p.nombre, p.ap, p.am].filter(Boolean).join(' ').toLowerCase();
                            const ci = (p.ci ?? '').toLowerCase();
                            const term = jugadorSearch.toLowerCase();
                            return nombre.includes(term) || ci.includes(term);
                          })
                          .map((j) => {
                            const p = j.Persona ?? j.persona ?? {};
                            const nombre = [p.nombre, p.ap, p.am].filter(Boolean).join(' ') || '—';
                            const iniciales = [p.nombre?.[0], p.ap?.[0]].filter(Boolean).join('').toUpperCase() || '?';
                            const genero = p.genero;
                            const fnac = p.fnac ? new Date(p.fnac).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
                            return (
                              <div key={j.id_jugador} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${genero === 'femenino' ? 'bg-pink-400' : genero === 'masculino' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                  {iniciales}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{nombre}</p>
                                  <p className="text-xs text-gray-400">
                                    {p.ci ? `CI: ${p.ci}` : 'Sin CI'}
                                    {fnac ? ` · ${fnac}` : ''}
                                  </p>
                                </div>

                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${j.estado ? 'bg-green-400' : 'bg-gray-300'}`} title={j.estado ? 'Activo' : 'Inactivo'} />
                              </div>
                            );
                          })}

                        {jugadorSearch && jugadoresClub.filter((j) => {
                          const p = j.Persona ?? j.persona ?? {};
                          const nombre = [p.nombre, p.ap, p.am].filter(Boolean).join(' ').toLowerCase();
                          const ci = (p.ci ?? '').toLowerCase();
                          return nombre.includes(jugadorSearch.toLowerCase()) || ci.includes(jugadorSearch.toLowerCase());
                        }).length === 0 && (
                          <p className="text-center text-gray-400 py-6 text-sm">No se encontraron jugadores con ese criterio.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
