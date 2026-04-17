import StatsGrid from './components/StatsGrid';
import ChartSection from './components/ChartSection';
import RecentActivity from './components/RecentActivity';
import React from 'react';
export function Dashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido de vuelta! Aquí está el resumen de tu Asociacion.</p>
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