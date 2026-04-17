import React, { useState, useEffect, useRef } from 'react';
import { Building2, Save, Upload, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { toast } from 'sonner';
import { API_BASE, SERVER_URL } from '../services/api.config.js';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return { ...(token && { Authorization: `Bearer ${token}` }) };
};

export function AsociacionPage() {
  const [datos, setDatos] = useState({
    nombre: '', acronimo: '', ciudad: '', departamento: '',
    direccion: '', telefono: '', email: '', sitio_web: '',
    federacion: '', descripcion: ''
  });
  const [logoActual, setLogoActual] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => { fetchDatos(); }, []);

  const fetchDatos = async () => {
    try {
      const res  = await fetch(`${API_BASE}/asociacion`);
      const data = await res.json();
      if (data.success && data.data) {
        const a = data.data;
        setDatos({
          nombre:      a.nombre      || '',
          acronimo:    a.acronimo    || '',
          ciudad:      a.ciudad      || '',
          departamento:a.departamento|| '',
          direccion:   a.direccion   || '',
          telefono:    a.telefono    || '',
          email:       a.email       || '',
          sitio_web:   a.sitio_web   || '',
          federacion:  a.federacion  || '',
          descripcion: a.descripcion || '',
        });
        setLogoActual(a.logo || null);
      }
    } catch {
      toast.error('Error al cargar datos de la asociación');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!datos.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(datos).forEach(([k, v]) => formData.append(k, v));
      if (logoFile) formData.append('logo', logoFile);

      const res  = await fetch(`${API_BASE}/asociacion`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar');
      toast.success('Datos guardados correctamente');
      setLogoFile(null);
      setLogoPreview(null);
      await fetchDatos();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const logoUrl = logoPreview
    || (logoActual ? `${SERVER_URL}${logoActual.startsWith('/') ? logoActual : '/' + logoActual}` : null);

  const Field = ({ label, name, type = 'text', placeholder = '', required = false, textarea = false }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name} value={datos[name]} onChange={handleChange}
          placeholder={placeholder} rows={3}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <input
          type={type} name={name} value={datos[name]} onChange={handleChange}
          placeholder={placeholder} required={required}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      Cargando datos...
    </div>
  );

  return (
    <div>
      <PageHeader icon={Building2} title="Asociación" subtitle="Datos institucionales de la asociación." />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

        {/* Logo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Logo de la asociación</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={32} className="text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Upload size={16} /> Subir logo
              </button>
              {(logoPreview || logoActual) && (
                <button type="button" onClick={handleRemoveLogo}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <X size={16} /> Quitar logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, JPG — máx. 5 MB</p>
            </div>
          </div>
        </div>

        {/* Datos generales */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Datos generales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nombre oficial" name="nombre" required placeholder="Ej: Asociación Municipal de Voleibol de Sucre" />
            </div>
            <Field label="Acrónimo" name="acronimo" placeholder="Ej: AMVS" />
            <Field label="Federación" name="federacion" placeholder="Ej: Federación Boliviana de Voleibol" />
            <Field label="Ciudad" name="ciudad" placeholder="Ej: Sucre" />
            <Field label="Departamento" name="departamento" placeholder="Ej: Chuquisaca" />
            <div className="sm:col-span-2">
              <Field label="Dirección" name="direccion" placeholder="Ej: Av. Venezuela Nº 123" />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Contacto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Teléfono" name="telefono" type="tel" placeholder="Ej: +591 4 6451234" />
            <Field label="Correo electrónico" name="email" type="email" placeholder="Ej: contacto@amvs.bo" />
            <div className="sm:col-span-2">
              <Field label="Sitio web" name="sitio_web" type="url" placeholder="Ej: https://amvs.bo" />
            </div>
            <div className="sm:col-span-2">
              <Field label="Descripción" name="descripcion" textarea placeholder="Breve descripción de la asociación..." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
