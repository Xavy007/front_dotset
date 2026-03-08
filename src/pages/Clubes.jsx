// ===============================================
// ARCHIVO: src/pages/ClubesPage.jsx
// PÁGINA DE GESTIÓN DE CLUBES CON SUBIDA DE ARCHIVOS
// ===============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, AlertCircle,
  Pencil, Globe, Mail, Phone, Power, Trash2, Shield, X
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';

export function ClubesPage() {
  const [clubes, setClubes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // ← Para preview de imagen

  const API_URL = 'http://localhost:8080/api/club';

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
      alert('Club guardado correctamente');
    } catch (err) {
      console.error('❌ Error completo:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (club) => {
    const nuevoEstado = !club.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este club?`)) return;

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
      
      alert(`Club ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ===============================================
  // ELIMINAR CLUB
  // ===============================================
  const handleDelete = async (id_club) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este club?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_club}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el club');
      setClubes(prev => prev.filter(c => c.id_club !== id_club));
      alert('Club eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

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
      : `http://localhost:8080${value.startsWith('/') ? value : '/' + value}`;
    
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
          <IconBtn title="Editar" onClick={() => { 
            setEditingClub(row); 
            setPreviewUrl(null);
            setIsModalOpen(true); 
          }}>
            <Pencil size={18} />
          </IconBtn>
          <IconBtn
            title={row.estadoBooleano ? 'Desactivar Club' : 'Activar Club'}
            onClick={() => toggleEstado(row)}
          >
            <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
          </IconBtn>
          <IconBtn title="Eliminar Club" onClick={() => handleDelete(row.id_club)} danger>
            <Trash2 size={18} />
          </IconBtn>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏟️ Clubes</h1>
        <p className="text-gray-600 mt-2">Administra los clubes registrados en el sistema.</p>
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
            placeholder="Buscar club (nombre, email o sigla)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { 
            setEditingClub(null); 
            setPreviewUrl(null);
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nuevo Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Clubes</p>
          <p className="text-2xl font-bold text-gray-900">{clubes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-green-600">{totalActivos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Con Personería Jurídica</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPersoneria}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto rounded-full"></div>
          <p className="mt-3 text-gray-600">Cargando clubes...</p>
        </div>
      ) : (
        <DataTable data={filteredClubes} columns={columns} itemsPerPage={5} />
      )}

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
    </div>
  );
}
