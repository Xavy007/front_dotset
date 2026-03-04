import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

export const DateTimePicker = ({ value, onChange, format = 'dd/mm/yyyy' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  // ⭐ Limitar años permitidos (solo hasta hoy o próximo año si es fin de año)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const maxYear = todayMonth >= 10 ? todayYear + 1 : todayYear;

  // ✅ FIX: Función helper para convertir value a Date
  const parseValue = (val) => {
    if (!val) return null;

    // Si ya es un Date válido
    if (val instanceof Date && !isNaN(val)) {
      return val;
    }

    // Si es string en formato ISO (yyyy-MM-dd)
    if (typeof val === 'string') {
      // Agregar hora para evitar problemas de zona horaria
      const dateStr = val.includes('T') ? val : `${val}T00:00:00`;
      const parsed = new Date(dateStr);

      console.log('📅 DateTimePicker - Parseando fecha:', val, '→', parsed);

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    console.warn('⚠️ DateTimePicker - Valor inválido:', val);
    return null;
  };

  const [selectedDate, setSelectedDate] = useState(() => parseValue(value));
  const [hours, setHours] = useState(selectedDate?.getHours() || 0);
  const [minutes, setMinutes] = useState(selectedDate?.getMinutes() || 0);
  const [selectedYear, setSelectedYear] = useState(
    selectedDate?.getFullYear() || currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    selectedDate?.getMonth() || currentDate.getMonth()
  );
  const containerRef = useRef(null);

  // ✅ AGREGAR: Sincronizar selectedDate cuando value cambia desde fuera
  useEffect(() => {
    console.log('🔄 DateTimePicker - value cambió:', value);
    const parsedDate = parseValue(value);

    if (parsedDate) {
      setSelectedDate(parsedDate);
      setHours(parsedDate.getHours());
      setMinutes(parsedDate.getMinutes());
      setSelectedYear(parsedDate.getFullYear());
      setSelectedMonth(parsedDate.getMonth());
      setCurrentDate(parsedDate);

      console.log('✅ DateTimePicker - Estado actualizado:', {
        date: parsedDate,
        formatted: formatDate(parsedDate),
      });
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    if (format === 'dd/mm/yyyy') {
      return `${day}/${month}/${year}`;
    } else if (format === 'dd/mm/yyyy hh:mm') {
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleSelectDay = (day) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // ⭐ Evitar seleccionar fechas futuras
    if (
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth) ||
      (selectedYear === currentYear &&
        selectedMonth === currentMonth &&
        day > currentDay)
    ) {
      return;
    }

    const newDate = new Date(selectedYear, selectedMonth, day);
    setSelectedDate(newDate);

    if (format === 'dd/mm/yyyy') {
      // ✅ FIX: Devolver en formato yyyy-MM-dd para compatibilidad con backend
      const formatted = `${newDate.getFullYear()}-${String(
        newDate.getMonth() + 1
      ).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      console.log('📅 DateTimePicker - Fecha seleccionada:', formatted);
      onChange(formatted);
      setIsOpen(false);
    } else {
      setView('time');
    }
  };

  const handleConfirmTime = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate);
      setIsOpen(false);
    }
  };

  const handleSelectMonthYear = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setView('calendar');
  };

  const days = [];
  const tempDate = new Date(selectedYear, selectedMonth);
  const daysInMonth = getDaysInMonth(tempDate);
  const firstDay = getFirstDayOfMonth(tempDate);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = tempDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const yearRange = [];
  // ⭐ Usar maxYear en vez de 2050
  for (let year = 1950; year <= maxYear; year++) {
    yearRange.push(year);
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={selectedDate ? formatDate(selectedDate) : ''}
        onChange={() => {}}
        onClick={() => setIsOpen(!isOpen)}
        placeholder={format}
        className={`
          w-full px-0 py-3 sm:py-2.5 bg-transparent text-gray-900 text-base sm:text-sm
          border-b-2 transition-all duration-300
          focus:outline-none cursor-pointer font-medium
          placeholder-gray-400
          ${isOpen ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'}
        `}
        readOnly
      />

      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {format === 'dd/mm/yyyy hh:mm' ? (
          <Clock size={20} className="sm:w-4 sm:h-4" />
        ) : (
          <CalendarIcon size={20} className="sm:w-4 sm:h-4" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-3 sm:mt-2 bg-white rounded-2xl sm:rounded-lg shadow-2xl z-50 border border-gray-200 overflow-hidden w-full sm:w-96">
          {view === 'month-year' && (
            <div className="p-4 sm:p-4">
              <h3 className="text-lg sm:text-base font-bold text-gray-900 mb-4">
                Selecciona Año
              </h3>

              <div className="grid grid-cols-4 gap-2 mb-4 max-h-60 overflow-y-auto">
                {yearRange.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedYear(year);
                    }}
                    className={`
                      p-2 rounded-lg font-bold text-sm transition-all duration-200
                      ${
                        selectedYear === year
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-100 active:bg-blue-200'
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <h3 className="text-lg sm:text-base font-bold text-gray-900 mb-4">
                Selecciona Mes
              </h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMonth(index);
                    }}
                    className={`
                      p-2 rounded-lg font-bold text-sm transition-all duration-200
                      ${
                        selectedMonth === index
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-100 active:bg-blue-200'
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectMonthYear();
                }}
                className="w-full py-3 text-base sm:text-sm font-bold bg-blue-600 text-white rounded-xl sm:rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                ✓ Confirmar
              </button>
            </div>
          )}

          {view === 'calendar' && (
            <div className="p-4 sm:p-4">
              <div className="flex items-center justify-between mb-4 sm:mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setView('month-year');
                  }}
                  className="flex-1 text-lg sm:text-base font-bold text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors capitalize text-center"
                >
                  {monthName}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-1 mb-4 sm:mb-3">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm sm:text-xs font-bold text-gray-600 h-10 sm:h-8 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-1 mb-4 sm:mb-3">
                {days.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (day) handleSelectDay(day);
                    }}
                    disabled={!day}
                    className={`
                      h-10 sm:h-7 rounded-lg sm:rounded text-sm sm:text-xs font-semibold transition-all duration-200
                      ${
                        !day
                          ? 'invisible'
                          : selectedDate?.getDate() === day &&
                            selectedDate?.getMonth() === selectedMonth &&
                            selectedDate?.getFullYear() === selectedYear
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-100 active:bg-blue-200'
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const today = new Date();
                  setSelectedYear(today.getFullYear());
                  setSelectedMonth(today.getMonth());
                  handleSelectDay(today.getDate());
                }}
                className="w-full py-2 text-sm sm:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                📅 Hoy
              </button>
            </div>
          )}

          {view === 'time' && (
            <div className="p-4 sm:p-4">
              <h3 className="text-lg sm:text-base font-bold text-gray-900 mb-4">
                ⏰ Selecciona la hora
              </h3>

              <div className="flex gap-4 sm:gap-2 items-center justify-center mb-4">
                <div className="flex flex-col items-center">
                  <label className="text-sm sm:text-xs font-bold text-gray-700 mb-2">
                    Hora
                  </label>
                  <div className="flex items-center gap-3 sm:gap-2 bg-gray-100 rounded-xl sm:rounded p-2">
                    <button
                      type="button"
                      onClick={() => setHours(Math.max(0, hours - 1))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors"
                    >
                      <ChevronLeft
                        size={20}
                        className="sm:w-4 sm:h-4 text-gray-700"
                      />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={String(hours).padStart(2, '0')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val < 0) val = 0;
                        if (val > 23) val = 23;
                        setHours(val);
                      }}
                      className="w-16 sm:w-12 text-center text-3xl sm:text-2xl font-bold bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setHours(Math.min(23, hours + 1))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors"
                    >
                      <ChevronRight
                        size={20}
                        className="sm:w-4 sm:h-4 text-gray-700"
                      />
                    </button>
                  </div>
                </div>

                <div className="text-4xl sm:text-3xl font-bold text-gray-400 h-20 sm:h-16 flex items-center">
                  :
                </div>

                <div className="flex flex-col items-center">
                  <label className="text-sm sm:text-xs font-bold text-gray-700 mb-2">
                    Minuto
                  </label>
                  <div className="flex items-center gap-3 sm:gap-2 bg-gray-100 rounded-xl sm:rounded p-2">
                    <button
                      type="button"
                      onClick={() => setMinutes(Math.max(0, minutes - 5))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors"
                    >
                      <ChevronLeft
                        size={20}
                        className="sm:w-4 sm:h-4 text-gray-700"
                      />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={String(minutes).padStart(2, '0')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val < 0) val = 0;
                        if (val > 59) val = 59;
                        setMinutes(val);
                      }}
                      className="w-16 sm:w-12 text-center text-3xl sm:text-2xl font-bold bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMinutes(Math.min(59, minutes + 5))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors"
                    >
                      <ChevronRight
                        size={20}
                        className="sm:w-4 sm:h-4 text-gray-700"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setView('calendar');
                  }}
                  className="flex-1 py-3 sm:py-2 text-base sm:text-sm font-bold text-gray-700 rounded-xl sm:rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirmTime();
                  }}
                  className="flex-1 py-3 sm:py-2 text-base sm:text-sm font-bold bg-blue-600 text-white rounded-xl sm:rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                  ✓ Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
