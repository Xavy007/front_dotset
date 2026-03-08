import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../services/api.config'

export default function LoginFuturistic() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTime, setBlockTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const MAX_ATTEMPTS = 5
  const BLOCK_TIME = 2 * 60 * 1000 // 2 minutos en milisegundos
  const API_URL = `${API_BASE}/auth/login`

  // ========== VERIFICAR SI ESTÁ BLOQUEADO AL CARGAR ==========
  useEffect(() => {
    const blocked = localStorage.getItem('loginBlocked')
    const blockedUntil = localStorage.getItem('blockedUntil')
    
    if (blocked === 'true' && blockedUntil) {
      const now = Date.now()
      const blockEndTime = parseInt(blockedUntil)
      
      if (now < blockEndTime) {
        setIsBlocked(true)
        setBlockTime(blockEndTime)
        
        // Timer para desbloquear automáticamente
        const timeout = setTimeout(() => {
          unlockLogin()
        }, blockEndTime - now)
        
        return () => clearTimeout(timeout)
      } else {
        unlockLogin()
      }
    }

    // Recuperar intentos fallidos previos
    const savedAttempts = localStorage.getItem('loginAttempts')
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }
  }, [])

  // ========== FUNCIÓN PARA DESBLOQUEAR ==========
  const unlockLogin = () => {
    localStorage.removeItem('loginBlocked')
    localStorage.removeItem('blockedUntil')
    localStorage.removeItem('loginAttempts')
    setIsBlocked(false)
    setBlockTime(null)
    setAttempts(0)
    setError('')
  }

  // ========== FUNCIÓN PARA BLOQUEAR ==========
  const blockLogin = () => {
    const blockUntil = Date.now() + BLOCK_TIME
    localStorage.setItem('loginBlocked', 'true')
    localStorage.setItem('blockedUntil', blockUntil.toString())
    setIsBlocked(true)
    setBlockTime(blockUntil)
    setError('Demasiados intentos fallidos. Cuenta bloqueada por 2 minutos.')
  }

  // ========== CONTADOR DE TIEMPO RESTANTE ==========
  const [timeRemaining, setTimeRemaining] = useState('')
  
  useEffect(() => {
    if (!isBlocked || !blockTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = blockTime - now

      if (remaining <= 0) {
        unlockLogin()
      } else {
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isBlocked, blockTime])

  // ========== FUNCIÓN DE LOGIN CON API REAL ==========
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Verificar si está bloqueado
    if (isBlocked) {
      setError(`Cuenta bloqueada. Intenta de nuevo en ${timeRemaining}`)
      setLoading(false)
      return
    }

    // Validación básica
    if (!email || !pass) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: pass
        })
      })

      const data = await response.json()
      console.log(data)
      if (response.ok) {
        
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('loginBlocked')
        localStorage.removeItem('blockedUntil')
        
        // Guardar token y datos del usuario (por pestaña — sessionStorage)
        if (data.token) {
          sessionStorage.setItem('token', data.token)
        }

        if (data.usuario) {
          sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
        }

        navigate('/app')
      } else {
        // ❌ CREDENCIALES INCORRECTAS
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('loginAttempts', newAttempts.toString())

        const remainingAttempts = MAX_ATTEMPTS - newAttempts

        if (newAttempts >= MAX_ATTEMPTS) {
          blockLogin()
        } else {
          // Usar el mensaje del servidor si existe, sino usar uno genérico
          const errorMessage = data.message || data.error || 'Credenciales incorrectas'
          setError(`${errorMessage}. Te quedan ${remainingAttempts} ${remainingAttempts === 1 ? 'intento' : 'intentos'}.`)
        }
      }
    } catch (err) {
      // ❌ ERROR DE RED O SERVIDOR
      console.error('Error de conexión:', err)
      setError('Error de conexión. Verifica que el servidor esté corriendo en http://localhost:8080')
    } finally {
      setLoading(false)
    }
  }

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
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl border border-white/20 shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-90">
                <path fill="currentColor" d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a1 1 0 0 1 1-1zm2 0h8V8a4 4 0 1 0-8 0z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-wide">
              Acceso <span className="text-[--color-neon]">DOT</span>
              <span className="text-[--color-neon-2]">SET</span>
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Autentícate para continuar
            </p>
          </header>

          {/* MENSAJE DE CUENTA BLOQUEADA */}
          {isBlocked && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-red-400">
                  <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4m0 6a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V8a1 1 0 0 1 1-1m0 8a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1z"/>
                </svg>
                <span className="font-bold text-red-400">Cuenta Bloqueada</span>
              </div>
              <p className="text-sm text-red-300">
                Demasiados intentos fallidos
              </p>
              <p className="text-2xl font-bold text-red-400 mt-2">
                {timeRemaining}
              </p>
              <p className="text-xs text-red-300 mt-1">
                Tiempo restante
              </p>
            </div>
          )}

          {/* MENSAJE DE ERROR */}
          {error && !isBlocked && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* CONTADOR DE INTENTOS */}
          {attempts > 0 && !isBlocked && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-400">Intentos fallidos:</span>
                <span className="font-bold text-yellow-400">{attempts} / {MAX_ATTEMPTS}</span>
              </div>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300"
                  style={{ width: `${(attempts / MAX_ATTEMPTS) * 100}%` }}
                />
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            {/* Email */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Correo</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8l10-5.8V6a2 2 0 0 0-2-2m0 6.4l-8.6 5a1 1 0 0 1-.8 0L2 10.4V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBlocked || loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 outline-none ring-0 placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="javier@gmail.com"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block text-sm">
              <span className="mb-2 inline-block text-white/80">Contraseña</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7 14a5 5 0 0 1 8.66-3.44l5.78-5.78L23 4.34l-5.78 5.78A5 5 0 0 1 7 14m0 0H2v4h4v-2h1z"/>
                  </svg>
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  disabled={isBlocked || loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-10 py-3 pr-12 outline-none ring-0 placeholder:text-white/40 focus:border-[--color-neon] focus:bg-white/7 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShow(s => !s)}
                  disabled={isBlocked || loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-50"
                >
                  {show ? (
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

            <div className="mt-1 flex items-center justify-between text-sm text-white/70">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" className="size-4 accent-[--color-neon]" disabled={isBlocked || loading} />
                Recuérdame
              </label>
              <button type="button" className="text-[--color-neon-2] hover:underline" disabled={isBlocked || loading}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={isBlocked || loading}
              className="btn-glow mt-2 w-full rounded-xl bg-gradient-to-r from-[--color-neon] to-[--color-neon-2] px-4 py-3 font-medium tracking-wide text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[--color-neon-2]/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verificando...
                </>
              ) : isBlocked ? (
                'Cuenta Bloqueada'
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-white/50">
            <span className="h-px flex-1 bg-white/15" />
            <span className="text-xs uppercase tracking-wider">o</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

        </div>
      </div>
    </div>
  )
}