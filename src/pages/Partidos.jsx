import React, { useState } from 'react';
import { Clock, MapPin, Users, Search, X, Edit2, CheckCircle, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp, Eye, Zap } from 'lucide-react';

export const PartidosPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('masculino');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, assigned, pending
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showScoresheet, setShowScoresheet] = useState(false);
  //const [scoresheetMatch, setScoresheetMatch] = useState(null);
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const [pdfFilters, setPdfFilters] = useState({
    groupBy: 'date', // 'court', 'week', 'category', 'date'
    selectedWeeks: [],
    selectedCategories: [selectedCategory],
    selectedCourts: [],
    onlyScheduled: false // Nuevo filtro
  });
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const [matches, setMatches] = useState({
    masculino: [
      { id: 1, week: 1, team1: 'Equipo A', team2: 'Equipo B', clubLogo1: '🔵', clubLogo2: '⚪', date: '2024-01-15', time: '10:00', court: 'Cancha 1', referees: { mainReferee: 'Juan Pérez', secondReferee: '', scorekeeper: '' }, assigned: true, score: { team1: 3, team2: 2 }, status: 'finished' },
      { id: 2, week: 1, team1: 'Equipo C', team2: 'Equipo D', clubLogo1: '🔴', clubLogo2: '🟡', date: null, time: null, court: null, referees: { mainReferee: '', secondReferee: '', scorekeeper: '' }, assigned: false, score: null, status: 'pending' },
      { id: 3, week: 2, team1: 'Equipo A', team2: 'Equipo C', clubLogo1: '🔵', clubLogo2: '🔴', date: '2024-01-22', time: '15:00', court: 'Cancha 2', referees: { mainReferee: 'María García', secondReferee: '', scorekeeper: '' }, assigned: true, score: null, status: 'scheduled' },
      { id: 4, week: 2, team1: 'Equipo B', team2: 'Equipo D', clubLogo1: '⚪', clubLogo2: '🟡', date: null, time: null, court: null, referees: { mainReferee: '', secondReferee: '', scorekeeper: '' }, assigned: false, score: null, status: 'pending' },
    ],
    femenino: [
      { id: 5, week: 1, team1: 'Fem A', team2: 'Fem B', clubLogo1: '💜', clubLogo2: '🟢', date: '2024-01-15', time: '12:00', court: 'Cancha 3', referees: { mainReferee: 'Carlos López', secondReferee: '', scorekeeper: '' }, assigned: true, score: { team1: 1, team2: 1 }, status: 'finished' },
      { id: 6, week: 1, team1: 'Fem C', team2: 'Fem D', clubLogo1: '🔶', clubLogo2: '🟤', date: null, time: null, court: null, referees: { mainReferee: '', secondReferee: '', scorekeeper: '' }, assigned: false, score: null, status: 'pending' },
    ],
    infantil: [
      { id: 7, week: 1, team1: 'Inf A', team2: 'Inf B', clubLogo1: '🔵', clubLogo2: '🟢', date: '2024-01-15', time: '14:00', court: 'Cancha 1', referees: { mainReferee: 'Ana Martínez', secondReferee: '', scorekeeper: '' }, assigned: true, score: { team1: 5, team2: 3 }, status: 'finished' },
    ],
  });

  const categories = ['masculino', 'femenino', 'infantil'];
  const availableCourts = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];
  const availableReferees = [
    'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez',
    'Luis Rodríguez', 'Sofia Fernández', 'Pedro González', 'Laura Sánchez'
  ];

  // ==================== FUNCIONES ====================

  const getFilteredMatches = () => {
    let filtered = matches[selectedCategory];

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.team1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.team2.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'assigned') {
      filtered = filtered.filter(m => m.assigned);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(m => !m.assigned);
    }

    return filtered;
  };

  const getMatchesByWeek = () => {
    const filtered = getFilteredMatches();
    const weeks = {};
    filtered.forEach(match => {
      if (!weeks[match.week]) weeks[match.week] = [];
      weeks[match.week].push(match);
    });
    return weeks;
  };

  const updateMatch = (matchId, field, value) => {
    const updatedMatches = {
      ...matches,
      [selectedCategory]: matches[selectedCategory].map(m =>
        m.id === matchId ? { ...m, [field]: value } : m
      ),
    };
    setMatches(updatedMatches);
  };

  const deleteMatch = (matchId) => {
    setMatches({
      ...matches,
      [selectedCategory]: matches[selectedCategory].filter(m => m.id !== matchId),
    });
    setShowDeleteConfirm(null);
  };

  const generatePDF = (filters, preview = false) => {
    // Filtrar partidos según los filtros
    let matchesToUse = [];

    // Filtrar por categorías seleccionadas
    filters.selectedCategories.forEach(cat => {
      matchesToUse = [...matchesToUse, ...matches[cat]];
    });

    // Filtrar por semanas si aplica
    if (filters.selectedWeeks.length > 0) {
      matchesToUse = matchesToUse.filter(m => filters.selectedWeeks.includes(m.week));
    }

    // Filtrar por canchas si aplica
    if (filters.selectedCourts.length > 0) {
      matchesToUse = matchesToUse.filter(m => m.court && filters.selectedCourts.includes(m.court));
    }

    // Filtrar solo programados si está activado
    if (filters.onlyScheduled) {
      matchesToUse = matchesToUse.filter(m => m.status === 'scheduled');
    }

    // Agrupar según opción seleccionada
    let groupedData = {};

    if (filters.groupBy === 'court') {
      matchesToUse.forEach(match => {
        const key = match.court || 'Sin asignar';
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(match);
      });
    } else if (filters.groupBy === 'week') {
      matchesToUse.forEach(match => {
        const key = `Semana ${match.week}`;
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(match);
      });
    } else if (filters.groupBy === 'category') {
      matchesToUse.forEach(match => {
        const key = match.status === 'finished' ? 'Finalizados' : match.status === 'scheduled' ? 'Programados' : 'Pendientes';
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(match);
      });
    } else if (filters.groupBy === 'date') {
      // Agrupar por fecha y ordenar
      matchesToUse.forEach(match => {
        const key = match.date || 'Sin fecha';
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(match);
      });
      // Ordenar las fechas
      const sortedKeys = Object.keys(groupedData).sort((a, b) => {
        if (a === 'Sin fecha') return 1;
        if (b === 'Sin fecha') return -1;
        return new Date(a) - new Date(b);
      });
      const sorted = {};
      sortedKeys.forEach(key => {
        sorted[key] = groupedData[key];
      });
      groupedData = sorted;
    }

    // Crear elemento HTML para el PDF
    const element = document.createElement('div');
    element.style.padding = '10px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.backgroundColor = '#fff';
    element.style.fontSize = '11px';
    
    // Crear HTML
    let html = `
      <div style="text-align: center; margin-bottom: 12px;">
        <h1 style="color: #ff6600; margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">CALENDARIO DE PARTIDOS</h1>
        <h2 style="color: #333; margin: 0; font-size: 12px; font-weight: normal;">Agrupado por ${filters.groupBy === 'court' ? 'CANCHA' : filters.groupBy === 'week' ? 'SEMANA' : filters.groupBy === 'date' ? 'FECHA' : 'CATEGORÍA'}</h2>
        <p style="color: #666; font-size: 10px; margin: 3px 0 0 0;">Generado: ${new Date().toLocaleDateString('es-ES')} | Total: ${matchesToUse.length} partidos</p>
      </div>
    `;

    // Crear tabla por cada grupo
    Object.entries(groupedData).forEach(([groupKey, groupMatches]) => {
      html += `
        <div style="margin-bottom: 8px; page-break-inside: avoid;">
          <div style="background-color: #ffcc00; padding: 3px 8px; color: #000; margin: 0 0 4px 0; border-left: 3px solid #ff6600; font-weight: bold; font-size: 11px;">
            ${groupKey}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px;">
            <thead>
              <tr style="background-color: #ffcc00; height: 14px;">
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 8%;">HORA</th>
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 18%;">EQUIPO 1</th>
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 18%;">EQUIPO 2</th>
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 10%;">CANCHA</th>
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 20%;">ÁRBITRO</th>
                <th style="border: 1px solid #999; padding: 2px; text-align: center; font-weight: bold; color: #000; font-size: 8px; width: 10%;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
      `;

      groupMatches.forEach((match, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
        const statusColor = match.status === 'pending' ? '#fff3cd' : match.status === 'scheduled' ? '#d1ecf1' : '#d4edda';
        const statusText = match.status === 'pending' ? 'PEND.' : match.status === 'scheduled' ? 'PROG.' : 'FIN.';
        
        html += `
          <tr style="background-color: ${bgColor}; height: 11px;">
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: center; font-size: 8px;">${match.time || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: left; font-size: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match.team1 || 'E1'}</td>
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: left; font-size: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match.team2 || 'E2'}</td>
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: center; font-size: 8px;">${match.court ? match.court.replace('Cancha ', '') : '-'}</td>
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: left; font-size: 8px;">${match.referees.mainReferee || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 1px 2px; text-align: center; font-size: 8px; background-color: ${statusColor}; font-weight: bold;">${statusText}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    element.innerHTML = html;

    if (preview) {
      // Guardar en estado para mostrar previsualización
      setPdfPreview(element.innerHTML);
      setShowPdfPreview(true);
    } else {
      // Descargar directamente
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        const groupByText = filters.groupBy === 'court' ? 'cancha' : filters.groupBy === 'week' ? 'semana' : filters.groupBy === 'date' ? 'fecha' : 'categoria';
        const opt = {
          margin: 5,
          filename: `partidos_${groupByText}_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { orientation: 'p', unit: 'mm', format: 'a4' }
        };
        window.html2pdf().set(opt).from(element).save();
      };
      document.head.appendChild(script);
    }
  };

  const openEditModal = (match) => {
    setEditingMatch({ ...match });
    setShowModal(true);
  };

  const saveModal = () => {
    if (editingMatch) {
      updateMatch(editingMatch.id, 'date', editingMatch.date);
      updateMatch(editingMatch.id, 'time', editingMatch.time);
      updateMatch(editingMatch.id, 'court', editingMatch.court);
      updateMatch(editingMatch.id, 'referees', editingMatch.referees);
      updateMatch(editingMatch.id, 'assigned', true);
      updateMatch(editingMatch.id, 'status', 'scheduled');
      setShowModal(false);
    }
  };

  const updateRefereeRole = (role, referee) => {
    if (editingMatch) {
      setEditingMatch({
        ...editingMatch,
        referees: {
          ...editingMatch.referees,
          [role]: referee
        }
      });
    }
  };

  const clearRefereeRole = (role) => {
    if (editingMatch) {
      setEditingMatch({
        ...editingMatch,
        referees: {
          ...editingMatch.referees,
          [role]: ''
        }
      });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'finished': return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'finished': return '✓ Finalizado';
      case 'scheduled': return '📅 Programado';
      case 'pending': return '⏳ Pendiente';
      default: return 'Desconocido';
    }
  };

  const matchesByWeek = getMatchesByWeek();
  const weeks = Object.keys(matchesByWeek).sort((a, b) => parseInt(a) - parseInt(b));

  const stats = {
    total: matches[selectedCategory].length,
    finished: matches[selectedCategory].filter(m => m.status === 'finished').length,
    scheduled: matches[selectedCategory].filter(m => m.status === 'scheduled').length,
    pending: matches[selectedCategory].filter(m => m.status === 'pending').length,
  };

  // ===============================================
  // ICON BUTTON COMPONENT
  // ===============================================
  const IconBtn = ({ title, onClick, children, danger }) => (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-md border transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50 border-red-200'
          : 'hover:bg-gray-50 border-gray-200'
      }`}
    >
      {children}
    </button>
  );

  // ===============================================
  // RENDER: PROGRAMACIÓN DE PARTIDOS
  // ===============================================
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📅 Partidos</h1>
        <p className="text-gray-600 mt-2">Visualiza y gestiona los partidos del campeonato</p>
      </div>

      {/* Buscador */}
      <div className="flex-1 relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Partidos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Finalizados</p>
          <p className="text-2xl font-bold text-green-600">{stats.finished}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Programados</p>
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Selector de Categoría */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        
        {/* Filtros de Estado */}
        <div className="flex gap-2">
          {['all', 'assigned', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : status === 'assigned' ? 'Programados' : 'Pendientes'}
            </button>
          ))}
        </div>

        {/* Botón Descargar PDF */}
        <button
          onClick={() => setShowPDFOptions(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 ml-auto"
        >
          📄 Descargar PDF
        </button>
      </div>

      {/* Semanas con Cards */}
      <div className="space-y-4">
        {weeks.length > 0 ? (
          weeks.map(week => (
            <div key={week} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header de la semana */}
              <button
                onClick={() => setExpandedWeek(expandedWeek === week ? null : week)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">S{week}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-semibold text-gray-900">Semana {week}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {matchesByWeek[week].length} partido(s)
                    </span>
                  </div>
                </div>
                {expandedWeek === week ? (
                  <ChevronUp className="text-gray-600" />
                ) : (
                  <ChevronDown className="text-gray-600" />
                )}
              </button>

              {/* Contenido: Cards tipo Marcador */}
              {expandedWeek === week && (
                <div className="p-4 space-y-4">
                  {/* Botón para crear nuevo partido */}
                  <button
                    onClick={() => {
                      const newMatch = {
                        id: Math.max(...matches[selectedCategory].map(m => m.id), 0) + 1,
                        week: parseInt(week),
                        team1: '',
                        team2: '',
                        clubLogo1: '⚪',
                        clubLogo2: '⚪',
                        date: null,
                        time: null,
                        court: null,
                        referees: { mainReferee: '', secondReferee: '', scorekeeper: '' },
                        assigned: false,
                        score: null,
                        status: 'pending'
                      };
                      setMatches({
                        ...matches,
                        [selectedCategory]: [...matches[selectedCategory], newMatch]
                      });
                      setEditingMatch(newMatch);
                      setShowModal(true);
                    }}
                    className="w-full py-2 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={20} /> Nuevo Partido
                  </button>

                  {/* Grid de partidos - COMPACTO */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                    {matchesByWeek[week].map((match) => (
                      <div
                        key={match.id}
                        className={`rounded-lg overflow-hidden border transition-all hover:shadow-md cursor-pointer group relative ${
                          match.status === 'finished' ? 'border-green-400 bg-green-50 hover:bg-green-100' :
                          match.status === 'scheduled' ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' :
                          'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
                        }`}
                        onClick={() => openEditModal(match)}
                      >
                        {/* Marcador Compacto */}
                        <div className={`p-1.5 text-white text-center text-xs font-bold ${
                          match.status === 'finished' ? 'bg-green-600' :
                          match.status === 'scheduled' ? 'bg-blue-600' :
                          'bg-yellow-500'
                        }`}>
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="text-lg">{match.clubLogo1}</span>
                            {match.score ? (
                              <span>{match.score.team1}</span>
                            ) : (
                              <span>-</span>
                            )}
                            <span className="text-xs opacity-75">vs</span>
                            {match.score ? (
                              <span>{match.score.team2}</span>
                            ) : (
                              <span>-</span>
                            )}
                            <span className="text-lg">{match.clubLogo2}</span>
                          </div>
                        </div>

                        {/* Info Minimalista */}
                        <div className="p-1 text-xs space-y-0.5 text-gray-700">
                          <div className="line-clamp-1 font-semibold text-center text-gray-800">{match.team1 || 'E1'}</div>
                          <div className="line-clamp-1 text-center text-gray-600 text-xs">{match.team2 || 'E2'}</div>
                          
                          {match.date ? (
                            <div className="text-center text-gray-500 text-xs">📅 {match.date}</div>
                          ) : (
                            <div className="text-center text-gray-400 text-xs italic">Sin fecha</div>
                          )}
                          
                          {match.time && (
                            <div className="text-center text-gray-500 text-xs">⏰ {match.time}</div>
                          )}

                          {/* Indicador de estado */}
                          <div className="text-center pt-0.5">
                            {match.status === 'pending' && <span className="text-yellow-600 text-sm">⏳</span>}
                            {match.status === 'scheduled' && <span className="text-blue-600 text-sm">✓</span>}
                            {match.status === 'finished' && <span className="text-green-600 text-sm">✓✓</span>}
                          </div>
                        </div>

                        {/* Tooltip al hover */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
                          Click para editar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 text-lg">No hay partidos con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* MODAL: PROGRAMAR/EDITAR PARTIDO */}
      {showModal && editingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">📅 {editingMatch.status === 'pending' ? 'Programar' : 'Editar'} Partido</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">{editingMatch.team1 || 'Equipo 1'}</span>
                  <span className="mx-2">vs</span>
                  <span className="font-semibold">{editingMatch.team2 || 'Equipo 2'}</span>
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
              {/* Nombres de equipos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equipo 1</label>
                  <input
                    type="text"
                    value={editingMatch.team1 || ''}
                    onChange={(e) => setEditingMatch({ ...editingMatch, team1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del equipo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equipo 2</label>
                  <input
                    type="text"
                    value={editingMatch.team2 || ''}
                    onChange={(e) => setEditingMatch({ ...editingMatch, team2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del equipo"
                  />
                </div>
              </div>

              {/* DATE TIME PICKER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateTimePicker
                  date={editingMatch.date || ''}
                  time={editingMatch.time || ''}
                  onDateChange={(date) => setEditingMatch({ ...editingMatch, date })}
                  onTimeChange={(time) => setEditingMatch({ ...editingMatch, time })}
                />
              </div>

              {/* Cancha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><MapPin size={16} className="inline mr-1" /> Cancha</label>
                <select
                  value={editingMatch.court || ''}
                  onChange={(e) => setEditingMatch({ ...editingMatch, court: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cancha</option>
                  {availableCourts.map(court => (
                    <option key={court} value={court}>{court}</option>
                  ))}
                </select>
              </div>

              {/* Árbitros con Roles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Árbitro Principal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🟢 Árbitro Principal</label>
                  <div className="relative">
                    {editingMatch.referees.mainReferee ? (
                      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-3 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{editingMatch.referees.mainReferee}</span>
                        <button
                          onClick={() => clearRefereeRole('mainReferee')}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateRefereeRole('mainReferee', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {availableReferees
                          .filter(ref => ref !== editingMatch.referees.secondReferee && ref !== editingMatch.referees.scorekeeper)
                          .map(referee => (
                            <option key={referee} value={referee}>{referee}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Árbitro Secundario */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🟡 Árbitro Secundario</label>
                  <div className="relative">
                    {editingMatch.referees.secondReferee ? (
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{editingMatch.referees.secondReferee}</span>
                        <button
                          onClick={() => clearRefereeRole('secondReferee')}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateRefereeRole('secondReferee', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {availableReferees
                          .filter(ref => ref !== editingMatch.referees.mainReferee && ref !== editingMatch.referees.scorekeeper)
                          .map(referee => (
                            <option key={referee} value={referee}>{referee}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Planillero */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Planillero</label>
                  <div className="relative">
                    {editingMatch.referees.scorekeeper ? (
                      <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{editingMatch.referees.scorekeeper}</span>
                        <button
                          onClick={() => clearRefereeRole('scorekeeper')}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateRefereeRole('scorekeeper', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {availableReferees
                          .filter(ref => ref !== editingMatch.referees.mainReferee && ref !== editingMatch.referees.secondReferee)
                          .map(referee => (
                            <option key={referee} value={referee}>{referee}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={saveModal}
                disabled={!editingMatch.date || !editingMatch.time || !editingMatch.court || !editingMatch.team1 || !editingMatch.team2}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  !editingMatch.date || !editingMatch.time || !editingMatch.court || !editingMatch.team1 || !editingMatch.team2
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                ✓ Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER PLANILLA */}
      {showScoresheet && scoresheetMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">📋 Planilla del Partido</h2>
              <button
                onClick={() => setShowScoresheet(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Encabezado */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600">Resultado Final</p>
                <div className="flex items-center justify-around mt-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{scoresheetMatch.team1}</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{scoresheetMatch.score.team1}</p>
                  </div>
                  <p className="text-2xl text-gray-400">-</p>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{scoresheetMatch.team2}</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{scoresheetMatch.score.team2}</p>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora</p>
                  <p className="font-semibold text-gray-900">📅 {scoresheetMatch.date} - ⏰ {scoresheetMatch.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cancha</p>
                  <p className="font-semibold text-gray-900">📍 {scoresheetMatch.court}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Árbitro(s)</p>
                  <div className="flex flex-wrap gap-2">
                    {scoresheetMatch.referees.map((ref, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowScoresheet(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Eliminar Partido</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700">¿Estás seguro de que deseas eliminar este partido?</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMatch(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVISUALIZACIÓN DE PDF */}
      {showPdfPreview && pdfPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">📋 Previsualización PDF</h2>
                <button
                  onClick={() => setShowPdfPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <div 
                style={{ 
                  backgroundColor: '#fff',
                  padding: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
                dangerouslySetInnerHTML={{ __html: pdfPreview }}
              />
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
              <button
                onClick={() => setShowPdfPreview(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OPCIONES DE PDF */}
      {showPDFOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h2 className="text-lg font-bold text-gray-900">📄 Opciones de Descarga PDF</h2>
              <p className="text-sm text-gray-600 mt-1">Selecciona cómo deseas agrupar los partidos</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Opción de agrupación */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Agrupar por:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupBy"
                      value="date"
                      checked={pdfFilters.groupBy === 'date'}
                      onChange={(e) => setPdfFilters({ ...pdfFilters, groupBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">Fecha</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupBy"
                      value="court"
                      checked={pdfFilters.groupBy === 'court'}
                      onChange={(e) => setPdfFilters({ ...pdfFilters, groupBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">Cancha</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupBy"
                      value="week"
                      checked={pdfFilters.groupBy === 'week'}
                      onChange={(e) => setPdfFilters({ ...pdfFilters, groupBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">Semana</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupBy"
                      value="category"
                      checked={pdfFilters.groupBy === 'category'}
                      onChange={(e) => setPdfFilters({ ...pdfFilters, groupBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">Estado</span>
                  </label>
                </div>
              </div>

              {/* Seleccionar Categorías */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Categorías:</label>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pdfFilters.selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedCategories: [...pdfFilters.selectedCategories, cat]
                            });
                          } else {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedCategories: pdfFilters.selectedCategories.filter(c => c !== cat)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-700 capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seleccionar Semanas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Semanas (dejar en blanco para todas):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(week => (
                    <label key={week} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pdfFilters.selectedWeeks.includes(week)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedWeeks: [...pdfFilters.selectedWeeks, week]
                            });
                          } else {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedWeeks: pdfFilters.selectedWeeks.filter(w => w !== week)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">S{week}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seleccionar Canchas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Canchas (dejar en blanco para todas):</label>
                <div className="space-y-2">
                  {availableCourts.map(court => (
                    <label key={court} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pdfFilters.selectedCourts.includes(court)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedCourts: [...pdfFilters.selectedCourts, court]
                            });
                          } else {
                            setPdfFilters({
                              ...pdfFilters,
                              selectedCourts: pdfFilters.selectedCourts.filter(c => c !== court)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-700">{court}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro Solo Programados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfFilters.onlyScheduled}
                    onChange={(e) => setPdfFilters({ ...pdfFilters, onlyScheduled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-gray-700 font-semibold">📅 Solo partidos PROGRAMADOS</span>
                </label>
                <p className="text-xs text-gray-600 mt-2 ml-8">Mostrar únicamente los partidos que ya tienen fecha, hora y cancha asignados</p>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowPDFOptions(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  generatePDF(pdfFilters, true);
                  setShowPDFOptions(false);
                }}
                disabled={pdfFilters.selectedCategories.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  pdfFilters.selectedCategories.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                👁️ Previsualizar
              </button>
              <button
                onClick={() => {
                  generatePDF(pdfFilters, false);
                  setShowPDFOptions(false);
                }}
                disabled={pdfFilters.selectedCategories.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  pdfFilters.selectedCategories.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                ✓ Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartidosPage;