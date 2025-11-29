import React, { useState, useEffect } from 'react';
import StatsGrid from './components/StatsGrid';
import ChartSection from './components/ChartSection';
import RecentActivity from './components/RecentActivity';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Importar páginas
import { UsuariosPage } from './pages/Usuario';
import { ReportesPage } from './pages/ReportesPage';
import { ClubesPage } from './pages/Clubes';
import { JugadoresPage } from './pages/Jugadores';
import { EqTecnicoPage } from './pages/Eq.Tecnico';
import { JuecesPage } from './pages/Jueces';
import { EquiposPage } from './pages/Equipos';
import { CampeonatosPage } from './pages/Campeonatos';
import { CanchasPage } from './pages/Canchas';
import { PartidosPage } from './pages/Partidos';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { CategoriasPage } from './pages/Categorias';
import { GestionesPage } from './pages/Gestiones';
// ================================================
//         FUNCIÓN PÁGINA: DASHBOARD
// ================================================

function DashboardPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido de vuelta! Aquí está el resumen de tu negocio.</p>
      </div>
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSection />
        </div>
        <RecentActivity />
      </div>
    </>
  );
}

export default function Dashboard() {
  // Estados
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userName, setUserName] = useState(''); 
  const [userRol, setUserRol] = useState(''); 
  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    const rol = raw ? JSON.parse(raw).rol : null; 
    console.log(rol);
    setUserRol(rol);
    const user = localStorage.getItem('usuario');
    console.log(user);
    if (user) {
      try {
        const userObject = JSON.parse(user);
        setUserName(userObject.name || 'Usuario'); 
        console.log('Usuario cargado:', userObject);
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        setUserName('Usuario');
      }
    } else {
      console.log('No hay usuario guardado en localStorage.');
      setUserName('Invitado');
    }
  }, []);

  // Renderizar la página actual
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'usuarios':
        return <UsuariosPage />;
      case 'reportes':
        return <ReportesPage />;
      case 'club':
        return <ClubesPage />;
      case 'jugadores':
        return <JugadoresPage />;
      case 'eqtecnico':
        return <EqTecnicoPage />;
      case 'jueces':
        return <JuecesPage />;
      case 'equipos':
        return <EquiposPage />;
      case 'campeonatos':
        return <CampeonatosPage />;
      case 'canchas':
        return <CanchasPage />;
      case 'partidos':
        return <PartidosPage />;
      case 'categorias':
        return <CategoriasPage />;
      case 'configuracion':
        return <ConfiguracionPage />;
      case 'gestiones':
        return <GestionesPage />;
        
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        className="lg:w-64 w-16"
        userRol={userRol} 
                />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName}
        />

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
