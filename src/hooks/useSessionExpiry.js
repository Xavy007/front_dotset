import { useState, useEffect, useCallback, useRef } from 'react';
import { handleLogout } from '../utils/auth';
import { API_BASE } from '../services/api.config';

const WARNING_SECONDS = 120; // mostrar aviso 2 minutos antes de que expire

const getTokenExp = () => {
  const token = sessionStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000;
  } catch {
    return null;
  }
};

export function useSessionExpiry() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const timers = useRef({ warn: null, expire: null, countdown: null });

  const clearTimers = () => {
    clearTimeout(timers.current.warn);
    clearTimeout(timers.current.expire);
    clearInterval(timers.current.countdown);
  };

  const startCountdown = useCallback((initialSeconds) => {
    clearInterval(timers.current.countdown);
    setSecondsLeft(initialSeconds);
    setShowWarning(true);
    timers.current.countdown = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timers.current.countdown);
          handleLogout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const schedule = useCallback(() => {
    clearTimers();
    const exp = getTokenExp();
    if (!exp) return;

    const msLeft = exp - Date.now();
    if (msLeft <= 0) { handleLogout(); return; }

    const warnIn = msLeft - WARNING_SECONDS * 1000;

    if (warnIn <= 0) {
      startCountdown(Math.max(1, Math.ceil(msLeft / 1000)));
    } else {
      timers.current.warn = setTimeout(() => {
        startCountdown(WARNING_SECONDS);
      }, warnIn);
      timers.current.expire = setTimeout(handleLogout, msLeft);
    }
  }, [startCountdown]);

  const renew = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('refresh_failed');
      const { token } = await res.json();
      sessionStorage.setItem('token', token);
      if (localStorage.getItem('token')) localStorage.setItem('token', token);
      setShowWarning(false);
      schedule();
    } catch {
      handleLogout();
    }
  }, [schedule]);

  useEffect(() => {
    schedule();
    return clearTimers;
  }, [schedule]);

  return { showWarning, secondsLeft, renew };
}
