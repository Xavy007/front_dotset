import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './Security/router.jsx';
import SetupPage from './components/SetupPage.jsx';
import './index.css'
import { Toaster } from 'sonner'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function Root() {
  const [inicializado, setInicializado] = useState(null);

  useEffect(() => {
    fetch(`${API}/asociacion/estado`)
      .then(r => r.json())
      .then(data => setInicializado(data.inicializado ?? true))
      .catch(() => setInicializado(true));
  }, []);

  if (inicializado === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <span style={{ color: '#fff', fontSize: '1.1rem' }}>Cargando...</span>
      </div>
    );
  }

  if (!inicializado) {
    return <SetupPage onComplete={() => setInicializado(true)} />;
  }

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
    <Toaster position="top-right" richColors closeButton duration={3000} />
  </React.StrictMode>,
)
