// ===============================================
// ARCHIVO: src/pages/TablaPosiciones.jsx
// PÁGINA DE TABLA DE POSICIONES
// ===============================================

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { campeonatoService } from '../services/campeonatoService';
import { categoriaService } from '../services/categoriaService';
import { tablaPosicionesService } from '../services/tablaPosicionesService';

export function TablaPosicionesPage() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatoSeleccionado, setCampeonatoSeleccionado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [posiciones, setPosiciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  useEffect(() => {
    if (campeonatoSeleccionado) {
      cargarCategorias();
    }
  }, [campeonatoSeleccionado]);

  useEffect(() => {
    if (campeonatoSeleccionado && categoriaSeleccionada) {
      cargarPosiciones();
    }
  }, [categoriaSeleccionada]);

  const cargarCampeonatos = async () => {
    try {
      const response = await campeonatoService.getAll();
      if (response.success && response.data) {
        setCampeonatos(response.data);
      }
    } catch (error) {
      console.error('Error al cargar campeonatos:', error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await categoriaService.getCategoriasByCampeonato(campeonatoSeleccionado.id_campeonato);
      if (response.success && response.data) {
        setCategorias(response.data);
        if (response.data.length > 0) {
          setCategoriaSeleccionada(response.data[0]);
        } else {
          setCategoriaSeleccionada(null);
          setPosiciones([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
      setCategoriaSeleccionada(null);
      setPosiciones([]);
    }
  };

  const cargarPosiciones = async () => {
    try {
      setLoading(true);
      const response = await tablaPosicionesService.getPorCampeonatoCategoria(
        campeonatoSeleccionado.id_campeonato,
        categoriaSeleccionada.categoria?.id_categoria || categoriaSeleccionada.id_categoria
      );
      if (response.success && response.data) {
        setPosiciones(response.data);
      } else {
        setPosiciones([]);
      }
    } catch (error) {
      console.error('Error al cargar posiciones:', error);
      setPosiciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar medalla según posición
  const renderPosicion = (pos) => {
    if (pos === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full">
          <Medal className="text-yellow-800" size={18} />
        </div>
      );
    } else if (pos === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
          <Medal className="text-gray-600" size={18} />
        </div>
      );
    } else if (pos === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-amber-600 rounded-full">
          <Medal className="text-amber-900" size={18} />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-gray-700 font-bold">
        {pos}
      </div>
    );
  };

  // Renderizar indicador de diferencia
  const renderDiferencia = (valor) => {
    if (valor > 0) {
      return <span className="text-green-600 font-medium">+{valor}</span>;
    } else if (valor < 0) {
      return <span className="text-red-600 font-medium">{valor}</span>;
    }
    return <span className="text-gray-500">0</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="text-yellow-500" size={32} />
          Tabla de Posiciones
        </h1>
        <p className="text-gray-600 mt-2">
          Consulta las posiciones de los equipos en cada campeonato y categoría
        </p>
      </div>

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Selector de Campeonato */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Campeonato
          </label>
          <select
            value={campeonatoSeleccionado?.id_campeonato || ''}
            onChange={(e) => {
              const camp = campeonatos.find(c => c.id_campeonato === parseInt(e.target.value));
              setCampeonatoSeleccionado(camp);
              setCategoriaSeleccionada(null);
              setPosiciones([]);
            }}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Selecciona un campeonato</option>
            {campeonatos.map((camp) => (
              <option key={camp.id_campeonato} value={camp.id_campeonato}>
                {camp.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Categoría */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={categoriaSeleccionada?.id_cc || ''}
            onChange={(e) => {
              const cat = categorias.find(c => c.id_cc === parseInt(e.target.value));
              setCategoriaSeleccionada(cat);
            }}
            disabled={!campeonatoSeleccionado}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {campeonatoSeleccionado ? 'Selecciona una categoría' : 'Primero selecciona un campeonato'}
            </option>
            {categorias.map((cat) => (
              <option key={cat.id_cc} value={cat.id_cc}>
                {cat.categoria?.nombre || cat.nombre} - {cat.categoria?.genero || cat.genero}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Posiciones */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posiciones.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">
              {!campeonatoSeleccionado
                ? 'Selecciona un campeonato para ver la tabla'
                : !categoriaSeleccionada
                  ? 'Selecciona una categoría para ver la tabla'
                  : 'No hay equipos en la tabla de posiciones'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-4 text-center w-16">Pos</th>
                  <th className="px-4 py-4 text-left">Equipo</th>
                  <th className="px-4 py-4 text-center w-16">PJ</th>
                  <th className="px-4 py-4 text-center w-16">G</th>
                  <th className="px-4 py-4 text-center w-16">P</th>
                  <th className="px-4 py-4 text-center w-20">SG</th>
                  <th className="px-4 py-4 text-center w-20">SP</th>
                  <th className="px-4 py-4 text-center w-20">DS</th>
                  <th className="px-4 py-4 text-center w-20">PF</th>
                  <th className="px-4 py-4 text-center w-20">PC</th>
                  <th className="px-4 py-4 text-center w-20">DP</th>
                  <th className="px-4 py-4 text-center w-20 bg-blue-800">PTS</th>
                </tr>
              </thead>
              <tbody>
                {posiciones.map((pos, index) => (
                  <tr
                    key={pos.id_tabla || index}
                    className={`
                      border-b border-gray-100 hover:bg-blue-50 transition-colors
                      ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-white' : ''}
                    `}
                  >
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        {renderPosicion(pos.posicion)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {pos.equipo?.club?.logo ? (
                          <img
                            src={pos.equipo.club.logo}
                            alt={pos.equipo.club.nombre}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Trophy size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {pos.equipo?.nombre || 'Equipo'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {pos.equipo?.club?.nombre || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">{pos.partidos_jugados || 0}</td>
                    <td className="px-4 py-4 text-center text-green-600 font-medium">{pos.ganados || 0}</td>
                    <td className="px-4 py-4 text-center text-red-600 font-medium">{pos.perdidos || 0}</td>
                    <td className="px-4 py-4 text-center">{pos.sets_ganados || 0}</td>
                    <td className="px-4 py-4 text-center">{pos.sets_perdidos || 0}</td>
                    <td className="px-4 py-4 text-center">{renderDiferencia(pos.diferencia_sets || 0)}</td>
                    <td className="px-4 py-4 text-center">{pos.puntos_favor || 0}</td>
                    <td className="px-4 py-4 text-center">{pos.puntos_contra || 0}</td>
                    <td className="px-4 py-4 text-center">{renderDiferencia(pos.diferencia_puntos || 0)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">
                        {pos.puntos || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leyenda */}
      {posiciones.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Leyenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div><span className="font-medium">PJ:</span> Partidos Jugados</div>
            <div><span className="font-medium">G:</span> Ganados</div>
            <div><span className="font-medium">P:</span> Perdidos</div>
            <div><span className="font-medium">SG:</span> Sets Ganados</div>
            <div><span className="font-medium">SP:</span> Sets Perdidos</div>
            <div><span className="font-medium">DS:</span> Diferencia de Sets</div>
            <div><span className="font-medium">PF:</span> Puntos a Favor</div>
            <div><span className="font-medium">PC:</span> Puntos en Contra</div>
            <div><span className="font-medium">DP:</span> Diferencia de Puntos</div>
            <div><span className="font-medium">PTS:</span> Puntos en Tabla</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              <strong>Sistema de puntos:</strong> Victoria = 2 pts | Derrota = 1 pt | WO = 2 pts (ganador), 0 pts (perdedor)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablaPosicionesPage;
