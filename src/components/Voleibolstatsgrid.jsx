import React, { useState, useEffect } from 'react';
import { Users, Building2, Trophy, Calendar, UserCheck, Briefcase } from 'lucide-react';
import { API_BASE } from '../services/api.config';

const API_BASE_URL = API_BASE;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export default function VoleibolStatsGrid() {
  const [stats, setStats] = useState({
    jugadores: 0,
    clubes: 0,
    campeonatos: 0,
    equipos: 0,
    jueces: 0,
    eqTecnico: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch todas las estadísticas en paralelo
      const [jugadoresRes, clubesRes, campeonatosRes, equiposRes, juecesRes, eqTecnicoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jugadores`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/club`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/campeonato`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/equipo`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/jueces`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/eqtecnicos`, { headers: getAuthHeaders() }),
      ]);

      const [jugadores, clubes, campeonatos, equipos, jueces, eqTecnico] = await Promise.all([
        jugadoresRes.json(),
        clubesRes.json(),
        campeonatosRes.json(),
        equiposRes.json(),
        juecesRes.json(),
        eqTecnicoRes.json(),
      ]);

      // Helper para extraer conteo de la respuesta (puede ser array directo o {data: [], total: N})
      const getCount = (response) => {
        if (Array.isArray(response)) return response.length;
        if (response?.total !== undefined) return response.total;
        if (response?.data && Array.isArray(response.data)) return response.data.length;
        return 0;
      };

      // Debug: mostrar las respuestas en consola
      console.log('📊 Dashboard Stats Response:', {
        jugadores, clubes, campeonatos, equipos, jueces, eqTecnico
      });

      const newStats = {
        jugadores: getCount(jugadores),
        clubes: getCount(clubes),
        campeonatos: getCount(campeonatos),
        equipos: getCount(equipos),
        jueces: getCount(jueces),
        eqTecnico: getCount(eqTecnico),
      };

      console.log('📊 Dashboard Stats Calculated:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Jugadores',
      value: stats.jugadores,
      icon: Users,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Clubes',
      value: stats.clubes,
      icon: Building2,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Campeonatos',
      value: stats.campeonatos,
      icon: Trophy,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Equipos',
      value: stats.equipos,
      icon: Calendar,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Jueces',
      value: stats.jueces,
      icon: UserCheck,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Equipo Técnico',
      value: stats.eqTecnico,
      icon: Briefcase,
      color: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgLight} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}