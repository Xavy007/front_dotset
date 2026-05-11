import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api.config';

export default function SolicitarReset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetch(`${API_BASE}/usuario/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Siempre mostramos éxito (el backend no revela si el email existe)
      setEnviado(true);
    } catch {
      setError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(0,0,0,0) 70%)' }} />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(0,0,0,0) 70%)' }} />
      </div>

      <div className="absolute inset-0 bg-dots opacity-60" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl items-center justify-center px-6">
        <div className="glass neon-border w-full max-w-md rounded-2xl p-8">

          {enviado ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                <svg width="32" height="32" viewBox="0 0 24 24" className="text-green-400">
                  <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8l10-5.8V6a2 2 0 0 0-2-2m0 6.4l-8.6 5a1 1 0 0 1-.8 0L2 10.4V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-400 mb-2">¡Correo enviado!</h2>
              <p className="text-white/70 text-sm mb-6">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña.<br />
                Revisa también tu carpeta de spam.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-[--color-neon-2] hover:underline"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              <header className="mb-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/20 shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-90">
                    <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8l10-5.8V6a2 2 0 0 0-2-2m0 6.4l-8.6 5a1 1 0 0 1-.8 0L2 10.4V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold tracking-wide">
                  ¿Olvidaste tu <span className="text-[--color-neon]">contraseña</span>?
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  Ingresa tu email y te enviaremos un enlace para restablecerla
                </p>
              </header>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block text-sm">
                  <span className="mb-2 inline-block text-white/80">Correo electrónico</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8l10-5.8V6a2 2 0 0 0-2-2m0 6.4l-8.6 5a1 1 0 0 1-.8 0L2 10.4V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 outline-none ring-0 placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                      placeholder="tu@email.com"
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
                      Enviando...
                    </>
                  ) : 'Enviar enlace'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
