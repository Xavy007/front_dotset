// ===============================================
// ARCHIVO: src/Security/router.jsx
// CONFIGURACIÓN DE RUTAS CON PROTECCIÓN
// ===============================================

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from '../Dashboard';
import LoginFuturistic from '../components/LoginFuturistic';
import ActivarCuenta from '../components/ActivarCuenta';
import SolicitarReset from '../components/SolicitarReset';
import ResetearPassword from '../components/ResetearPassword';
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
    path: '/activar/:token',
    element: <ActivarCuenta />,
  },
  {
    path: '/reset',
    element: <SolicitarReset />,
  },
  {
    path: '/reset/:token',
    element: <ResetearPassword />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;