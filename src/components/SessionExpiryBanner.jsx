import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { handleLogout } from '../utils/auth';

export default function SessionExpiryBanner({ secondsLeft, onRenew }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')} min`
    : `${secs} seg`;
  const isUrgent = secondsLeft <= 30;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
        isUrgent
          ? 'bg-red-600 border-red-500 text-white'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}
    >
      <Clock size={18} className={isUrgent ? 'text-white' : 'text-amber-600'} />

      <span>
        Tu sesión expira en{' '}
        <strong className={isUrgent ? 'text-white' : 'text-amber-700'}>
          {timeStr}
        </strong>
      </span>

      <button
        onClick={onRenew}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
          isUrgent
            ? 'bg-white text-red-600 hover:bg-red-50'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        }`}
      >
        <RefreshCw size={14} />
        Renovar sesión
      </button>

      <button
        onClick={handleLogout}
        title="Cerrar sesión ahora"
        className={`p-1 rounded transition-opacity opacity-50 hover:opacity-100 ${
          isUrgent ? 'text-white' : 'text-amber-800'
        }`}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
