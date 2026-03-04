import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Search, Edit2, Trash2, X, Shuffle } from 'lucide-react';
import DataTable from '../components/Datatable';
import FormModal from '../components/FormModal';
import ModalCategoriaCampeonato from '../components/ModalCategoriaCampeonato';
import { campeonatoService } from '../services/campeonatoService';
import { equipoService } from '../services/equipoService';
import { categoriaService } from '../services/categoriaService';

// =========== MAPEO DE LOGOS/IMÁGENES DE CLUBES ===========
const LOGOS_CLUBES = {
  'Bolívar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Club_Bol%C3%ADvar_Logo.svg/200px-Club_Bol%C3%ADvar_Logo.svg.png',
  'Strongest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/The_Strongest_La_Paz.svg/200px-The_Strongest_La_Paz.svg.png',
  'Wilstermann': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Club_Jorge_Wilstermann_Logo.svg/200px-Club_Jorge_Wilstermann_Logo.svg.png',
  'Municipal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Municipalista_La_Paz.png/200px-Municipalista_La_Paz.png',
  'The Strongest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/The_Strongest_La_Paz.svg/200px-The_Strongest_La_Paz.svg.png',
  'San José': 'https://via.placeholder.com/80?text=SJ',
  'Oruro Royal': 'https://via.placeholder.com/80?text=OR',
  'Académico': 'https://via.placeholder.com/80?text=AC',
  'Blooming': 'https://via.placeholder.com/80?text=BL',
  'Palmaflor': 'https://via.placeholder.com/80?text=PF',
  'Deportivo Chuquisaca': 'https://via.placeholder.com/80?text=DC',
  'Destroyers': 'https://via.placeholder.com/80?text=DS',
  'Guabirá': 'https://via.placeholder.com/80?text=GB',
  'Real Potosí': 'https://via.placeholder.com/80?text=RP',
  'Aurora': 'https://via.placeholder.com/80?text=AU',
};

const getLogoUrl = (equipo) => {
  const equipoBase = equipo.replace(/ (U-20|U-17|Fem|Infantil)$/, '');
  return LOGOS_CLUBES[equipoBase] || 'https://via.placeholder.com/80?text=Logo';
};

// =========== COMPONENTE TARJETA DE EQUIPO ===========
const TeamCard = ({ equipo, onDragStart, onClick, removable = false, onRemove }) => {
  const logoUrl = getLogoUrl(equipo);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="relative flex flex-col items-center justify-end gap-1 p-2 rounded-lg cursor-move hover:shadow-md transition-all w-24 h-28 bg-cover bg-center group overflow-hidden"
      style={{
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      
      {/* Texto del equipo */}
      <span className="relative text-xs font-bold text-white text-center line-clamp-2 drop-shadow-lg z-10">
        {equipo}
      </span>
      
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 z-20 shadow-md"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const SelectedTeamCard = ({ equipo, onRemove }) => {
  const logoUrl = getLogoUrl(equipo);

  return (
    <div className="relative group">
      <div 
        className="relative flex flex-col items-center justify-end gap-1 p-2 rounded-lg w-24 h-28 bg-cover bg-center hover:shadow-md transition-all overflow-hidden"
        style={{
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay oscuro más intenso para equipos seleccionados */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/40 to-blue-500/30 group-hover:from-blue-900/90"></div>
        
        {/* Border azul para indicar selección */}
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none"></div>
        
        {/* Texto del equipo */}
        <span className="relative text-xs font-bold text-white text-center line-clamp-2 drop-shadow-lg z-10">
          {equipo}
        </span>
      </div>
      
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
      >
        ✕
      </button>
    </div>
  );
};

export function CampeonatosPage() {
  // =========== ESTADO PARA EQUIPOS POR CATEGORÍA ===========
  const [equiposPorCategoria, setEquiposPorCategoria] = useState({});
  const [todosLosEquipos, setTodosLosEquipos] = useState([]);

  // ESTADO: Datos de campeonatos
  const [campeonatos, setCampeonatos] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ESTADO: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampeonato, setEditingCampeonato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [formatConfig, setFormatConfig] = useState({});
  const [showTablaPosiciones, setShowTablaPosiciones] = useState(false);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [categoriaSeleccionadaTabla, setCategoriaSeleccionadaTabla] = useState(null);
  const [showModalCategorias, setShowModalCategorias] = useState(false);
  const [campeonatoParaCategorias, setCampeonatoParaCategorias] = useState(null);

  // Cargar campeonatos, gestiones y equipos desde la API al montar el componente
  useEffect(() => {
    cargarCampeonatos();
    cargarGestiones();
    cargarEquipos();
  }, []);

  const cargarGestiones = async () => {
    try {
      const response = await campeonatoService.getAllGestiones();
      if (response.success && response.data) {
        setGestiones(response.data);
      }
    } catch (err) {
      console.error('Error al cargar gestiones:', err);
    }
  };

  const cargarCampeonatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campeonatoService.getAll();

      if (response.success && response.data) {
        // Transformar los datos del backend al formato del frontend
        const campeonatosTransformados = response.data.map(c => ({
          id_campeonato: c.id_campeonato,
          nombre: c.nombre,
          tipo: c.tipo,
          genero: c.genero || 'Mixto',
          fecha_inicio: c.fecha_inicio,
          fecha_fin: c.fecha_fin,
          organizador: c.organizador || 'N/A',
          estado: c.c_estado,
          formato: c.formato || 'todos-contra-todos',
          idaVuelta: c.idaVuelta || true,
          numSeries: c.numSeries || 1,
          campeonatoCategorias: c.campeonatoCategorias || [],
          categorias: c.categorias || [],
          series: c.series || [],
          id_gestion: c.id_gestion
        }));
        setCampeonatos(campeonatosTransformados);
      }
    } catch (err) {
      console.error('Error al cargar campeonatos:', err);
      setError(err.message || 'Error al cargar los campeonatos');
    } finally {
      setLoading(false);
    }
  };

  // =========== CARGAR EQUIPOS DESDE LA BASE DE DATOS ===========
  const cargarEquipos = async () => {
    try {
      const response = await equipoService.getAll();
      if (response.success && response.data) {
        setTodosLosEquipos(response.data);

        // Agrupar equipos por categoría
        const equiposPorCat = {};
        response.data.forEach(equipo => {
          const nombreCategoria = equipo.categoria?.nombre;
          if (nombreCategoria) {
            if (!equiposPorCat[nombreCategoria]) {
              equiposPorCat[nombreCategoria] = [];
            }
            equiposPorCat[nombreCategoria].push(equipo.nombre);
          }
        });
        setEquiposPorCategoria(equiposPorCat);
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    }
  };

  // =========== DATOS DE POSICIONES POR CATEGORÍA Y GÉNERO ===========
  // Este es un ejemplo - en producción vendrían de una API
  // Estructurado para VOLEIBOL con grupos, categorías y género
  const obtenerTablaPosiciones = (campeonatoId, categoria, genero) => {
    // Datos de ejemplo para VOLEIBOL
    const tablasEjemplo = {
      'Mayor': {
        'Mujeres': {
          'Grupo A': [
            { pos: 1, equipo: 'COSABE', pj: 1, pg: 1, pp: 0, wo: 0, pts: 2, sg: 3, sp: 0, promedio: '∞' },
            { pos: 2, equipo: 'SAN ROQUE', pj: 1, pg: 1, pp: 0, wo: 0, pts: 2, sg: 3, sp: 0, promedio: '∞' },
            { pos: 3, equipo: 'MUNDO VOLEY', pj: 1, pg: 0, pp: 1, wo: 0, pts: 1, sg: 0, sp: 3, promedio: '0.00' },
            { pos: 4, equipo: 'SAN JOSE', pj: 1, pg: 0, pp: 1, wo: 0, pts: 1, sg: 0, sp: 3, promedio: '0.00' },
          ],
          'Grupo B': [
            { pos: 1, equipo: 'UNIVERSITARIO', pj: 1, pg: 1, pp: 0, wo: 0, pts: 2, sg: 3, sp: 0, promedio: '∞' },
            { pos: 2, equipo: 'ATV', pj: 1, pg: 1, pp: 0, wo: 0, pts: 2, sg: 3, sp: 0, promedio: '∞' },
            { pos: 3, equipo: 'SANTA ANA', pj: 1, pg: 0, pp: 1, wo: 0, pts: 1, sg: 0, sp: 3, promedio: '0.00' },
            { pos: 4, equipo: 'UNIVERSITARIO B', pj: 1, pg: 0, pp: 1, wo: 0, pts: 1, sg: 0, sp: 3, promedio: '0.00' },
          ],
        },
        'Hombres': {
          'Grupo A': [
            { pos: 1, equipo: 'BOLÍVAR', pj: 3, pg: 3, pp: 0, wo: 0, pts: 9, sg: 9, sp: 1, promedio: '9.00' },
            { pos: 2, equipo: 'STRONGEST', pj: 3, pg: 2, pp: 1, wo: 0, pts: 6, sg: 7, sp: 4, promedio: '1.75' },
            { pos: 3, equipo: 'MUNICIPAL', pj: 3, pg: 1, pp: 2, wo: 0, pts: 3, sg: 4, sp: 7, promedio: '0.57' },
          ],
        },
        'Mixto': {
          'Grupo A': [
            { pos: 1, equipo: 'ALLIANCE', pj: 2, pg: 2, pp: 0, wo: 0, pts: 6, sg: 6, sp: 1, promedio: '6.00' },
            { pos: 2, equipo: 'FUSION TEAM', pj: 2, pg: 1, pp: 1, wo: 0, pts: 3, sg: 4, sp: 3, promedio: '1.33' },
            { pos: 3, equipo: 'UNIDOS', pj: 2, pg: 0, pp: 2, wo: 0, pts: 0, sg: 1, sp: 6, promedio: '0.17' },
          ],
        },
      },
      'Sub-20': {
        'Mujeres': {
          'Grupo A': [
            { pos: 1, equipo: 'COSABE JR', pj: 1, pg: 1, pp: 0, wo: 0, pts: 2, sg: 3, sp: 1, promedio: '3.00' },
            { pos: 2, equipo: 'SAN ROQUE JR', pj: 1, pg: 0, pp: 1, wo: 0, pts: 0, sg: 1, sp: 3, promedio: '0.33' },
          ],
        },
        'Hombres': {
          'Grupo A': [
            { pos: 1, equipo: 'BOLÍVAR JR', pj: 2, pg: 2, pp: 0, wo: 0, pts: 6, sg: 6, sp: 0, promedio: '∞' },
            { pos: 2, equipo: 'STRONGEST JR', pj: 2, pg: 1, pp: 1, wo: 0, pts: 3, sg: 4, sp: 3, promedio: '1.33' },
          ],
        },
      },
      'Femenino': {
        'Mujeres': {
          'Grupo A': [
            { pos: 1, equipo: 'BOLÍVAR FEM', pj: 2, pg: 2, pp: 0, wo: 0, pts: 6, sg: 6, sp: 1, promedio: '6.00' },
            { pos: 2, equipo: 'STRONGEST FEM', pj: 2, pg: 1, pp: 1, wo: 0, pts: 3, sg: 4, sp: 4, promedio: '1.00' },
            { pos: 3, equipo: 'MUNICIPAL FEM', pj: 2, pg: 0, pp: 2, wo: 0, pts: 0, sg: 1, sp: 6, promedio: '0.17' },
          ],
        },
      },
    };
    
    return tablasEjemplo[categoria]?.[genero] || {};
  };

  const handleVerTablaPosiciones = (campeonato) => {
    setCampeonatoSeleccionado(campeonato);
    // Establecer la primera categoría como seleccionada
    if (campeonato.categorias && campeonato.categorias.length > 0) {
      setCategoriaSeleccionadaTabla(campeonato.categorias[0]);
    }
    setShowTablaPosiciones(true);
  };

  // Filtrar campeonatos por búsqueda
  const filteredCampeonatos = campeonatos.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========== CRUD OPERATIONS ===========

  const handleCreate = () => {
    setEditingCampeonato(null);
    setIsModalOpen(true);
  };

  const handleEdit = (campeonato) => {
    setEditingCampeonato(campeonato);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este campeonato?')) {
      try {
        await campeonatoService.delete(id);
        // Recargar campeonatos desde la API
        await cargarCampeonatos();
      } catch (err) {
        console.error('Error al eliminar campeonato:', err);
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      // Transformar datos del frontend al formato del backend
      const campeonatoData = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        id_gestion: parseInt(formData.id_gestion),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        c_estado: formData.estado || 'programado',
        genero: formData.genero,
        organizador: formData.organizador
      };

      if (editingCampeonato) {
        // Actualizar campeonato existente
        const response = await campeonatoService.update(editingCampeonato.id, campeonatoData);

        if (response.success) {
          // Recargar campeonatos desde la API
          await cargarCampeonatos();
        }
      } else {
        // Crear nuevo campeonato
        const response = await campeonatoService.create(campeonatoData);

        if (response.success) {
          // Recargar campeonatos desde la API
          await cargarCampeonatos();

          // Abrir modal de categorías automáticamente
          setCampeonatoParaCategorias({
            id_campeonato: response.data.id_campeonato || response.data.id_cc,
            nombre: response.data.nombre
          });
          setShowModalCategorias(true);
        }
      }

      setIsModalOpen(false);
      setEditingCampeonato(null);
    } catch (err) {
      console.error('Error al guardar campeonato:', err);
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleConfigureFormat = (campeonato) => {
    // Obtener categorías del campeonato - ahora viene como campeonatoCategorias
    const categoriasDelCampeonato = campeonato.campeonatoCategorias || campeonato.categorias || [];
    const nombresCategorias = categoriasDelCampeonato.map(cat =>
      cat.categoria?.nombre || cat.Categoria?.nombre || 'Sin nombre'
    );

    setFormatConfig({
      id: campeonato.id_campeonato,
      configPorCategoria: campeonato.configPorCategoria || {},
      categoriaSeleccionada: nombresCategorias[0],
      categoriasDisponibles: nombresCategorias
    });
    setShowFormatModal(true);
  };

  const handleSaveFormat = async () => {
    try {
      // Guardar la configuración de cada categoría en la base de datos
      const categorias = Object.keys(formatConfig.configPorCategoria || {});

      for (const nombreCategoria of categorias) {
        const config = formatConfig.configPorCategoria[nombreCategoria];

        // Buscar el id_cc de esta categoría
        const campeonato = campeonatos.find(c => c.id_campeonato === formatConfig.id);
        const categoriasArray = campeonato?.campeonatoCategorias || campeonato?.categorias || [];

        if (categoriasArray.length > 0) {
          const categoriaData = categoriasArray.find(cat =>
            cat.categoria?.nombre === nombreCategoria || cat.Categoria?.nombre === nombreCategoria
          );

          if (categoriaData && categoriaData.id_cc) {
            // Preparar los datos de configuración
            const configuracion = {
              formato: config.formato === 'todos-contra-todos' ? 'todos_vs_todos' :
                       config.formato === 'series' ? 'grupos_y_eliminacion' :
                       config.formato === 'fases' ? 'grupos_y_eliminacion' : 'todos_vs_todos',
              numero_grupos: config.formato === 'series' ? config.numSeries :
                             config.formato === 'fases' ? config.fases?.[0]?.series?.length : null,
              ida_vuelta: config.idaVuelta !== undefined ? config.idaVuelta : false,
              dias_entre_jornadas: config.diasEntreJornadas || 7,
              hora_inicio_partidos: config.horaInicio || '18:00:00',
              dias_juego: config.diasJuego || null
            };

            // Guardar en la base de datos
            await categoriaService.updateConfiguracion(categoriaData.id_cc, configuracion);
          }
        }
      }

      // Actualizar el estado local
      setCampeonatos(campeonatos.map(c =>
        c.id_campeonato === formatConfig.id
          ? {
              ...c,
              configPorCategoria: formatConfig.configPorCategoria || {},
              categorias: Object.keys(formatConfig.configPorCategoria || {})
            }
          : c
      ));

      setShowFormatModal(false);
      alert('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('❌ Error al guardar la configuración: ' + error.message);
    }
  };

  const getAllCategories = () => {
    return formatConfig.categoriasDisponibles || Object.keys(equiposPorCategoria);
  };

  // =========== OBTENER EQUIPOS PARA UNA CATEGORÍA ===========
  const getTodosEquiposPorCategoria = (categoria) => {
    return equiposPorCategoria[categoria] || [];
  };

  // =========== OBTENER EQUIPOS DISPONIBLES (NO ASIGNADOS) ===========
  const getEquiposDisponiblesPorCategoria = (categoria) => {
    const config = obtenerConfigCategoria(categoria);
    
    // Obtener equipos ya asignados según el formato
    let equiposAsignados = [];
    
    if (config.formato === 'series' && config.series) {
      equiposAsignados = config.series.flatMap(s => s.equipos || []);
    } else {
      equiposAsignados = config.equipos || [];
    }
    
    // Obtener todos los equipos de esta categoría
    const todosEquipos = getTodosEquiposPorCategoria(categoria);
    
    // Retornar solo los no asignados
    return todosEquipos.filter(eq => !equiposAsignados.includes(eq));
  };

  // =========== OBTENER Y ACTUALIZAR CONFIGURACIÓN POR CATEGORÍA ===========
  const obtenerConfigCategoria = (categoria = null) => {
    const cat = categoria || formatConfig.categoriaSeleccionada;
    if (!formatConfig.configPorCategoria) {
      formatConfig.configPorCategoria = {};
    }
    
    if (!formatConfig.configPorCategoria[cat]) {
      formatConfig.configPorCategoria[cat] = {
        formato: 'todos-contra-todos',
        idaVuelta: true,
        numSeries: 1,
        equipos: [],
        series: [],
        // Para fases
        fases: [
          { nombre: 'Fase de Grupos', tipo: 'series', series: [] },
          { nombre: 'Playoffs', tipo: 'eliminacion', equipos: [] },
          { nombre: 'Final', tipo: 'final', equipos: [] }
        ]
      };
    }
    
    return formatConfig.configPorCategoria[cat];
  };

  const actualizarConfigCategoria = (cambios) => {
    const cat = formatConfig.categoriaSeleccionada;
    setFormatConfig({
      ...formatConfig,
      configPorCategoria: {
        ...formatConfig.configPorCategoria,
        [cat]: {
          ...obtenerConfigCategoria(cat),
          ...cambios
        }
      }
    });
  };

  // =========== DISTRIBUCIÓN ALEATORIA ===========
  const distribuirAleatoriamente = () => {
    const config = obtenerConfigCategoria();
    const equiposDisponibles = getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada);
    
    if (equiposDisponibles.length === 0) {
      alert('No hay equipos disponibles para distribuir en esta categoría.');
      return;
    }

    // Barajar con Fisher-Yates
    const equiposBarajados = [...equiposDisponibles];
    for (let i = equiposBarajados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [equiposBarajados[i], equiposBarajados[j]] = [equiposBarajados[j], equiposBarajados[i]];
    }

    // Calcular distribución equitativa
    const numSeries = config.numSeries || 1;
    const equiposPorSerie = Math.floor(equiposBarajados.length / numSeries);
    const residuo = equiposBarajados.length % numSeries;

    // Distribuir entre series
    const newSeries = config.series.map((serie, idx) => {
      const inicio = idx * equiposPorSerie + Math.min(idx, residuo);
      const cantidad = equiposPorSerie + (idx < residuo ? 1 : 0);
      const equiposAsignados = equiposBarajados.slice(inicio, inicio + cantidad);
      
      return {
        ...serie,
        equipos: [...(serie.equipos || []), ...equiposAsignados]
      };
    });

    actualizarConfigCategoria({ series: newSeries });
  };

  // Configurar columnas de la tabla
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'genero',
      label: 'Género',
      render: (value) => {
        const iconos = {
          'Hombres': '👨',
          'Mujeres': '👩',
          'Mixto': '👥'
        };
        return (
          <div className={`px-3 py-1 rounded-full text-sm w-fit font-semibold ${
            value === 'Hombres' ? 'bg-blue-100 text-blue-700' : 
            value === 'Mujeres' ? 'bg-pink-100 text-pink-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {iconos[value]} {value}
          </div>
        )
      }
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm w-fit">
          {value}
        </div>
      )
    },
    {
      key: 'fecha_inicio',
      label: 'Inicio',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {/*{
      key: 'organizador',
      label: 'Organizador',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },*/},
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
          value === 'programado'
            ? 'bg-yellow-100 text-yellow-700'
            : value === 'en_curso'
            ? 'bg-green-100 text-green-700'
            : value === 'finalizado'
            ? 'bg-blue-100 text-blue-700'
            : value === 'suspendido'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {value}
        </div>
      )
    },
    {
      key: 'categorias',
      label: 'Categorías',
      render: (value, campeonato) => (
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold w-fit">
          {campeonato.categorias?.length || 0} categoría{campeonato.categorias?.length !== 1 ? 's' : ''}
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (value, campeonato) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setCampeonatoParaCategorias({
                id_campeonato: campeonato.id_campeonato,
                nombre: campeonato.nombre
              });
              setShowModalCategorias(true);
            }}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
            title="Configurar categorías"
          >
            🏷️ Categorías
          </button>
          {/*<button
            onClick={() => handleVerTablaPosiciones(campeonato)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
            title="Ver tabla de posiciones"
          >
            📊 Tabla
          </button>*/}
          <button
            onClick={() => handleConfigureFormat(campeonato)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
            title="Configurar formato y equipos"
          >
            ⚙️ Configurar
          </button>
          <button
            onClick={() => handleEdit(campeonato)}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
            title="Editar campeonato"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(campeonato.id_campeonato)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
            title="Eliminar campeonato"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Campos del formulario
  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre del Campeonato',
      type: 'text',
      placeholder: 'Ej: Torneo Nacional 2024',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      placeholder: 'Selecciona el tipo',
      required: true,
      options: [
        { value: 'campeonato', label: 'Campeonato' },
        { value: 'liga', label: ' Liga' },
        { value: 'copa', label: ' Copa' },
        { value: 'relampago', label: ' Relámpago' },
        { value: 'amistoso', label: 'Amistoso' },
        { value: 'torneo', label: 'Torneo' }
      ]
    },
    {
      name: 'id_gestion',
      label: 'Gestión/Año',
      type: 'select',
      placeholder: 'Selecciona la gestión',
      required: true,
      options: gestiones.map(g => ({
        value: g.id_gestion,
        label: `${g.gestion} - ${g.descripcion || ''}`
      }))
    },
    {
      name: 'genero',
      label: 'Género/Categoría',
      type: 'select',
      placeholder: 'Selecciona género',
      required: true,
      options: [
        { value: 'Hombres', label: '👨 Hombres' },
        { value: 'Mujeres', label: '👩 Mujeres' },
        { value: 'Mixto', label: '👥 Mixto' }
      ]
    },
    {
      name: 'fecha_inicio',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true
    },
    {
      name: 'fecha_fin',
      label: 'Fecha de Fin',
      type: 'date',
      required: true
    },
    /*{
      name: 'organizador',
      label: 'Organizador',
      type: 'text',
      placeholder: 'Ej: Federación Boliviana',
      required: true
    },*/
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      placeholder: 'Selecciona el estado',
      required: true,
      options: [
        { value: 'programado', label: '📅 Programado' },
        { value: 'en_curso', label: '▶️ En Curso' },
        { value: 'finalizado', label: '✅ Finalizado' },
        { value: 'suspendido', label: '⏸️ Suspendido' },
        { value: 'cancelado', label: '❌ Cancelado' }
      ]
    }
  ];

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando campeonatos...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar campeonatos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarCampeonatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Campeonatos</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los campeonatos y torneos disponibles.</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nuevo Campeonato
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Campeonatos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{campeonatos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {campeonatos.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Tipos</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(campeonatos.map(c => c.tipo)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">Total Formatos</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {new Set(campeonatos.map(c => c.formato)).size}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <DataTable
        data={filteredCampeonatos}
        columns={columns}
        itemsPerPage={5}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Formulario */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingCampeonato ? 'Editar Campeonato' : 'Crear Nuevo Campeonato'}
        fields={formFields}
        initialData={editingCampeonato}
      />

      {/* Modal de Configuración de Formato */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">⚙️ Configurar Formato por Categoría</h2>
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              {/* Info de equipos disponibles */}
              <p className="text-xs text-gray-600 mt-2">
                📊 Equipos disponibles para {formatConfig.categoriaSeleccionada}: {getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length} de {getTodosEquiposPorCategoria(formatConfig.categoriaSeleccionada).length}
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Selector de Categoría */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Selecciona una Categoría</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {getAllCategories().map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormatConfig({
                        ...formatConfig,
                        categoriaSeleccionada: cat
                      })}
                      className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                        formatConfig.categoriaSeleccionada === cat
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuración de la Categoría Seleccionada */}
              {formatConfig.categoriaSeleccionada && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Configuración: {formatConfig.categoriaSeleccionada}
                  </h3>

                  {/* Selector de Formato */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Formato</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[
                        { value: 'todos-contra-todos', label: '🔄 Todos contra Todos', desc: 'Cada equipo juega contra todos' },
                        { value: 'series', label: '📊 Por Series', desc: 'Dividido en grupos' },
                        { value: 'fases', label: '🏆 Por Fases', desc: 'Fase de grupos + Playoffs + Final' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => actualizarConfigCategoria({
                            formato: option.value,
                            series: option.value === 'series' ? obtenerConfigCategoria().series : [],
                            fases: option.value === 'fases' ? obtenerConfigCategoria().fases : []
                          })}
                          className={`p-2 px-3 rounded-lg border-2 text-left transition-all text-sm ${
                            obtenerConfigCategoria().formato === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-xs">{option.label}</p>
                          <p className="text-xs text-gray-600">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ida y Vuelta */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Modalidad</label>
                    <div className="flex gap-2">
                      {[
                        { value: true, label: '↔️ Ida y Vuelta' },
                        { value: false, label: '→ Solo Ida' }
                      ].map(option => (
                        <button
                          key={String(option.value)}
                          onClick={() => actualizarConfigCategoria({ idaVuelta: option.value })}
                          className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                            obtenerConfigCategoria().idaVuelta === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Configuración de Fixture */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Días entre jornadas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={obtenerConfigCategoria().diasEntreJornadas || 7}
                        onChange={(e) => actualizarConfigCategoria({
                          diasEntreJornadas: parseInt(e.target.value) || 7
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="7"
                      />
                      <p className="text-xs text-gray-500 mt-1">Días de separación entre cada jornada</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🕐 Hora de inicio
                      </label>
                      <input
                        type="time"
                        value={obtenerConfigCategoria().horaInicio || '18:00'}
                        onChange={(e) => actualizarConfigCategoria({
                          horaInicio: e.target.value + ':00'
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hora predeterminada de los partidos</p>
                    </div>
                  </div>

                  {/* Días de Juego */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      📆 Días de juego
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 0, label: 'Dom' },
                        { value: 1, label: 'Lun' },
                        { value: 2, label: 'Mar' },
                        { value: 3, label: 'Mié' },
                        { value: 4, label: 'Jue' },
                        { value: 5, label: 'Vie' },
                        { value: 6, label: 'Sáb' }
                      ].map((dia) => {
                        const diasJuego = obtenerConfigCategoria().diasJuego || [];
                        const isSelected = diasJuego.includes(dia.value);

                        return (
                          <button
                            key={dia.value}
                            type="button"
                            onClick={() => {
                              const current = obtenerConfigCategoria().diasJuego || [];
                              const newDias = isSelected
                                ? current.filter(d => d !== dia.value)
                                : [...current, dia.value].sort((a, b) => a - b);
                              actualizarConfigCategoria({ diasJuego: newDias });
                            }}
                            className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {dia.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selecciona los días de la semana en que se jugarán los partidos de esta categoría
                    </p>
                  </div>

                  {/* ============ FORMATO: SERIES ============ */}
                  {obtenerConfigCategoria().formato === 'series' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Número de Series</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={obtenerConfigCategoria().numSeries || 1}
                        onChange={(e) => {
                          const newNum = parseInt(e.target.value) || 1;
                          actualizarConfigCategoria({
                            numSeries: newNum,
                            series: Array(newNum).fill(null).map((_, i) => ({
                              nombre: `Serie ${String.fromCharCode(65 + i)}`,
                              equipos: obtenerConfigCategoria().series?.[i]?.equipos || []
                            }))
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-24"
                      />

                      {/* Editor Visual de Series */}
                      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Equipos Disponibles */}
                        <div className="lg:col-span-1">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm">📋 Disponibles ({getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length})</h4>
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-96 overflow-y-auto">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).map((equipo, idx) => (
                                <TeamCard
                                  key={idx}
                                  equipo={equipo}
                                  onDragStart={(e) => e.dataTransfer.setData('equipo', equipo)}
                                />
                              ))}
                              {getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-4 w-full">Todos asignados ✓</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Series */}
                        <div className="lg:col-span-2 space-y-3">
                          {/* Botones de Acción Rápida */}
                          <div className="flex gap-2">
                            <button
                              onClick={distribuirAleatoriamente}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                            >
                              <Shuffle size={20} />
                              🎲 Distribuir
                            </button>

                          </div>
                          <p className="text-xs text-gray-600 text-center">
                            {getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length} disponibles • {obtenerConfigCategoria().numSeries} series
                          </p>

                          {obtenerConfigCategoria().series && obtenerConfigCategoria().series.map((serie, serieIdx) => (
                            <div
                              key={serieIdx}
                              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-4"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <input
                                  type="text"
                                  value={serie.nombre}
                                  onChange={(e) => {
                                    const config = obtenerConfigCategoria();
                                    const newSeries = [...config.series];
                                    newSeries[serieIdx].nombre = e.target.value;
                                    actualizarConfigCategoria({ series: newSeries });
                                  }}
                                  className="px-3 py-1 border border-blue-300 rounded font-semibold text-gray-900 bg-white flex-1"
                                  placeholder="Nombre de la serie"
                                />
                                <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded whitespace-nowrap">
                                  {serie.equipos ? serie.equipos.length : 0} equipos
                                </span>
                              </div>

                              {/* Zona Drop */}
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.add('ring-2', 'ring-blue-500', 'bg-blue-200');
                                }}
                                onDragLeave={(e) => {
                                  e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-200');
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-200');
                                  const equipo = e.dataTransfer.getData('equipo');
                                  if (equipo && (!serie.equipos || !serie.equipos.includes(equipo))) {
                                    const config = obtenerConfigCategoria();
                                    const newSeries = [...config.series];
                                    newSeries[serieIdx].equipos = [...(newSeries[serieIdx].equipos || []), equipo];
                                    actualizarConfigCategoria({ series: newSeries });
                                  }
                                }}
                                className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-3 min-h-32 transition-all"
                              >
                                {serie.equipos && serie.equipos.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 justify-start">
                                    {serie.equipos.map((equipo, eIdx) => (
                                      <SelectedTeamCard
                                        key={eIdx}
                                        equipo={equipo}
                                        onRemove={() => {
                                          const config = obtenerConfigCategoria();
                                          const newSeries = [...config.series];
                                          newSeries[serieIdx].equipos = newSeries[serieIdx].equipos.filter((_, idx) => idx !== eIdx);
                                          actualizarConfigCategoria({ series: newSeries });
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
                                    Arrastra equipos aquí
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============ FORMATO: FASES ============ */}
                  {obtenerConfigCategoria().formato === 'fases' && (
                    <div className="space-y-6">
                      {/* Info */}
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">📋 Cómo funciona "Por Fases"</h4>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                          <li><strong>Fase 1 (Grupos):</strong> Los equipos se dividen en grupos. Todos juegan entre sí.</li>
                          <li><strong>Fase 2 (Playoffs):</strong> Los mejores de cada grupo avanzan a semifinales (eliminación directa).</li>
                          <li><strong>Fase 3 (Final):</strong> Los dos ganadores compiten por el título.</li>
                        </ul>
                      </div>

                      {/* FASE 1: GRUPOS */}
                      <div className="bg-white border-2 border-blue-300 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                          <h4 className="text-lg font-bold text-gray-900">Fase de Grupos</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Número de grupos</label>
                            <input
                              type="number"
                              min="2"
                              max="8"
                              value={obtenerConfigCategoria().fases?.[0]?.series?.length || 2}
                              onChange={(e) => {
                                const newNum = parseInt(e.target.value) || 2;
                                const fases = [...obtenerConfigCategoria().fases];
                                fases[0] = {
                                  ...fases[0],
                                  series: Array(newNum).fill(null).map((_, i) => ({
                                    nombre: `Grupo ${String.fromCharCode(65 + i)}`,
                                    equipos: fases[0]?.series?.[i]?.equipos || []
                                  }))
                                };
                                actualizarConfigCategoria({ fases });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg w-32 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Equipos que avanzan por grupo</label>
                            <input
                              type="number"
                              min="1"
                              max="4"
                              defaultValue="2"
                              onChange={(e) => {
                                const fases = [...obtenerConfigCategoria().fases];
                                fases[0] = { ...fases[0], equiposAvanzan: parseInt(e.target.value) };
                                actualizarConfigCategoria({ fases });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg w-32 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Grid de Grupos */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Distribución de equipos en grupos:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {obtenerConfigCategoria().fases?.[0]?.series?.map((grupo, idx) => (
                              <div key={idx} className="bg-white border-2 border-blue-200 rounded-lg p-3">
                                <div className="font-semibold text-blue-600 text-sm mb-2">{grupo.nombre}</div>
                                <div className="space-y-1">
                                  {grupo.equipos && grupo.equipos.length > 0 ? (
                                    grupo.equipos.map((equipo, eIdx) => (
                                      <div key={eIdx} className="text-xs bg-blue-50 px-2 py-1 rounded text-gray-700 truncate">
                                        {equipo}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-400 italic">Sin equipos</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Botón para distribuir */}
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              const config = obtenerConfigCategoria();
                              const equiposDisponibles = getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada);
                              
                              if (equiposDisponibles.length === 0) {
                                alert('No hay equipos disponibles. Primero asigna equipos a esta fase.');
                                return;
                              }

                              // Barajar
                              const equiposBarajados = [...equiposDisponibles];
                              for (let i = equiposBarajados.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [equiposBarajados[i], equiposBarajados[j]] = [equiposBarajados[j], equiposBarajados[i]];
                              }

                              const numGrupos = config.fases[0].series.length;
                              const equiposPorGrupo = Math.floor(equiposBarajados.length / numGrupos);
                              const residuo = equiposBarajados.length % numGrupos;

                              const fases = [...config.fases];
                              fases[0].series = fases[0].series.map((grupo, idx) => {
                                const inicio = idx * equiposPorGrupo + Math.min(idx, residuo);
                                const cantidad = equiposPorGrupo + (idx < residuo ? 1 : 0);
                                return {
                                  ...grupo,
                                  equipos: equiposBarajados.slice(inicio, inicio + cantidad)
                                };
                              });

                              actualizarConfigCategoria({ fases });
                            }}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                          >
                            <Shuffle size={18} />
                            Distribuir Aleatoriamente
                          </button>
                        </div>
                      </div>

                      {/* FASE 2: PLAYOFFS */}
                      <div className="bg-white border-2 border-orange-300 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                          <h4 className="text-lg font-bold text-gray-900">Playoffs / Semifinales</h4>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Automático:</strong> Los {obtenerConfigCategoria().fases?.[0]?.equiposAvanzan || 1} mejores de cada grupo avanzan automáticamente.
                          </p>
                          <p className="text-xs text-gray-600">
                            Total de equipos en playoffs: <strong>{((obtenerConfigCategoria().fases?.[0]?.series?.length || 2) * (obtenerConfigCategoria().fases?.[0]?.equiposAvanzan || 1))}</strong>
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500 rounded p-3">
                          <p className="text-sm text-orange-900">
                            <strong>Formato:</strong> Se jugarán semifinales (eliminación directa) entre los equipos que avanzan, luego la final.
                          </p>
                        </div>
                      </div>

                      {/* FASE 3: FINAL */}
                      <div className="bg-white border-2 border-green-300 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                          <h4 className="text-lg font-bold text-gray-900">Final</h4>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 mb-2">
                            🏆 <strong>Campeón:</strong> Los 2 ganadores de las semifinales compiten por el título.
                          </p>
                          <p className="text-xs text-gray-600">
                            El ganador de esta final se corona campeón de la categoría.
                          </p>
                        </div>
                      </div>

                      {/* Resumen Visual */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">📊 Flujo del Torneo</h5>
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-gray-700">
                          <div className="flex-1 text-center">
                            <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1 font-bold">
                              {getTodosEquiposPorCategoria(formatConfig.categoriaSeleccionada).length}
                            </div>
                            Equipos
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="flex-1 text-center">
                            <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1 font-bold">
                              {obtenerConfigCategoria().fases?.[0]?.series?.length || 2}G
                            </div>
                            Grupos
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="flex-1 text-center">
                            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1 font-bold">
                              {((obtenerConfigCategoria().fases?.[0]?.series?.length || 2) * (obtenerConfigCategoria().fases?.[0]?.equiposAvanzan || 1))}
                            </div>
                            Playoffs
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="flex-1 text-center">
                            <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1 font-bold">
                              1
                            </div>
                            Campeón
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============ FORMATO: TODOS CONTRA TODOS ============ */}
                  {obtenerConfigCategoria().formato === 'todos-contra-todos' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Equipos Participantes ({obtenerConfigCategoria().equipos?.length || 0} de {getTodosEquiposPorCategoria(formatConfig.categoriaSeleccionada).length})</label>
                      
                      {/* Botones de Acción Rápida */}
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => {
                            // Seleccionar todos los disponibles
                            const todosDisponibles = getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada);
                            const equiposActuales = obtenerConfigCategoria().equipos || [];
                            actualizarConfigCategoria({
                              equipos: [...equiposActuales, ...todosDisponibles]
                            });
                          }}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        >
                          ✓ Seleccionar Todos ({getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length})
                        </button>
                        <button
                          onClick={() => {
                            // Limpiar selección
                            actualizarConfigCategoria({ equipos: [] });
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        >
                          ✕ Limpiar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Disponibles */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm">📋 Disponibles ({getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length})</h4>
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-64 overflow-y-auto">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).length > 0 ? (
                                getEquiposDisponiblesPorCategoria(formatConfig.categoriaSeleccionada).map((equipo, idx) => (
                                  <TeamCard
                                    key={idx}
                                    equipo={equipo}
                                    onDragStart={(e) => e.dataTransfer.setData('equipo', equipo)}
                                  />
                                ))
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center w-full">
                                  Todos los equipos están seleccionados ✓
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Seleccionados */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm">✅ Seleccionados ({obtenerConfigCategoria().equipos?.length || 0})</h4>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('ring-2', 'ring-blue-500');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
                              const equipo = e.dataTransfer.getData('equipo');
                              if (equipo && (!obtenerConfigCategoria().equipos || !obtenerConfigCategoria().equipos.includes(equipo))) {
                                const equiposActuales = obtenerConfigCategoria().equipos || [];
                                actualizarConfigCategoria({ equipos: [...equiposActuales, equipo] });
                              }
                            }}
                            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 min-h-64 overflow-y-auto transition-all"
                          >
                            {obtenerConfigCategoria().equipos && obtenerConfigCategoria().equipos.length > 0 ? (
                              <div className="flex flex-wrap gap-2 justify-start">
                                {obtenerConfigCategoria().equipos.map((equipo, idx) => (
                                  <SelectedTeamCard
                                    key={idx}
                                    equipo={equipo}
                                    onRemove={() => {
                                      const equiposActuales = obtenerConfigCategoria().equipos || [];
                                      actualizarConfigCategoria({
                                        equipos: equiposActuales.filter((_, eIdx) => eIdx !== idx)
                                      });
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
                                Arrastra equipos o usa "Seleccionar Todos"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 sticky bottom-0">
              <button
                onClick={() => setShowFormatModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFormat}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                💾 Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tabla de Posiciones */}
      {showTablaPosiciones && campeonatoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">📊 Tabla de Posiciones</h2>
                  <p className="text-sm text-gray-600 mt-1">{campeonatoSeleccionado.nombre}</p>
                </div>
                <button
                  onClick={() => setShowTablaPosiciones(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Selector de Categorías */}
              {campeonatoSeleccionado.categorias && campeonatoSeleccionado.categorias.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {campeonatoSeleccionado.categorias.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaSeleccionadaTabla(cat)}
                      className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                        categoriaSeleccionadaTabla === cat
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contenido - Tabla de la Categoría Seleccionada */}
            <div className="p-6">
              {categoriaSeleccionadaTabla ? (
                <div>
                  {(() => {
                    const datos = obtenerTablaPosiciones(campeonatoSeleccionado.id, categoriaSeleccionadaTabla);
                    
                    // Verificar si es voleibol (tiene grupos) o fútbol (es array)
                    if (typeof datos === 'object' && !Array.isArray(datos)) {
                      // VOLEIBOL - CON GRUPOS
                      return (
                        <div className="space-y-6">
                          {Object.entries(datos).length > 0 ? (
                            Object.entries(datos).map(([nombreGrupo, equipos], grupoIdx) => (
                              <div key={grupoIdx} className="border-2 border-purple-300 rounded-lg overflow-hidden">
                                {/* Título grupo */}
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3">
                                  <h3 className="text-lg font-bold">{categoriaSeleccionadaTabla} - {nombreGrupo}</h3>
                                </div>

                                {/* Tabla voleibol */}
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pos</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Equipo</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">PJ</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">PG</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">PP</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">WO</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 bg-yellow-100">PTS</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">S.G.</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">S.P.</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Promedio</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {equipos && equipos.length > 0 ? (
                                        equipos.map((equipo, idx) => (
                                          <tr 
                                            key={idx}
                                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                              idx === 0 ? 'bg-green-50' : idx < 2 ? 'bg-blue-50' : ''
                                            }`}
                                          >
                                            <td className="px-4 py-3 text-sm font-bold">
                                              <span className={`inline-block w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                              }`}>
                                                {equipo.pos}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{equipo.equipo}</td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.pj}</td>
                                            <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{equipo.pg}</td>
                                            <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">{equipo.pp}</td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.wo}</td>
                                            <td className="px-4 py-3 text-center text-sm font-bold bg-yellow-100 text-gray-900">{equipo.pts}</td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.sg}</td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.sp}</td>
                                            <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700">{equipo.promedio}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                                            Sin datos disponibles
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Leyenda */}
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-gray-600">
                                    <div><span className="font-semibold">PJ:</span> Partidos Jugados</div>
                                    <div><span className="font-semibold">PG:</span> Partidos Ganados</div>
                                    <div><span className="font-semibold">PP:</span> Partidos Perdidos</div>
                                    <div><span className="font-semibold">WO:</span> Walk Over</div>
                                    <div><span className="font-semibold">PTS:</span> Puntos</div>
                                    <div><span className="font-semibold">S.G.:</span> Sets Ganados</div>
                                    <div><span className="font-semibold">S.P.:</span> Sets Perdidos</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-gray-500 text-lg">Sin datos disponibles para esta categoría.</p>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // FÚTBOL - TABLA SIMPLE
                      return (
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          {/* Título categoría */}
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3">
                            <h3 className="text-lg font-bold">{categoriaSeleccionadaTabla}</h3>
                          </div>

                          {/* Tabla */}
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pos</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Equipo</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">PJ</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">G</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">E</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">P</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">GF</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">GC</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">DG</th>
                                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 bg-yellow-100">Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {datos && datos.length > 0 ? (
                                  datos.map((equipo, idx) => (
                                    <tr 
                                      key={idx}
                                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                        idx === 0 ? 'bg-green-50' : idx < 2 ? 'bg-blue-50' : ''
                                      }`}
                                    >
                                      <td className="px-4 py-3 text-sm font-bold">
                                        <span className={`inline-block w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                          idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                        }`}>
                                          {equipo.pos}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{equipo.equipo}</td>
                                      <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.pj}</td>
                                      <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{equipo.g}</td>
                                      <td className="px-4 py-3 text-center text-sm text-blue-600 font-semibold">{equipo.e}</td>
                                      <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">{equipo.p}</td>
                                      <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.gf}</td>
                                      <td className="px-4 py-3 text-center text-sm text-gray-700">{equipo.gc}</td>
                                      <td className="px-4 py-3 text-center text-sm font-semibold" style={{
                                        color: equipo.dg > 0 ? '#16a34a' : equipo.dg < 0 ? '#dc2626' : '#6b7280'
                                      }}>
                                        {equipo.dg > 0 ? '+' : ''}{equipo.dg}
                                      </td>
                                      <td className="px-4 py-3 text-center text-sm font-bold bg-yellow-100 text-gray-900">{equipo.pts}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                                      Sin datos disponibles
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Leyenda */}
                          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-gray-600">
                              <div><span className="font-semibold">PJ:</span> Partidos Jugados</div>
                              <div><span className="font-semibold">G:</span> Ganados</div>
                              <div><span className="font-semibold">E:</span> Empatados</div>
                              <div><span className="font-semibold">P:</span> Perdidos</div>
                              <div><span className="font-semibold">GF/GC:</span> Goles A Favor/Contra</div>
                              <div><span className="font-semibold">DG:</span> Diferencia de Goles</div>
                              <div><span className="font-semibold">Pts:</span> Puntos</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Selecciona una categoría para ver la tabla de posiciones.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowTablaPosiciones(false)}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorías */}
      <ModalCategoriaCampeonato
        isOpen={showModalCategorias}
        onClose={() => {
          setShowModalCategorias(false);
          setCampeonatoParaCategorias(null);
        }}
        campeonato={campeonatoParaCategorias}
        onSave={() => {
          cargarCampeonatos();
        }}
      />
    </div>
  );
}