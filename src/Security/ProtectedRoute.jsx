import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export function ProtectedRoute({ children }) {
  
  if (!isAuthenticated()) {
  
    console.log('❌ No autenticado - Redirigiendo al login');
    return <Navigate to="/" replace />;
  }

  
  console.log('✅ Usuario autenticado - Acceso permitido');
  return children;
}