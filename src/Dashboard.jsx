import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { handleLogout } from './utils/auth';
import { puedeAccederModulo } from './utils/permissions';

// Importar nuevos componentes del dashboard
import VoleibolStatsGrid from './components/Voleibolstatsgrid';
import PartidosDelDia from './components/Partidosdeldia';
import CampeonatosChart from './components/Campeonatoschart';

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
import GenerarFixture from './pages/GenerarFixture';
import GestionPartidos from './pages/GestionPartidos';
import GestionInscripciones from './pages/GestionInscripciones';
import { PlanillaFIVB } from './pages/PlanillaFIVB';
import { TablaPosicionesPage } from './pages/TablaPosiciones';
import { AsociacionPage } from './pages/Asociacion';
import { EstadisticasPage } from './pages/EstadisticasPage';


// ================================================
//         FUNCIÓN PÁGINA: DASHBOARD
// ================================================

function DashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Resumen general del sistema de gestión de voleibol</p>
      </div>

      {/* Estadísticas principales */}
      <VoleibolStatsGrid />

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partidos del día (ocupa 2 columnas) */}
        <div className="lg:col-span-2">
          <PartidosDelDia />
        </div>

        {/* Estado de campeonatos (ocupa 1 columna) */}
        <div>
          <CampeonatosChart />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const isMobileWidth = () => window.innerWidth < 1024;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobileWidth());
  const [isMobile, setIsMobile] = useState(isMobileWidth());
  const [currentPage, setCurrentPage] = useState(() => sessionStorage.getItem('currentPage') || 'dashboard');
  const [userName, setUserName] = useState('');
  const [userRol, setUserRol] = useState('');
  const [usuario, setUsuario] = useState(null);

  // Ajustar sidebar al cambiar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobileWidth();
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('usuario');
    const rol = raw ? JSON.parse(raw).rol : null;
    setUserRol(rol);
    if (raw) {
      try {
        const userObject = JSON.parse(raw);
        setUsuario(userObject);
        setUserName(userObject.nombre || userObject.name || 'Usuario');
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        setUserName('Usuario');
      }
    } else {
      setUserName('Invitado');
    }
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    sessionStorage.setItem('currentPage', page);
    if (isMobile) setSidebarOpen(false);
  };

  // Renderizar la página actual (valida permisos antes de renderizar)
  const renderPage = () => {
    if (currentPage !== 'dashboard' && !puedeAccederModulo(currentPage)) {
      return <DashboardPage />;
    }
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
      case 'generar-fixture':
        return <GenerarFixture />;
      case 'gestion-partidos':
        return <GestionPartidos />;
      case 'gestion-inscripciones':
        return <GestionInscripciones />;
      case 'planilla':
        return <PlanillaFIVB />;
      case 'tabla-posiciones':
        return <TablaPosicionesPage />;
      case 'asociacion':
        return <AsociacionPage />;
      case 'estadisticas':
        return <EstadisticasPage />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Backdrop para móvil */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userRol={userRol}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header
          usuario={usuario}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}