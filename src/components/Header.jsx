// ===============================================
// ARCHIVO: src/components/Header.jsx
// ===============================================

import React from 'react';
import { Menu, X, User } from 'lucide-react';

export function Header({ sidebarOpen, onToggleSidebar,userName }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Botón toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Avatar del usuario */}
      <div className="flex items-center space-x-4">
<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white font-bold text-lg">
          {userName ? userName.charAt(0).toUpperCase() : <User size={60} />}
        </div>      </div>
    </header>
  );
}