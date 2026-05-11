import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api.config';

export default function ActivarCuenta() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/activar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al activar cuenta');
      setExito(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950 text-white">
      {/* Gradientes de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full blur-3xl"
             style={{background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(0,0,0,0) 70%)'}}/>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
             style={{background: 'radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(0,0,0,0) 70%)'}}/>
      </div>

      <div className="absolute inset-0 bg-dots opacity-60" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl items-center justify-center px-6">
        <div className="glass neon-border w-full max-w-md rounded-2xl p-8">

          {exito ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                <svg width="32" height="32" viewBox="0 0 24 24" className="text-green-400">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-400 mb-2">¡Cuenta activada!</h2>
              <p className="text-white/70 text-sm">Tu contraseña fue establecida correctamente.<br/>Serás redirigido al login en unos segundos.</p>
            </div>
          ) : (
            <>
              <header className="mb-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/20 shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-90">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4m0 10h7c-.53 3.08-2.93 5.7-7 6.93V12H5V6.3l7-3.11V11z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold tracking-wide">
                  Activa tu <span className="text-[--color-neon]">cuenta</span>
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  Elige una contraseña segura para continuar
                </p>
              </header>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Nueva contraseña */}
                <label className="block text-sm">
                  <span className="mb-2 inline-block text-white/80">Nueva contraseña (mínimo 12 caracteres)</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M7 14a5 5 0 0 1 8.66-3.44l5.78-5.78L23 4.34l-5.78 5.78A5 5 0 0 1 7 14m0 0H2v4h4v-2h1z"/>
                      </svg>
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 pr-12 outline-none ring-0 placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      {showPass ? (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M2.39 1.73L1.11 3l4.05 4.05C3.2 8.42 1.73 10.08 1 12c1.73 4.39 6 7.5 11 7.5c2 0 3.87-.5 5.5-1.36l3.39 3.39l1.27-1.27L2.39 1.73M12 6.5c3 0 5.8 1.64 7.34 4.13c-.51 1-1.26 1.87-2.16 2.57l-1.46-1.46A3.95 3.95 0 0 0 12 8.5c-.37 0-.73.05-1.07.14L9.3 7.01c.84-.33 1.77-.51 2.7-.51M7.58 9.08l1.57 1.57c-.1.26-.15.55-.15.85a2.99 2.99 0 0 0 3 3c.3 0 .59-.05.85-.15l1.57 1.57c-.7.9-1.58 1.65-2.58 2.16A8.5 8.5 0 0 1 3.66 12c.51-1.01 1.26-1.88 2.16-2.92l1.76 0z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5m0 12.5A5 5 0 1 1 12 7a5 5 0 0 1 0 10.5m0-2.5a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* Confirmar contraseña */}
                <label className="block text-sm">
                  <span className="mb-2 inline-block text-white/80">Confirmar contraseña</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M7 14a5 5 0 0 1 8.66-3.44l5.78-5.78L23 4.34l-5.78 5.78A5 5 0 0 1 7 14m0 0H2v4h4v-2h1z"/>
                      </svg>
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 pr-12 outline-none ring-0 placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      {showConfirm ? (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M2.39 1.73L1.11 3l4.05 4.05C3.2 8.42 1.73 10.08 1 12c1.73 4.39 6 7.5 11 7.5c2 0 3.87-.5 5.5-1.36l3.39 3.39l1.27-1.27L2.39 1.73M12 6.5c3 0 5.8 1.64 7.34 4.13c-.51 1-1.26 1.87-2.16 2.57l-1.46-1.46A3.95 3.95 0 0 0 12 8.5c-.37 0-.73.05-1.07.14L9.3 7.01c.84-.33 1.77-.51 2.7-.51M7.58 9.08l1.57 1.57c-.1.26-.15.55-.15.85a2.99 2.99 0 0 0 3 3c.3 0 .59-.05.85-.15l1.57 1.57c-.7.9-1.58 1.65-2.58 2.16A8.5 8.5 0 0 1 3.66 12c.51-1.01 1.26-1.88 2.16-2.92l1.76 0z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5m0 12.5A5 5 0 1 1 12 7a5 5 0 0 1 0 10.5m0-2.5a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/>
                        </svg>
                      )}
                    </button>
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
                      Activando...
                    </>
                  ) : 'Activar cuenta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
