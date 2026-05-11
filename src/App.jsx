// ===============================================
// ARCHIVO: src/App.jsx
// CONFIGURACIÓN DE RUTAS CON PROTECCIÓN
// ===============================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import LoginFuturistic from './components/LoginFuturistic';
import SetupPage from './components/SetupPage';
import ActivarCuenta from './components/ActivarCuenta';
import { ProtectedRoute } from './Security/ProtectedRoute';
import { isAuthenticated } from './utils/auth';
import './index.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function App() {
  const [inicializado, setInicializado] = useState(null);
  const activarMatch = window.location.pathname.match(/^\/activar\/(.+)$/);
  console.log('[App] pathname:', window.location.pathname, '| activarMatch:', activarMatch);

  useEffect(() => {
    if (activarMatch) return; // no necesitamos verificar inicialización en esta ruta
    fetch(`${API}/asociacion/estado`)
      .then((r) => r.json())
      .then((data) => setInicializado(data.inicializado ?? true))
      .catch(() => setInicializado(true));
  }, []);

  // Ruta de activación: bypasea router y verificación de asociación
  if (activarMatch) {
    return <ActivarCuenta token={activarMatch[1]} />;
  }

  if (inicializado === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29' }}>
        <span style={{ color: '#fff', fontSize: '1.1rem' }}>Cargando...</span>
      </div>
    );
  }

  if (!inicializado) {
    return <SetupPage onComplete={() => setInicializado(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated() ? <Navigate to="/app" replace /> : <LoginFuturistic />}
        />
        <Route
          path="/app"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
/*import React from 'react';
import Dashboard from './Dashboard';
import './index.css';

export default function App() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        { Otras rutas }
      </Routes>
    </Router>
  );
}*/