// ===============================================
// ARCHIVO: src/App.jsx
// CONFIGURACIÓN DE RUTAS CON PROTECCIÓN
// ===============================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import LoginFuturistic from './components/LoginFuturistic';
import { ProtectedRoute } from './Security/ProtectedRoute';
import { isAuthenticated } from './utils/auth';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública - Login (/) */}
        <Route 
          path="/" 
          element={
            // Si ya está autenticado, redirigir al dashboard
            isAuthenticated() ? (
              <Navigate to="/app" replace />
            ) : (
              <LoginFuturistic />
            )
          } 
        />

        {/* Ruta protegida - Dashboard (/app) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 - Cualquier otra ruta redirige al login */}
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