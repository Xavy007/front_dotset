// ===============================================
// ARCHIVO: src/pages/CanchasPage.jsx
// CRUD COMPLETO DE CANCHAS - VERSIÓN MEJORADA
// ===============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Search, AlertCircle,
  Pencil, Power, Trash2, Home, Users, Building2,
  CalendarDays, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import { toast } from 'sonner';
import { API_BASE } from '../services/api.config.js';
import { tienePermiso, getUsuarioActual } from '../utils/permissions.js';

export function CanchasPage() {
  const [canchas, setCanchas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCancha, setEditingCancha] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Disponibilidad ---
  const [dispCancha, setDispCancha] = useState(null);
  const [dispFecha, setDispFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [dispPartidos, setDispPartidos] = useState([]);
  const [dispLoading, setDispLoading] = useState(false);

  const _rol = getUsuarioActual()?.rol || '';
  const puedeEditarCancha   = tienePermiso(_rol, 'canchas', 'actualizar');
  const puedeEliminarCancha = tienePermiso(_rol, 'canchas', 'eliminar');
  const puedeCrearCancha    = tienePermiso(_rol, 'canchas', 'crear');

  const API_URL = `${API_BASE}/cancha`;

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // ===============================================
  // NORMALIZAR DATOS
  // ===============================================
  const normalizarCancha = (c) => {
    const estadoBooleano = c.estado === true || c.estado === 1;
    return {
      ...c,
      id_cancha: c.id_cancha ?? c.id,
      nombre: c.nombre ?? '',
      descripcion: c.descripcion ?? '',
      direccion: c.direccion ?? '',
      ubicacion: c.ubicacion ?? '',
      tipo: c.tipo ?? 'otro',
      capacidad: c.capacidad ?? null,
      estadoBooleano,
      estadoVista: estadoBooleano ? 'activa' : 'inactiva',
      freg: c.freg ? new Date(c.freg).toLocaleDateString() : '—',
    };
  };

  // ===============================================
  // CARGAR CANCHAS CON useCallback
  // ===============================================
  const fetchCanchas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar canchas');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setCanchas(arr.map(normalizarCancha));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCanchas();
  }, [fetchCanchas]);

  // ===============================================
  // CREAR / EDITAR CANCHA
  // ===============================================
  const handleSubmit = async (formData) => {
    if (!formData.nombre?.trim()) { toast.error('El nombre de la cancha es obligatorio'); return; }
    if (!formData.tipo) { toast.error('Debes seleccionar el tipo de cancha'); return; }
    if (formData.capacidad && Number(formData.capacidad) < 0) {
      toast.error('La capacidad no puede ser negativa'); return;
    }
    try {
      const body = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion || null,
        direccion: formData.direccion || null,
        ubicacion: formData.ubicacion || null,
        tipo: formData.tipo || 'coliseo',
        capacidad: formData.capacidad ? Number(formData.capacidad) : null,
        estado: formData.estado === 'true' || formData.estado === true,
      };

      const method = editingCancha ? 'PUT' : 'POST';
      const url = editingCancha ? `${API_URL}/${editingCancha.id_cancha}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error al guardar la cancha');
      }

      await fetchCanchas();
      setIsModalOpen(false);
      setEditingCancha(null);
      toast.success('Cancha guardada correctamente');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // CAMBIAR ESTADO
  // ===============================================
  const toggleEstado = async (cancha) => {
    const nuevoEstado = !cancha.estadoBooleano;
    if (!window.confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta cancha?`)) return;

    try {
      const res = await fetch(`${API_URL}/${cancha.id_cancha}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error('Error al cambiar el estado');

      setCanchas(prev =>
        prev.map(c =>
          c.id_cancha === cancha.id_cancha
            ? { ...c, estadoBooleano: nuevoEstado, estadoVista: nuevoEstado ? 'activa' : 'inactiva' }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // ELIMINAR CANCHA
  // ===============================================
  const handleDelete = async (id_cancha) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar esta cancha?')) return;
    try {
      const res = await fetch(`${API_URL}/${id_cancha}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar la cancha');
      setCanchas(prev => prev.filter(c => c.id_cancha !== id_cancha));
      toast.success('Cancha eliminada correctamente');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ===============================================
  // DISPONIBILIDAD
  // ===============================================
  const fetchDisponibilidad = async (id_cancha, fecha) => {
    setDispLoading(true);
    setDispPartidos([]);
    try {
      const res = await fetch(`${API_URL}/${id_cancha}/partidos?fecha=${fecha}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Error al consultar disponibilidad');
      const data = await res.json();
      setDispPartidos(data.data || []);
    } catch (err) {
      console.error(err);
      setDispPartidos([]);
    } finally {
      setDispLoading(false);
    }
  };

  const abrirDisponibilidad = (cancha) => {
    setDispCancha(cancha);
    setDispFecha(new Date().toISOString().slice(0, 10));
    fetchDisponibilidad(cancha.id_cancha, new Date().toISOString().slice(0, 10));
  };

  const cambiarFechaDisp = (nuevaFecha) => {
    setDispFecha(nuevaFecha);
    if (dispCancha) fetchDisponibilidad(dispCancha.id_cancha, nuevaFecha);
  };

  const moverDia = (dias) => {
    const d = new Date(dispFecha + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    const nueva = d.toISOString().slice(0, 10);
    cambiarFechaDisp(nueva);
  };

  const P_ESTADO_LABEL = {
    programado:  { label: 'Programado',  cls: 'bg-blue-100 text-blue-700' },
    en_curso:    { label: 'En curso',    cls: 'bg-green-100 text-green-700' },
    finalizado:  { label: 'Finalizado',  cls: 'bg-gray-100 text-gray-600' },
    suspendido:  { label: 'Suspendido',  cls: 'bg-yellow-100 text-yellow-700' },
    cancelado:   { label: 'Cancelado',   cls: 'bg-red-100 text-red-600' },
  };

  // ===============================================
  // FILTRO DE BÚSQUEDA
  // ===============================================
  const filteredCanchas = canchas.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.tipo.toLowerCase().includes(term) ||
      c.direccion.toLowerCase().includes(term)
    );
  });

  // ===============================================
  // COLUMNAS TABLA
  // ===============================================
  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre', 
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Home size={20} className="text-white" />
          </div>
          <div className="font-bold text-gray-900">{v}</div>
        </div>
      )
    },
    { 
      key: 'tipo', 
      label: 'Tipo', 
      render: (v) => (
        <div className="flex items-center gap-2">
          {v === 'coliseo' ? <Building2 size={18} className="text-blue-600" /> : <Home size={18} className="text-green-600" />}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
            v === 'coliseo' ? 'bg-blue-100 text-blue-700'
            : v === 'abierta' ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
          }`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </div>
        </div>
      )
    },
    { 
      key: 'capacidad', 
      label: 'Capacidad', 
      render: (v) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span className="text-gray-700 font-medium">{v ? `${v} personas` : '—'}</span>
        </div>
      )
    },
    { 
      key: 'direccion', 
      label: 'Dirección', 
      render: (v) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-500" />
          <span className="text-gray-600">{v || '—'}</span>
        </div>
      )
    },
    {
      key: 'estadoVista',
      label: 'Estado',
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${row.estadoBooleano ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-semibold ${row.estadoBooleano ? 'text-green-700' : 'text-red-700'}`}>
            {row.estadoVista.charAt(0).toUpperCase() + row.estadoVista.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <button
            title="Ver disponibilidad"
            onClick={() => abrirDisponibilidad(row)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all"
          >
            <CalendarDays size={18} className="text-indigo-600" />
          </button>
          {puedeEditarCancha && (
            <button
              title="Editar"
              onClick={() => { setEditingCancha(row); setIsModalOpen(true); }}
              className="p-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
              <Pencil size={18} className="text-blue-600" />
            </button>
          )}
          {puedeEditarCancha && (
            <button
              title={row.estadoBooleano ? 'Desactivar' : 'Activar'}
              onClick={() => toggleEstado(row)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all"
            >
              <Power size={18} className={row.estadoBooleano ? 'text-green-600' : 'text-gray-400'} />
            </button>
          )}
          {puedeEliminarCancha && (
            <button
              title="Eliminar"
              onClick={() => handleDelete(row.id_cancha)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all"
            >
              <Trash2 size={18} className="text-red-600" />
            </button>
          )}
        </div>
      )
    }
  ];

  // ===============================================
  // FORMULARIO CAMPOS - MEJORADO CON COLS
  // ===============================================
  const formFields = [
    { 
      name: 'nombre', 
      label: 'Nombre de la Cancha', 
      type: 'text', 
      required: true,
      cols: 2,
      placeholder: 'Ej: Coliseo Municipal'
    },
    { 
      name: 'tipo',
      label: 'Tipo de Cancha',
      type: 'select',
      required: true,
      cols: 1,
      options: [
        { label: '🏢 Coliseo', value: 'coliseo' },
        { label: '🏖️ Abierta', value: 'abierta' },
        { label: '📍 Otro', value: 'otro' },
      ]
    },
    { 
      name: 'descripcion', 
      label: 'Descripción', 
      type: 'textarea', 
      required: false,
      cols: 3,
      rows: 3,
      placeholder: 'Características, servicios, etc.'
    },
    { 
      name: 'direccion', 
      label: 'Dirección', 
      type: 'text', 
      required: false,
      cols: 2,
      placeholder: 'Calle, número, barrio'
    },
    { 
      name: 'capacidad', 
      label: 'Capacidad (personas)', 
      type: 'number', 
      required: false, 
      min: 0,
      cols: 1,
      placeholder: '0'
    },
    { 
      name: 'ubicacion', 
      label: 'Ubicación (mapa o enlace)', 
      type: 'text', 
      required: false,
      cols: 2,
      placeholder: 'https://maps.google.com/...'
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      cols: 1,
      options: [
        { label: '✅ Activa', value: true },
        { label: '❌ Inactiva', value: false },
      ]
    },
  ];

  // ===============================================
  // ESTADÍSTICAS
  // ===============================================
  const totalActivas = canchas.filter(c => c.estadoBooleano).length;
  const totalInactivas = canchas.filter(c => !c.estadoBooleano).length;
  const totalColiseos = canchas.filter(c => c.tipo === 'coliseo').length;
  const totalAbiertas = canchas.filter(c => c.tipo === 'abierta').length;

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏟️ Canchas</h1>
        <p className="text-gray-600 mt-2">Gestiona las canchas o recintos deportivos del sistema.</p>
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
            placeholder="Buscar cancha (nombre, tipo o dirección)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {puedeCrearCancha && (
          <button
            onClick={() => { setEditingCancha(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            <Plus size={20} /> Nueva Cancha
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Canchas</p>
          <p className="text-2xl font-bold text-gray-900">{canchas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activas</p>
          <p className="text-2xl font-bold text-green-600">{totalActivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Inactivas</p>
          <p className="text-2xl font-bold text-red-600">{totalInactivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Coliseos / Abiertas</p>
          <p className="text-2xl font-bold text-orange-600">{totalColiseos} / {totalAbiertas}</p>
        </div>
      </div>

      <DataTable data={filteredCanchas} columns={columns} itemsPerPage={5} loading={loading} />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCancha(null); }}
        onSubmit={handleSubmit}
        title={editingCancha ? '✏️ Editar Cancha' : '➕ Registrar Nueva Cancha'}
        fields={formFields}
        initialData={editingCancha || {}}
        size="4xl"
      />
      {/* ── MODAL DISPONIBILIDAD ── */}
      {dispCancha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

            {/* Cabecera */}
            <div className="flex items-center gap-3 p-5 border-b bg-gradient-to-r from-indigo-600 to-blue-600 rounded-t-2xl">
              <CalendarDays size={22} className="text-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{dispCancha.nombre}</h2>
                <p className="text-indigo-100 text-xs">Disponibilidad por día</p>
              </div>
              <button onClick={() => setDispCancha(null)} className="text-white/70 hover:text-white transition">
                <XCircle size={22} />
              </button>
            </div>

            {/* Selector de fecha */}
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
              <button
                onClick={() => moverDia(-1)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <input
                type="date"
                value={dispFecha}
                onChange={(e) => cambiarFechaDisp(e.target.value)}
                className="flex-1 text-center border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => moverDia(1)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => cambiarFechaDisp(new Date().toISOString().slice(0, 10))}
                className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium"
              >
                Hoy
              </button>
            </div>

            {/* Estado general del día */}
            {!dispLoading && (
              <div className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold ${dispPartidos.length === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {dispPartidos.length === 0
                  ? <><CheckCircle2 size={18} /> Cancha disponible — sin partidos programados</>
                  : <><Clock size={18} /> {dispPartidos.length} partido{dispPartidos.length !== 1 ? 's' : ''} programado{dispPartidos.length !== 1 ? 's' : ''} este día</>
                }
              </div>
            )}

            {/* Lista de partidos */}
            <div className="flex-1 overflow-y-auto p-5 max-h-96">
              {dispLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mr-3" />
                  Consultando...
                </div>
              ) : dispPartidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <CalendarDays size={36} className="mb-2 opacity-40" />
                  <p className="text-sm">No hay partidos para esta fecha.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dispPartidos.map((p) => {
                    const hora = p.fecha_hora
                      ? new Date(p.fecha_hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const local     = p.equipoLocal?.nombre     ?? p.equipo_local_nombre     ?? '—';
                    const visitante = p.equipoVisitante?.nombre ?? p.equipo_visitante_nombre ?? '—';
                    const estado    = P_ESTADO_LABEL[p.p_estado] ?? { label: p.p_estado, cls: 'bg-gray-100 text-gray-600' };

                    return (
                      <div key={p.id_partido} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                          <Clock size={14} className="text-indigo-400 mb-0.5" />
                          <span className="text-sm font-bold text-indigo-700">{hora}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {local} <span className="text-gray-400 font-normal">vs</span> {visitante}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${estado.cls}`}>
                          {estado.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
