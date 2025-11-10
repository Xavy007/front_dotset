// ===============================================
// ARCHIVO: src/Security/router.jsx
// CONFIGURACIÓN DE RUTAS CON PROTECCIÓN
// ===============================================

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from '../Dashboard';
import LoginFuturistic from '../components/LoginFuturistic';
import { ProtectedRoute } from '../Security/ProtectedRoute';
import { isAuthenticated } from '../utils/auth';

const router = createBrowserRouter([
  {
    path: '/',
    element: isAuthenticated() ? <Navigate to="/app" replace /> : <LoginFuturistic />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;