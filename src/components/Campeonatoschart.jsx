import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react';
import { API_BASE } from '../services/api.config';

const API_BASE_URL = API_BASE;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export default function CampeonatosChart() {
  const [campeonatos, setCampeonatos] = useState({
    activos: 0,
    finalizados: 0,
    proximamente: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampeonatos();
  }, []);

  const fetchCampeonatos = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/campeonato`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al cargar campeonatos');
      }

      const responseData = await response.json();

      // Extraer array de campeonatos (puede venir como array directo o como {data: []})
      const data = Array.isArray(responseData) ? responseData :
                   (responseData?.data && Array.isArray(responseData.data) ? responseData.data : []);

      if (data.length > 0 || responseData?.success) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const stats = {
          activos: 0,
          finalizados: 0,
          proximamente: 0,
          total: data.length,
        };

        data.forEach(camp => {
          const fechaInicio = camp.fecha_inicio ? new Date(camp.fecha_inicio) : null;
          const fechaFin = camp.fecha_fin ? new Date(camp.fecha_fin) : null;

          if (fechaInicio && fechaFin) {
            if (hoy >= fechaInicio && hoy <= fechaFin) {
              stats.activos++;
            } else if (hoy > fechaFin) {
              stats.finalizados++;
            } else if (hoy < fechaInicio) {
              stats.proximamente++;
            }
          } else {
            stats.activos++; // Por defecto consideramos activo si no hay fechas
          }
        });

        setCampeonatos(stats);
      }
    } catch (error) {
      console.error('Error al cargar campeonatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value) => {
    if (campeonatos.total === 0) return 0;
    return ((value / campeonatos.total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          Estado de Campeonatos
        </h2>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-600" />
        Estado de Campeonatos
      </h2>

      <div className="space-y-4">
        {/* Campeonatos Activos */}
        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Activos</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{campeonatos.activos}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(campeonatos.activos)}%` }}
            ></div>
          </div>
          <p className="text-xs text-green-700 mt-1">{getPercentage(campeonatos.activos)}% del total</p>
        </div>

        {/* Campeonatos Próximamente */}
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Próximamente</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{campeonatos.proximamente}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(campeonatos.proximamente)}%` }}
            ></div>
          </div>
          <p className="text-xs text-blue-700 mt-1">{getPercentage(campeonatos.proximamente)}% del total</p>
        </div>

        {/* Campeonatos Finalizados */}
        <div className="border-l-4 border-gray-500 bg-gray-50 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Finalizados</span>
            </div>
            <span className="text-2xl font-bold text-gray-600">{campeonatos.finalizados}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(campeonatos.finalizados)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-700 mt-1">{getPercentage(campeonatos.finalizados)}% del total</p>
        </div>
      </div>

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total de Campeonatos</span>
          <span className="text-xl font-bold text-gray-900">{campeonatos.total}</span>
        </div>
      </div>
    </div>
  );
}