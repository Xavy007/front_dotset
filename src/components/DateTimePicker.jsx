/**
 * @file DateTimePicker.jsx
 * @description Componente reutilizable de selección de fecha y hora.
 *
 * Implementa un calendario interactivo con tres vistas navegables:
 *   - Vista "calendar"   : cuadrícula mensual para seleccionar un día.
 *   - Vista "month-year" : selección de año (desde 1950 hasta maxYear) y mes.
 *   - Vista "time"       : selector de horas y minutos (formato 24 h), activo
 *                          únicamente cuando el formato incluye hora (datetime).
 *
 * Características destacadas:
 *   - Soporte para restricción de fechas futuras mediante la prop `allowFuture`.
 *   - Soporte para fecha mínima seleccionable mediante la prop `minDate`,
 *     lo que permite encadenar campos (p. ej., fecha_fin ≥ fecha_inicio).
 *   - Cierre automático al hacer clic fuera del componente.
 *   - Devuelve la fecha en formato ISO (yyyy-MM-dd) para compatibilidad con el
 *     backend; en modo datetime devuelve un objeto Date con horas y minutos.
 *
 * @module components/DateTimePicker
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

/**
 * Componente DateTimePicker.
 *
 * @component
 * @param {object}        props
 * @param {string|Date}   props.value       - Valor actual de la fecha. Acepta
 *                                            string ISO (yyyy-MM-dd / ISO 8601)
 *                                            o instancia de Date.
 * @param {function}      props.onChange    - Callback invocado al confirmar una
 *                                            selección. Recibe un string ISO
 *                                            (modo fecha) o un objeto Date
 *                                            (modo datetime).
 * @param {string}        [props.format]    - Formato de visualización.
 *                                            'dd/mm/yyyy'       → solo fecha.
 *                                            'dd/mm/yyyy hh:mm' → fecha y hora.
 *                                            Por defecto: 'dd/mm/yyyy'.
 * @param {boolean}       [props.allowFuture=false] - Permite seleccionar fechas
 *                                            posteriores a la fecha actual.
 *                                            Si es false, los días futuros se
 *                                            deshabilitan visualmente y el rango
 *                                            de años se acota al año vigente.
 * @param {string|Date}   [props.minDate=null]  - Fecha mínima seleccionable
 *                                            (inclusive). Los días anteriores se
 *                                            renderizan deshabilitados.
 * @returns {JSX.Element} Componente de selección de fecha/hora.
 */
export const DateTimePicker = ({ value, onChange, format = 'dd/mm/yyyy', allowFuture = false, minDate = null }) => {

  /* ─────────────────────────────────────────────────
   * Estado del componente
   * ───────────────────────────────────────────────── */

  /** Controla la visibilidad del panel desplegable del calendario. */
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Vista activa dentro del panel:
   *   - 'calendar'   → cuadrícula de días del mes actual.
   *   - 'month-year' → selectores de año y mes.
   *   - 'time'       → selectores de horas y minutos (solo modo datetime).
   */
  const [view, setView] = useState('calendar');

  /** Fecha de referencia para la navegación del calendario (mes/año mostrado). */
  const [currentDate, setCurrentDate] = useState(new Date());

  /* ─────────────────────────────────────────────────
   * Límite superior de años en el selector
   *
   * Si `allowFuture` es verdadero, el rango llega hasta 10 años en el futuro,
   * lo que cubre adecuadamente calendarios deportivos multianuales.
   * En caso contrario, se acota al año en curso (con una excepción de un año
   * adicional para los meses de noviembre y diciembre, anticipando planificación
   * de la siguiente temporada).
   * ───────────────────────────────────────────────── */
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-indexed (0 = enero, 11 = diciembre)
  const maxYear = allowFuture
    ? todayYear + 10
    : (todayMonth >= 10 ? todayYear + 1 : todayYear);

  /* ─────────────────────────────────────────────────
   * Utilidad: parseValue
   * Convierte el valor recibido por prop en un objeto Date normalizado.
   * Soporta: instancias de Date, strings ISO (yyyy-MM-dd) e ISO 8601 completo.
   * Agrega 'T00:00:00' a fechas sin hora para evitar desfases por zona horaria
   * al construir el Date mediante el constructor nativo.
   * ───────────────────────────────────────────────── */
  /**
   * Convierte un valor de fecha (string ISO o Date) en un objeto Date válido.
   *
   * @param {string|Date} val - Valor a convertir.
   * @returns {Date|null} Objeto Date normalizado, o null si el valor es inválido.
   */
  const parseValue = (val) => {
    if (!val) return null;

    // Caso 1: ya es una instancia de Date válida → se retorna directamente.
    if (val instanceof Date && !isNaN(val)) {
      return val;
    }

    // Caso 2: string ISO → se concatena la hora medianoche para evitar
    // que el constructor de Date interprete la fecha en UTC y produzca
    // un desfase de un día en zonas horarias occidentales.
    if (typeof val === 'string') {
      const dateStr = val.includes('T') ? val : `${val}T00:00:00`;
      const parsed = new Date(dateStr);

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    console.warn('⚠️ DateTimePicker - Valor de fecha inválido recibido:', val);
    return null;
  };

  /* ─────────────────────────────────────────────────
   * Estado derivado del valor recibido por prop
   * ───────────────────────────────────────────────── */

  /** Fecha actualmente seleccionada (o null si no hay selección). */
  const [selectedDate, setSelectedDate] = useState(() => parseValue(value));

  /** Hora seleccionada en el modo datetime (0–23). */
  const [hours, setHours] = useState(selectedDate?.getHours() || 0);

  /** Minuto seleccionado en el modo datetime (0–59). */
  const [minutes, setMinutes] = useState(selectedDate?.getMinutes() || 0);

  /** Año actualmente navegado en el calendario. */
  const [selectedYear, setSelectedYear] = useState(
    selectedDate?.getFullYear() || currentDate.getFullYear()
  );

  /** Mes actualmente navegado en el calendario (0-indexed). */
  const [selectedMonth, setSelectedMonth] = useState(
    selectedDate?.getMonth() || currentDate.getMonth()
  );

  /** Referencia al contenedor raíz para detectar clics externos. */
  const containerRef = useRef(null);

  /* ─────────────────────────────────────────────────
   * Sincronización con prop `value` (controlled component)
   *
   * Cuando el componente padre actualiza el valor externamente (p. ej., al
   * cargar datos de edición), este efecto sincroniza todos los estados internos
   * para que el calendario refleje la nueva selección.
   * ───────────────────────────────────────────────── */
  useEffect(() => {
    const parsedDate = parseValue(value);

    if (parsedDate) {
      setSelectedDate(parsedDate);
      setHours(parsedDate.getHours());
      setMinutes(parsedDate.getMinutes());
      setSelectedYear(parsedDate.getFullYear());
      setSelectedMonth(parsedDate.getMonth());
      setCurrentDate(parsedDate);
    }
  }, [value]);

  /* ─────────────────────────────────────────────────
   * Cierre al hacer clic fuera del componente
   *
   * Patrón estándar de "click outside": se registra un listener global en el
   * evento 'mousedown' y se retira en el cleanup del efecto para evitar memory
   * leaks y comportamientos inesperados al desmontar el componente.
   * ───────────────────────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ─────────────────────────────────────────────────
   * Utilidades de formato y cálculo del calendario
   * ───────────────────────────────────────────────── */

  /**
   * Formatea un objeto Date según el prop `format` del componente.
   *
   * @param {Date} date - Fecha a formatear.
   * @returns {string} Fecha formateada como string legible (dd/mm/yyyy [hh:mm]).
   */
  const formatDate = (date) => {
    if (!date) return '';
    const day    = String(date.getDate()).padStart(2, '0');
    const month  = String(date.getMonth() + 1).padStart(2, '0');
    const year   = date.getFullYear();
    const hour   = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    if (format === 'dd/mm/yyyy')       return `${day}/${month}/${year}`;
    if (format === 'dd/mm/yyyy hh:mm') return `${day}/${month}/${year} ${hour}:${minute}`;
    return `${day}/${month}/${year}`;
  };

  /**
   * Obtiene la cantidad de días del mes correspondiente a la fecha indicada.
   * Utiliza el truco de solicitar el día 0 del mes siguiente, que equivale
   * al último día del mes actual.
   *
   * @param {Date} date - Cualquier fecha dentro del mes de interés.
   * @returns {number} Número de días del mes (28–31).
   */
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  /**
   * Obtiene el día de la semana (0 = domingo) en que inicia el mes de la fecha
   * indicada. Se utiliza para generar los desplazamientos vacíos al inicio de la
   * cuadrícula del calendario.
   *
   * @param {Date} date - Cualquier fecha dentro del mes de interés.
   * @returns {number} Índice del día de inicio (0 domingo – 6 sábado).
   */
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  /* ─────────────────────────────────────────────────
   * Normalización de minDate
   *
   * Se convierte el prop `minDate` a un objeto Date sin componente horario
   * (medianoche) para garantizar comparaciones correctas al nivel de día,
   * independientemente de la hora en que fue registrada la fecha mínima.
   * Se usa una IIFE para encapsular el proceso y obtener un valor inmutable.
   * ───────────────────────────────────────────────── */
  const parsedMinDate = (() => {
    if (!minDate) return null;
    const str = typeof minDate === 'string'
      ? (minDate.includes('T') ? minDate : `${minDate}T00:00:00`)
      : null;
    const d = str ? new Date(str) : (minDate instanceof Date ? minDate : null);
    if (!d || isNaN(d.getTime())) return null;
    // Normalizar a medianoche local para comparar solo por fecha
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  /* ─────────────────────────────────────────────────
   * Lógica de restricción de días
   * ───────────────────────────────────────────────── */

  /**
   * Determina si un día del mes actualmente visualizado debe estar deshabilitado.
   * Un día se deshabilita si:
   *   1. Es anterior a `minDate` (cuando este prop está definido).
   *   2. Es posterior a la fecha actual y `allowFuture` es false.
   *
   * @param {number} day - Número del día (1–31) dentro del mes visible.
   * @returns {boolean} true si el día debe bloquearse; false si es seleccionable.
   */
  const isDayDisabled = (day) => {
    const candidate = new Date(selectedYear, selectedMonth, day);

    // Restricción de fecha mínima (encadenamiento de campos de fecha)
    if (parsedMinDate && candidate < parsedMinDate) return true;

    // Restricción de fechas futuras (campos de registro histórico)
    if (!allowFuture) {
      const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (candidate > todayNorm) return true;
    }

    return false;
  };

  /* ─────────────────────────────────────────────────
   * Manejadores de interacción del calendario
   * ───────────────────────────────────────────────── */

  /**
   * Maneja la selección de un día en la vista de calendario.
   *
   * En modo solo-fecha (format='dd/mm/yyyy'), emite el resultado inmediatamente
   * en formato ISO (yyyy-MM-dd) y cierra el panel, lo que garantiza compatibilidad
   * directa con los campos de tipo DATE de la API REST.
   *
   * En modo datetime, transiciona a la vista de selección de hora para completar
   * la selección antes de emitir el resultado.
   *
   * @param {number} day - Día seleccionado (1–31).
   */
  const handleSelectDay = (day) => {
    // Validación de restricciones antes de procesar la selección
    if (isDayDisabled(day)) return;

    const newDate = new Date(selectedYear, selectedMonth, day);
    setSelectedDate(newDate);

    if (format === 'dd/mm/yyyy') {
      // Emitir en formato ISO para compatibilidad con el backend (campo DATE de SQL)
      const formatted = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      onChange(formatted);
      setIsOpen(false);
    } else {
      // En modo datetime, continuar a la selección de hora
      setView('time');
    }
  };

  /**
   * Confirma la selección completa de fecha y hora en modo datetime.
   * Combina la fecha previamente elegida con los valores de hora y minuto
   * del estado local, y emite un objeto Date completo al componente padre.
   */
  const handleConfirmTime = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate);
      setIsOpen(false);
    }
  };

  /**
   * Aplica la selección de mes y año realizada en la vista "month-year" y
   * regresa a la vista de calendario con el nuevo contexto temporal.
   */
  const handleSelectMonthYear = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setView('calendar');
  };

  /* ─────────────────────────────────────────────────
   * Precálculo de la cuadrícula del calendario
   *
   * Se genera el arreglo `days` que alimenta la cuadrícula de 7 columnas:
   *   - Las primeras `firstDay` posiciones son null (celdas vacías de relleno).
   *   - Las siguientes `daysInMonth` posiciones contienen el número del día.
   * ───────────────────────────────────────────────── */
  const days = [];
  const tempDate    = new Date(selectedYear, selectedMonth);
  const daysInMonth = getDaysInMonth(tempDate);
  const firstDay    = getFirstDayOfMonth(tempDate);

  // Relleno inicial para alinear el primer día con su columna de día de semana
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  /** Nombre del mes y año visibles en el encabezado del calendario. */
  const monthName = tempDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  /** Nombres de los meses en español para el selector de mes. */
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  /**
   * Rango de años disponibles en el selector.
   * Comienza en 1950 (cubre fechas de nacimiento y registros históricos)
   * y termina en `maxYear`, calculado según el prop `allowFuture`.
   */
  const yearRange = [];
  for (let year = 1950; year <= maxYear; year++) {
    yearRange.push(year);
  }

  /* ─────────────────────────────────────────────────
   * Render
   * ───────────────────────────────────────────────── */
  return (
    <div className="relative w-full" ref={containerRef}>

      {/* ── Campo de texto de solo lectura que actúa como disparador del panel ── */}
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

      {/* ── Ícono indicador del tipo de campo (reloj para datetime, calendario para date) ── */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {format === 'dd/mm/yyyy hh:mm'
          ? <Clock size={20} className="sm:w-4 sm:h-4" />
          : <CalendarIcon size={20} className="sm:w-4 sm:h-4" />
        }
      </div>

      {/* ── Panel desplegable del calendario ── */}
      {isOpen && (
        <div className="absolute top-full mt-3 sm:mt-2 bg-white rounded-2xl sm:rounded-lg shadow-2xl z-50 border border-gray-200 overflow-hidden w-full sm:w-96">

          {/* ════════════════════════════════════════
              VISTA: Selector de Año y Mes
              Permite navegar directamente a cualquier
              año (1950–maxYear) y mes del año.
          ════════════════════════════════════════ */}
          {view === 'month-year' && (
            <div className="p-4 sm:p-4">
              <h3 className="text-lg sm:text-base font-bold text-gray-900 mb-4">
                Selecciona Año
              </h3>

              {/* Grilla de años con scroll vertical */}
              <div className="grid grid-cols-4 gap-2 mb-4 max-h-60 overflow-y-auto">
                {yearRange.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setSelectedYear(year); }}
                    className={`
                      p-2 rounded-lg font-bold text-sm transition-all duration-200
                      ${selectedYear === year
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

              {/* Grilla de meses abreviados (3 caracteres) */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setSelectedMonth(index); }}
                    className={`
                      p-2 rounded-lg font-bold text-sm transition-all duration-200
                      ${selectedMonth === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blue-100 active:bg-blue-200'
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>

              {/* Confirmar selección y regresar a la vista de calendario */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSelectMonthYear(); }}
                className="w-full py-3 text-base sm:text-sm font-bold bg-blue-600 text-white rounded-xl sm:rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                ✓ Confirmar
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              VISTA: Calendario mensual (cuadrícula de días)
              Encabezado clickeable → navega a month-year.
              Días deshabilitados renderizados en gris.
          ════════════════════════════════════════ */}
          {view === 'calendar' && (
            <div className="p-4 sm:p-4">

              {/* Encabezado: nombre del mes y año → navega a selector de mes/año */}
              <div className="flex items-center justify-between mb-4 sm:mb-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setView('month-year'); }}
                  className="flex-1 text-lg sm:text-base font-bold text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors capitalize text-center"
                >
                  {monthName}
                </button>
              </div>

              {/* Cabecera de días de la semana (domingo a sábado) */}
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

              {/* Cuadrícula de días del mes */}
              <div className="grid grid-cols-7 gap-2 sm:gap-1 mb-4 sm:mb-3">
                {days.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => { e.preventDefault(); if (day) handleSelectDay(day); }}
                    disabled={!day || (day && isDayDisabled(day))}
                    className={`
                      h-10 sm:h-7 rounded-lg sm:rounded text-sm sm:text-xs font-semibold transition-all duration-200
                      ${
                        !day
                          ? 'invisible'                             // Celda de relleno → invisible
                          : day && isDayDisabled(day)
                          ? 'text-gray-300 cursor-not-allowed'      // Día deshabilitado → gris
                          : selectedDate?.getDate() === day &&
                            selectedDate?.getMonth() === selectedMonth &&
                            selectedDate?.getFullYear() === selectedYear
                          ? 'bg-blue-600 text-white shadow-lg'      // Día seleccionado → resaltado
                          : 'text-gray-700 hover:bg-blue-100 active:bg-blue-200' // Día disponible
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Acceso rápido al día actual */}
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

          {/* ════════════════════════════════════════
              VISTA: Selector de Hora y Minuto
              Solo se activa cuando el format es 'dd/mm/yyyy hh:mm'.
              Los minutos se ajustan en pasos de 5 para facilitar la selección.
          ════════════════════════════════════════ */}
          {view === 'time' && (
            <div className="p-4 sm:p-4">
              <h3 className="text-lg sm:text-base font-bold text-gray-900 mb-4">
                ⏰ Selecciona la hora
              </h3>

              <div className="flex gap-4 sm:gap-2 items-center justify-center mb-4">

                {/* ── Selector de horas (0–23) ── */}
                <div className="flex flex-col items-center">
                  <label className="text-sm sm:text-xs font-bold text-gray-700 mb-2">Hora</label>
                  <div className="flex items-center gap-3 sm:gap-2 bg-gray-100 rounded-xl sm:rounded p-2">
                    <button type="button" onClick={() => setHours(Math.max(0, hours - 1))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors">
                      <ChevronLeft size={20} className="sm:w-4 sm:h-4 text-gray-700" />
                    </button>
                    <input
                      type="number" min="0" max="23"
                      value={String(hours).padStart(2, '0')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val < 0)  val = 0;
                        if (val > 23) val = 23;
                        setHours(val);
                      }}
                      className="w-16 sm:w-12 text-center text-3xl sm:text-2xl font-bold bg-transparent focus:outline-none"
                    />
                    <button type="button" onClick={() => setHours(Math.min(23, hours + 1))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors">
                      <ChevronRight size={20} className="sm:w-4 sm:h-4 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Separador visual ":" */}
                <div className="text-4xl sm:text-3xl font-bold text-gray-400 h-20 sm:h-16 flex items-center">:</div>

                {/* ── Selector de minutos (0–59, paso de 5) ── */}
                <div className="flex flex-col items-center">
                  <label className="text-sm sm:text-xs font-bold text-gray-700 mb-2">Minuto</label>
                  <div className="flex items-center gap-3 sm:gap-2 bg-gray-100 rounded-xl sm:rounded p-2">
                    <button type="button" onClick={() => setMinutes(Math.max(0, minutes - 5))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors">
                      <ChevronLeft size={20} className="sm:w-4 sm:h-4 text-gray-700" />
                    </button>
                    <input
                      type="number" min="0" max="59"
                      value={String(minutes).padStart(2, '0')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val < 0)  val = 0;
                        if (val > 59) val = 59;
                        setMinutes(val);
                      }}
                      className="w-16 sm:w-12 text-center text-3xl sm:text-2xl font-bold bg-transparent focus:outline-none"
                    />
                    <button type="button" onClick={() => setMinutes(Math.min(59, minutes + 5))}
                      className="p-2 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors">
                      <ChevronRight size={20} className="sm:w-4 sm:h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Acciones: regresar al calendario o confirmar la selección completa */}
              <div className="flex gap-3 sm:gap-2">
                <button type="button"
                  onClick={(e) => { e.preventDefault(); setView('calendar'); }}
                  className="flex-1 py-3 sm:py-2 text-base sm:text-sm font-bold text-gray-700 rounded-xl sm:rounded hover:bg-gray-100 active:bg-gray-200 transition-colors">
                  Atrás
                </button>
                <button type="button"
                  onClick={(e) => { e.preventDefault(); handleConfirmTime(); }}
                  className="flex-1 py-3 sm:py-2 text-base sm:text-sm font-bold bg-blue-600 text-white rounded-xl sm:rounded hover:bg-blue-700 active:bg-blue-800 transition-colors">
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
