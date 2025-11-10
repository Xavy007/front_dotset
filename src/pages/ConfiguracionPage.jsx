import React from "react";
import { Settings } from "lucide-react";
export function ConfiguracionPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
      <p className="text-gray-600 mt-2">Ajusta las configuraciones de tu cuenta.</p>
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Aquí irán las opciones de configuración...</p>
        </div>
      </div>
    </div>
  );
}
