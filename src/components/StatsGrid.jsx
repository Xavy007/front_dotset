import React from 'react';
import StatCard from './StatCard';
import { TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';

export default function StatsGrid() {
  const stats = [
    {
      title: 'Ingresos Totales',
      value: '$45,231.89',
      change: '+20.1%',
      positive: true,
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Usuarios Activos',
      value: '2,543',
      change: '+15%',
      positive: true,
      icon: Users,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Conversiones',
      value: '1,234',
      change: '-4.3%',
      positive: false,
      icon: Activity,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Tráfico',
      value: '98.5K',
      change: '+8.2%',
      positive: true,
      icon: BarChart3,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} Icon={stat.icon} />
      ))}
    </div>
  );
}