import React from "react";
import { TrendingUp } from "lucide-react";

export function ReportesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
      <p className="text-gray-600 mt-2">Visualiza todos tus reportes disponibles.</p>
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Aquí irán los reportes...</p>
        </div>
      </div>
    </div>
  );
}