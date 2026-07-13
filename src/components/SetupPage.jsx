import { useState, useEffect } from 'react';
import { traducirError } from '../utils/traducirError';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function SetupPage({ onComplete }) {
  const [form, setForm] = useState({
    nombre: '', acronimo: '', ciudad: '', departamento: '', email: '', telefono: '',
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [idDepto, setIdDepto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar departamentos al montar
  useEffect(() => {
    fetch(`${API}/departamentos`)
      .then(r => r.json())
      .then(data => setDepartamentos(data.data || data))
      .catch(() => {});
  }, []);

  // Cargar provincias cuando cambia el departamento
  useEffect(() => {
    if (!idDepto) { setProvincias([]); return; }
    fetch(`${API}/provincias?id_departamento=${idDepto}`)
      .then(r => r.json())
      .then(data => setProvincias(data.data || data))
      .catch(() => {});
  }, [idDepto]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDeptoChange = (e) => {
    const selected = departamentos.find(d => d.id_departamento === Number(e.target.value));
    setIdDepto(e.target.value);
    setForm(f => ({ ...f, departamento: selected?.nombre || '', ciudad: '' }));
    setProvincias([]);
  };

  const handleProvinciaChange = (e) => {
    const selected = provincias.find(p => p.id_provincia === Number(e.target.value));
    setForm(f => ({ ...f, ciudad: selected?.nombre || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre de la asociación es obligatorio.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/asociacion/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar');
      onComplete();
    } catch (err) {
      setError(traducirError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950 text-white">
      {/* Gradientes de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(0,0,0,0) 70%)' }} />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(0,0,0,0) 70%)' }} />
      </div>

      <div className="absolute inset-0 bg-dots opacity-60" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl items-center justify-center px-6 py-12">
        <div className="glass neon-border w-full max-w-lg rounded-2xl p-8">

          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/20 shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-90">
                <path fill="currentColor" d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-wide">
              Bienvenido a <span className="text-[--color-neon]">DOT</span><span className="text-[--color-neon-2]">SET</span>
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Configura los datos de tu asociación para comenzar
            </p>
          </header>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Nombre */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Nombre de la asociación *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                  </svg>
                </span>
                <input
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 outline-none placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                  placeholder="Ej: Asociación de Voleibol Tarija"
                />
              </div>
            </label>

            {/* Acrónimo */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Acrónimo</span>
              <input
                name="acronimo"
                value={form.acronimo}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                placeholder="Ej: AVT"
              />
            </label>

            {/* Departamento — select desde BD */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Departamento</span>
              <select
                value={idDepto}
                onChange={handleDeptoChange}
                disabled={loading}
                className="w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 outline-none focus:border-[--color-neon] disabled:opacity-50 text-white"
              >
                <option value="">— Selecciona un departamento —</option>
                {departamentos.map(d => (
                  <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
                ))}
              </select>
            </label>

            {/* Ciudad/Provincia — select filtrado por departamento */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Ciudad / Provincia</span>
              <select
                value={provincias.find(p => p.nombre === form.ciudad)?.id_provincia || ''}
                onChange={handleProvinciaChange}
                disabled={loading || !idDepto}
                className="w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 outline-none focus:border-[--color-neon] disabled:opacity-50 text-white"
              >
                <option value="">— Selecciona una provincia —</option>
                {provincias.map(p => (
                  <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>
                ))}
              </select>
            </label>

            {/* Email */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Email de contacto</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8l10-5.8V6a2 2 0 0 0-2-2m0 6.4l-8.6 5a1 1 0 0 1-.8 0L2 10.4V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 outline-none placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                  placeholder="contacto@asociacion.com"
                />
              </div>
            </label>

            {/* Teléfono */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Teléfono</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24c1.12.37 2.33.57 3.57.57c.55 0 1 .45 1 1V20c0 .55-.45 1-1 1c-9.39 0-17-7.61-17-17c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1c0 1.25.2 2.45.57 3.57c.11.35.03.74-.25 1.02z"/>
                  </svg>
                </span>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 outline-none placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                  placeholder="+591 4 1234567"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow mt-2 w-full rounded-xl bg-gradient-to-r from-[--color-neon] to-[--color-neon-2] px-4 py-3 font-medium tracking-wide text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[--color-neon-2]/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Guardando...
                </>
              ) : 'Guardar y continuar'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
