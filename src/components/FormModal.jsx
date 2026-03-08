/**
 * @file FormModal.jsx
 * @description Modal de formulario genérico y reutilizable.
 *
 * Implementa el patrón de formulario dinámico dirigido por configuración
 * (configuration-driven form). El consumidor define los campos mediante un
 * arreglo de objetos (o una función que lo produce), y el componente se encarga
 * de renderizar el control adecuado, gestionar el estado, manejar archivos y
 * emitir los datos al padre al confirmar.
 *
 * Tipos de campo soportados (prop `type` de cada campo):
 *   - text, number, email, etc.  → input nativo (caso default del switch).
 *   - date / datetime            → componente DateTimePicker.
 *   - select                     → select nativo con opciones estáticas o dinámicas.
 *   - radio                      → grupo de radio buttons.
 *   - checkbox                   → grupo de checkboxes con valor como array.
 *   - toggle                     → interruptor booleano.
 *   - textarea                   → área de texto multilínea.
 *   - password                   → input con visibilidad alternante.
 *   - color                      → selector de color nativo (o custom renderer).
 *   - range                      → slider numérico.
 *   - file                       → selector de archivo con vista previa.
 *   - custom                     → renderizado completamente personalizado.
 *
 * @module components/FormModal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Eye, EyeOff, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import DateTimePicker from './DateTimePicker';

/**
 * Modal de formulario genérico y reutilizable.
 *
 * @component
 * @param {object}          props
 * @param {boolean}         props.isOpen          - Controla la visibilidad del modal.
 * @param {function}        props.onClose         - Callback al cancelar o cerrar el modal.
 * @param {function}        props.onSubmit        - Callback al confirmar. Recibe un objeto
 *                                                  con los valores del formulario.
 * @param {string}          props.title           - Título principal del modal.
 * @param {string}          [props.subtitle]      - Subtítulo descriptivo (opcional).
 * @param {Array|function}  [props.fields=[]]     - Definición de campos. Puede ser:
 *                                                  - Array de objetos FieldDef.
 *                                                  - Función (updateFormData) => FieldDef[],
 *                                                    útil para campos que dependen del estado.
 * @param {object}          [props.initialData]   - Datos iniciales para modo edición.
 *                                                  Las claves corresponden a los `name` de los campos.
 * @param {string}          [props.size='mega']   - Tamaño del modal. Valores: sm, md, lg, xl,
 *                                                  2xl…7xl, full, fullscreen, mega.
 * @param {string}          [props.submitText]    - Texto del botón de confirmación.
 * @param {boolean}         [props.submitDisabled]- Deshabilita el botón de submit externamente.
 * @returns {JSX.Element|null} Modal renderizado, o null si `isOpen` es false.
 */
export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  fields = [],
  initialData = null,
  size = 'mega',
  submitText,
  submitDisabled
}) {

  /* ─────────────────────────────────────────────────
   * Estado del formulario
   * ───────────────────────────────────────────────── */

  /** Mapa { [fieldName]: value } con los valores actuales de todos los campos. */
  const [formData, setFormData] = useState({});

  /** Controla la visibilidad de los campos de tipo password. */
  const [showPasswords, setShowPasswords] = useState({});

  /** Mapa de errores de validación por nombre de campo. */
  const [errors, setErrors] = useState({});

  /**
   * Registra qué campos han sido "tocados" (blur) por el usuario.
   * Los errores solo se muestran en campos tocados para no saturar al usuario
   * con mensajes antes de que interactúe con el formulario.
   */
  const [touchedFields, setTouchedFields] = useState({});

  /** Nombre del campo actualmente enfocado, para estilos de focus. */
  const [focusedField, setFocusedField] = useState(null);

  /**
   * Referencia a los inputs de tipo file, indexados por nombre de campo.
   * Permite acceder al DOM del input desde fuera del flujo normal de React.
   */
  const fileInputsRef = useRef({});

  /** Indica si el formulario está procesando el envío (evita doble submit). */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Almacena los objetos File seleccionados por el usuario, separados de
   * formData para evitar re-renders en cadena al combinar archivos con el
   * estado del resto del formulario. Los archivos se inyectan solo al momento
   * del envío.
   */
  const [fileObjects, setFileObjects] = useState({});

  /* ─────────────────────────────────────────────────
   * Función auxiliar de actualización parcial del estado
   * Expuesta como parámetro a la función `fields` cuando ésta es una función,
   * permitiendo que campos custom actualicen el estado del formulario.
   * ───────────────────────────────────────────────── */
  /**
   * Actualiza parcialmente el estado del formulario con los pares clave-valor
   * proporcionados, sin afectar los demás campos.
   *
   * @param {object} newData - Objeto parcial { [fieldName]: value } a fusionar.
   */
  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  /* ─────────────────────────────────────────────────
   * Inicialización y reset del formulario
   *
   * Se ejecuta exclusivamente cuando cambia `isOpen` para:
   *   - Cargar initialData al abrir en modo edición.
   *   - Inicializar campos vacíos al abrir en modo creación.
   *   - Limpiar errores, estado de foco y visibilidad de contraseñas.
   *
   * Los objetos File se limpian al CERRAR (no al abrir) para preservar
   * previsualizaciones mientras el modal está abierto.
   * ───────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        // Modo edición: normalizar todos los valores a string para compatibilidad
        // con los inputs nativos (value siempre espera string, nunca number/null).
        const normalizedData = {};
        Object.entries(initialData).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            normalizedData[key] = '';
          } else if (typeof value === 'number') {
            normalizedData[key] = String(value);
          } else {
            normalizedData[key] = value;
          }
        });
        setFormData(normalizedData);
      } else {
        // Modo creación: inicializar cada campo con su valor vacío correspondiente
        // según el tipo (array para checkbox, false para toggle, string vacío para el resto).
        const currentFields = typeof fields === 'function'
          ? fields(() => {})
          : Array.isArray(fields)
          ? fields
          : [];

        const emptyData = {};
        currentFields.forEach(field => {
          if (field.type === 'checkbox') {
            emptyData[field.name] = [];
          } else if (field.type === 'toggle') {
            emptyData[field.name] = false;
          } else {
            emptyData[field.name] = '';
          }
        });
        setFormData(emptyData);
      }

      // Resetear estados de UX al abrir el modal
      setShowPasswords({});
      setErrors({});
      setTouchedFields({});
      setFocusedField(null);
    } else {
      // Al cerrar el modal, liberar referencias a archivos para liberar memoria
      setFileObjects({});
    }
  }, [isOpen]); // Dependencia exclusiva en isOpen para no re-ejecutar al cambiar fields

  /* ─────────────────────────────────────────────────
   * Resolución del arreglo de campos
   *
   * `fields` puede ser un array estático o una función que recibe
   * `updateFormData` y retorna el array. Este patrón permite que los campos
   * custom (type='custom') controlen el estado del formulario directamente.
   * ───────────────────────────────────────────────── */
  const fieldsArray = typeof fields === 'function'
    ? fields(updateFormData)
    : Array.isArray(fields)
    ? fields
    : [];

  /* ─────────────────────────────────────────────────
   * Manejadores de eventos del formulario
   * ───────────────────────────────────────────────── */

  /**
   * Maneja el envío del formulario.
   * Combina los valores de texto con los objetos File antes de invocar
   * el callback `onSubmit`, y gestiona el estado `isSubmitting` para
   * deshabilitar el botón y mostrar el indicador de carga.
   *
   * @param {React.FormEvent} e - Evento nativo de submit del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Combinar valores de texto/select/date con archivos File
      const datosConvertidos = { ...formData };
      Object.keys(fileObjects).forEach(fieldName => {
        datosConvertidos[fieldName] = fileObjects[fieldName];
      });

      await onSubmit(datosConvertidos);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Maneja el cierre del modal, reseteando completamente el estado del
   * componente antes de invocar el callback `onClose` del padre.
   */
  const handleClose = () => {
    setFormData({});
    setShowPasswords({});
    setErrors({});
    setTouchedFields({});
    setFocusedField(null);
    setFileObjects({});
    onClose();
  };

  /**
   * Actualiza el valor de un campo en el estado del formulario y elimina
   * su error de validación si lo tuviera, proporcionando retroalimentación
   * inmediata al usuario mientras corrige.
   *
   * Memoizado con useCallback para evitar recreaciones innecesarias que
   * provocarían re-renders en los campos hijos.
   *
   * @param {string} fieldName - Nombre (key) del campo a actualizar.
   * @param {*}      value     - Nuevo valor del campo.
   */
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
  }, []);

  /**
   * Maneja la selección de archivos en campos de tipo 'file'.
   *
   * Los archivos se almacenan en `fileObjects` de forma separada a `formData`
   * para evitar re-renders en cascada: React re-renderiza todos los campos del
   * formulario cuando cambia `formData`, lo que puede interrumpir la selección
   * del archivo. Al aislarlos en un estado independiente se elimina este efecto.
   *
   * Memoizado con useCallback sin dependencias para garantizar referencia estable.
   *
   * @param {string}   fieldName - Nombre del campo de archivo.
   * @param {File}     file      - Objeto File seleccionado por el usuario.
   * @param {object}   field     - Definición completa del campo (para ejecutar
   *                               callbacks personalizados como previsualizaciones).
   */
  const handleFileChange = useCallback((fieldName, file, field) => {
    if (file instanceof File) {
      // Registrar el archivo en el store independiente de fileObjects
      setFileObjects(prev => ({ ...prev, [fieldName]: file }));

      // Ejecutar callback personalizado si está definido (p. ej., preview de imagen)
      if (field.onChange && typeof field.onChange === 'function') {
        field.onChange(file);
      }
    }
  }, []);

  /**
   * Registra el campo como "tocado" al perder el foco, habilitando la
   * visualización de errores de validación para ese campo específico.
   * Ejecuta además el callback `onBlur` personalizado del campo si existe.
   *
   * @param {string}    fieldName    - Nombre del campo que perdió el foco.
   * @param {function}  [customOnBlur] - Callback personalizado del campo.
   */
  const handleFieldBlur = useCallback((fieldName, customOnBlur) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    setFocusedField(null);

    if (customOnBlur && typeof customOnBlur === 'function') {
      customOnBlur(formData[fieldName]);
    }
  }, [formData]);

  /**
   * Alterna la visibilidad del texto en campos de tipo password.
   *
   * @param {string} fieldName - Nombre del campo password.
   */
  const togglePasswordVisibility = useCallback((fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  }, []);

  // Renderizado condicional: no montar el DOM si el modal está cerrado
  if (!isOpen) return null;

  /* ─────────────────────────────────────────────────
   * Mapa de clases CSS para el tamaño del modal
   * Permite adaptar el ancho del contenedor a los distintos contextos de uso:
   * formularios simples (sm/md) vs. formularios complejos con múltiples columnas
   * (mega/full/fullscreen).
   * ───────────────────────────────────────────────── */
  const sizeClasses = {
    sm:         'sm:max-w-sm',
    md:         'sm:max-w-md',
    lg:         'sm:max-w-lg',
    xl:         'sm:max-w-xl',
    '2xl':      'sm:max-w-2xl md:max-w-2xl',
    '3xl':      'sm:max-w-3xl md:max-w-3xl',
    '4xl':      'sm:max-w-4xl md:max-w-4xl',
    '5xl':      'sm:max-w-5xl md:max-w-5xl lg:max-w-5xl',
    '6xl':      'sm:max-w-6xl md:max-w-6xl lg:max-w-6xl',
    '7xl':      'sm:max-w-7xl md:max-w-7xl lg:max-w-7xl',
    full:       'w-[95vw] sm:w-[98vw]',
    fullscreen: 'w-[95vw] sm:w-[98vw]',
    mega:       'w-[95vw] sm:w-[98vw]',
  };

  /* ─────────────────────────────────────────────────
   * Resolución de opciones de un campo
   * ───────────────────────────────────────────────── */

  /**
   * Resuelve las opciones de un campo select/radio/checkbox.
   * Soporta dos modalidades:
   *   - Opciones dinámicas: `getDynamicOptions(formData)` → permite que las
   *     opciones dependan del valor de otros campos (p. ej., filtrar categorías
   *     según el tipo de campeonato seleccionado).
   *   - Opciones estáticas: array `options` definido en la configuración del campo.
   *
   * @param {string} fieldName - Nombre del campo.
   * @returns {Array<{value: *, label: string}>} Arreglo de opciones.
   */
  const getFieldOptions = (fieldName) => {
    const field = fieldsArray.find(f => f.name === fieldName);
    if (!field) return [];

    if (field.getDynamicOptions && typeof field.getDynamicOptions === 'function') {
      try {
        const dynamicOpts = field.getDynamicOptions(formData);
        return Array.isArray(dynamicOpts) ? dynamicOpts : [];
      } catch {
        // Fallback a opciones estáticas si la función dinámica falla
        return Array.isArray(field.options) ? field.options : [];
      }
    }

    return Array.isArray(field.options) ? field.options : [];
  };

  /* ─────────────────────────────────────────────────
   * Renderizado de campos (switch por tipo)
   *
   * Función central del componente: dado un objeto de definición de campo,
   * retorna el JSX correspondiente al tipo de control.
   * ───────────────────────────────────────────────── */

  /**
   * Renderiza el control de formulario correspondiente al tipo del campo.
   *
   * @param {object}   field               - Definición del campo.
   * @param {string}   field.name          - Identificador único del campo (key en formData).
   * @param {string}   field.label         - Etiqueta visible del campo.
   * @param {string}   field.type          - Tipo de control (ver tipos soportados en @file).
   * @param {boolean}  [field.required]    - Si el campo es obligatorio.
   * @param {string}   [field.placeholder] - Placeholder del input.
   * @param {Array}    [field.options]     - Opciones para select/radio/checkbox.
   * @param {function} [field.getDynamicOptions] - Función que retorna opciones según formData.
   * @param {boolean}  [field.allowFuture] - Solo para date/datetime: permite fechas futuras.
   * @param {function} [field.getMinDate]  - Solo para date/datetime: retorna la fecha mínima
   *                                         a partir del estado actual del formulario.
   * @param {string}   [field.helpText]    - Texto de ayuda mostrado bajo el campo.
   * @param {function} [field.renderCustom] - Función de renderizado personalizado (type custom).
   * @param {Array}    [field.resetChildren] - Campos a resetear cuando cambia este select.
   * @returns {JSX.Element} Control de formulario renderizado.
   */
  const renderField = (field) => {
    const fieldValue = formData[field.name] ?? '';
    const hasError   = errors[field.name] && touchedFields[field.name];
    const isFocused  = focusedField === field.name;
    const hasValue   = fieldValue && (typeof fieldValue === 'string' ? String(fieldValue).length > 0 : true);
    const options    = getFieldOptions(field.name);

    switch (field.type) {

      /* ──────────────────────────────────────────
         Tipo: date / datetime
         Delega en DateTimePicker, que gestiona la
         interfaz de calendario internamente.
         - allowFuture: habilita fechas posteriores a hoy.
         - getMinDate: función evaluada con el formData actual
           para restricciones dinámicas entre campos de fecha.
      ────────────────────────────────────────── */
      case 'datetime':
      case 'date':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <DateTimePicker
              value={fieldValue}
              onChange={(date) => handleFieldChange(field.name, date)}
              format={field.type === 'datetime' ? 'dd/mm/yyyy hh:mm' : 'dd/mm/yyyy'}
              allowFuture={field.allowFuture || false}
              minDate={field.getMinDate ? field.getMinDate(formData) : undefined}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: radio
         Selección de un único valor entre varias
         opciones presentadas como botones de radio.
      ────────────────────────────────────────── */
      case 'radio':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-base sm:text-sm font-bold transition-all duration-300 mb-4 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="space-y-3 sm:space-y-2 pb-3 sm:pb-2 border-b-2 border-gray-300">
              {field.options && Array.isArray(field.options) && field.options.map((option) => (
                <label key={option.value} className="flex items-center gap-3 sm:gap-2 cursor-pointer p-2 sm:p-1 rounded transition-colors hover:bg-blue-50 sm:hover:bg-transparent">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={fieldValue === option.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                    className="w-6 sm:w-4 h-6 sm:h-4 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-base sm:text-sm text-gray-800 sm:text-gray-700 font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: checkbox
         Selección múltiple: el valor es un array
         de strings con los valores seleccionados.
         Se añade/quita del array al cambiar cada ítem.
      ────────────────────────────────────────── */
      case 'checkbox': {
        const checkboxValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-base sm:text-sm font-bold transition-all duration-300 mb-4 sm:mb-2
              ${checkboxValue.length > 0 ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="space-y-3 sm:space-y-2 pb-3 sm:pb-2 border-b-2 border-gray-300">
              {field.options && Array.isArray(field.options) && field.options.map((option) => (
                <label key={option.value} className="flex items-center gap-3 sm:gap-2 cursor-pointer p-2 sm:p-1 rounded transition-colors hover:bg-blue-50 sm:hover:bg-transparent">
                  <input
                    type="checkbox"
                    name={field.name}
                    value={option.value}
                    checked={checkboxValue.includes(option.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Operación inmutable: añadir o eliminar del array de selección
                      const newValue = e.target.checked
                        ? [...checkboxValue, val]
                        : checkboxValue.filter(v => v !== val);
                      handleFieldChange(field.name, newValue);
                    }}
                    onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                    className="w-6 sm:w-4 h-6 sm:h-4 accent-blue-600 cursor-pointer rounded"
                  />
                  <span className="text-base sm:text-sm text-gray-800 sm:text-gray-700 font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );
      }

      /* ──────────────────────────────────────────
         Tipo: toggle
         Interruptor booleano (on/off) con animación
         deslizante. El valor almacenado es boolean.
      ────────────────────────────────────────── */
      case 'toggle': {
        const isOn = fieldValue === true || fieldValue === 'true';
        return (
          <div className="relative pt-2 sm:pt-1 pb-3 sm:pb-2 border-b-2 border-gray-300">
            <label className="flex items-center justify-between cursor-pointer p-2 sm:p-1 rounded transition-colors hover:bg-blue-50 sm:hover:bg-transparent gap-4 sm:gap-0">
              <span className={`
                text-base sm:text-sm font-bold transition-all duration-300
                ${isOn ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
              `}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>

              {/* Botón tipo switch con píldora animada */}
              <button
                type="button"
                onClick={() => handleFieldChange(field.name, !isOn)}
                onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                className={`
                  relative w-14 sm:w-12 h-8 sm:h-6 rounded-full transition-all duration-300 flex-shrink-0
                  ${isOn ? 'bg-blue-600' : 'bg-gray-300 sm:bg-gray-300'}
                `}
              >
                <div className={`
                  absolute top-1 sm:top-0.5 w-6 sm:w-5 h-6 sm:h-5 bg-white rounded-full transition-all duration-300
                  ${isOn ? 'right-1 sm:right-0.5' : 'left-1 sm:left-0.5'}
                `} />
              </button>
            </label>

            {field.description && (
              <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2 ml-3 sm:ml-0">
                {field.description}
              </p>
            )}
          </div>
        );
      }

      /* ──────────────────────────────────────────
         Tipo: color
         Selector de color nativo del navegador,
         o renderizado completamente personalizado
         si se provee `renderCustom`.
      ────────────────────────────────────────── */
      case 'color':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.renderCustom && typeof field.renderCustom === 'function' ? (
              // Renderizado completamente delegado al consumidor
              field.renderCustom(formData, handleFieldChange)
            ) : (
              <div className="flex items-center gap-3 sm:gap-2 p-0 sm:p-0 pb-3 sm:pb-2 border-b-2 border-gray-300">
                <input
                  type="color"
                  name={field.name}
                  value={fieldValue || '#000000'}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                  className="w-12 sm:w-10 h-12 sm:h-10 rounded cursor-pointer border-2 sm:border border-gray-300"
                />
                <span className="text-base sm:text-sm text-gray-700 sm:text-gray-600 font-mono font-bold">
                  {fieldValue || '#000000'}
                </span>
              </div>
            )}

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: range
         Slider numérico con min, max y step
         configurables. Muestra el valor actual
         en el label en tiempo real.
      ────────────────────────────────────────── */
      case 'range':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}: <span className="text-blue-600">{fieldValue || field.min || 0}</span>
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <input
              type="range"
              name={field.name}
              value={fieldValue || field.min || 0}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name, field.onBlur)}
              className="w-full h-3 sm:h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 pb-3 sm:pb-2 border-b-2 border-gray-300"
            />

            {field.description && (
              <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2">{field.description}</p>
            )}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: file
         Selector de archivos con input oculto y
         label estilizado como zona de clic.
         El archivo se almacena en `fileObjects`
         (separado de formData) para evitar
         re-renders que interrumpan la selección.
      ────────────────────────────────────────── */
      case 'file':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${fileObjects[field.name] ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Input file oculto: la interacción se gestiona a través del label */}
            <input
              ref={(el) => { if (el) fileInputsRef.current[field.name] = el; }}
              type="file"
              name={field.name}
              accept={field.accept}
              onChange={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const file = e.target.files?.[0];
                if (file) handleFileChange(field.name, file, field);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleFieldBlur(field.name, field.onBlur);
              }}
              required={field.required}
              className="hidden"
              id={field.name}
            />

            {/* Zona de clic estilizada que activa el input file */}
            <label
              htmlFor={field.name}
              className={`
                block cursor-pointer transition-all duration-300 text-base sm:text-sm font-bold
                px-3 sm:px-3 py-3 sm:py-2 text-center pb-3 sm:pb-2 border-b-2
                ${hasError
                  ? 'border-red-500 text-red-600 sm:text-red-500'
                  : 'border-gray-300 hover:border-blue-400 text-gray-700 sm:text-gray-600'}
              `}
            >
              <span className="text-2xl sm:text-lg">📤</span>
              <p className="mt-1 sm:mt-0">
                {fileObjects[field.name]?.name || 'Selecciona archivo'}
              </p>
            </label>

            {field.helperText && !hasError && (
              <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2 ml-1 sm:ml-0 font-medium">
                {field.helperText}
              </p>
            )}

            {/* Slot para renderizado personalizado (p. ej., previsualización de imagen) */}
            {field.renderCustom && typeof field.renderCustom === 'function' && (
              <div className="mt-4">{field.renderCustom()}</div>
            )}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: custom
         Renderizado completamente delegado al
         consumidor mediante `renderCustom`.
         Útil para controles complejos que requieren
         lógica propia (p. ej., mapa interactivo,
         selector de imagen con crop, etc.).
      ────────────────────────────────────────── */
      case 'custom':
        return (
          <div className="relative pt-2 sm:pt-1">
            {field.renderCustom
              ? field.renderCustom(formData, handleFieldChange)
              : <div className="text-red-500 font-bold">Error: renderCustom no definido para campo custom</div>
            }

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: textarea
         Área de texto multilínea con alto
         configurable mediante `field.rows`.
      ────────────────────────────────────────── */
      case 'textarea':
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <textarea
              name={field.name}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => handleFieldBlur(field.name, field.onBlur)}
              placeholder={field.placeholder || " "}
              required={field.required}
              rows={field.rows || 4}
              className={`
                w-full px-3 py-4 sm:py-3 bg-transparent text-base sm:text-base text-gray-900
                border-b-2 transition-all duration-300
                focus:outline-none resize-none font-medium placeholder-gray-400
                ${hasError
                  ? 'border-red-500 focus:border-red-500'
                  : isFocused
                  ? 'border-blue-500'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );

      /* ──────────────────────────────────────────
         Tipo: select
         Lista desplegable con opciones estáticas
         o dinámicas (getDynamicOptions).
         Soporta reseteo en cascada de campos hijos
         mediante `resetChildren`.
      ────────────────────────────────────────── */
      case 'select': {
        // Coerción a string para compatibilidad con el atributo value del select nativo
        const selectValue = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';

        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${selectValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <select
              name={field.name}
              value={selectValue}
              onChange={(e) => {
                const value = e.target.value;
                handleFieldChange(field.name, value);

                // Reseteo en cascada: limpiar campos dependientes al cambiar este selector
                if (field.resetChildren && Array.isArray(field.resetChildren)) {
                  field.resetChildren.forEach(childField => handleFieldChange(childField, ''));
                }

                // Callback personalizado (p. ej., cargar opciones del siguiente campo)
                if (field.onChange && typeof field.onChange === 'function') {
                  field.onChange(value);
                }
              }}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => handleFieldBlur(field.name, field.onBlur)}
              required={field.required}
              className={`
                w-full px-0 py-3 sm:py-2 pr-6 sm:pr-4 bg-transparent text-base sm:text-sm text-gray-900
                border-b-2 transition-all duration-300 appearance-none font-medium focus:outline-none
                ${hasError
                  ? 'border-red-500 focus:border-red-500'
                  : isFocused
                  ? 'border-blue-500'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <option value="">{field.placeholder || 'Seleccionar'}</option>
              {Array.isArray(options) && options.length > 0 ? (
                options.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))
              ) : (
                <option disabled>Sin opciones disponibles</option>
              )}
            </select>

            {/* Ícono de chevron decorativo (pointer-events none para no interferir con el select) */}
            <ChevronDown className={`
              absolute right-0 top-1/2 translate-y-1/2 pointer-events-none transition-all duration-300
              w-5 sm:w-4 h-5 sm:h-4
              ${isFocused ? 'text-blue-500' : 'text-gray-400'}
            `} />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );
      }

      /* ──────────────────────────────────────────
         Tipo: password
         Input con toggle de visibilidad. Alterna
         entre type="password" y type="text" para
         mostrar u ocultar el contenido.
      ────────────────────────────────────────── */
      case 'password': {
        const isVisible = showPasswords[field.name] || false;
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
              <input
                type={isVisible ? 'text' : 'password'}
                name={field.name}
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                onFocus={() => setFocusedField(field.name)}
                onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                placeholder={field.placeholder || " "}
                required={field.required}
                className={`
                  w-full px-0 py-3 sm:py-2 pr-8 sm:pr-6 bg-transparent text-base sm:text-sm text-gray-900
                  border-b-2 transition-all duration-300 font-medium focus:outline-none placeholder-gray-400
                  ${hasError
                    ? 'border-red-500 focus:border-red-500'
                    : isFocused
                    ? 'border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              />

              {/* Botón de toggle de visibilidad posicionado absolutamente dentro del input */}
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.name)}
                className={`
                  absolute right-0 top-1/2 -translate-y-1/2 transition-colors duration-300 p-2 sm:p-1
                  ${isFocused ? 'text-blue-500 sm:text-blue-400' : 'text-gray-600 sm:text-gray-400 hover:text-gray-800 sm:hover:text-gray-600'}
                `}
              >
                {isVisible
                  ? <EyeOff size={22} className="sm:w-5 sm:h-5" />
                  : <Eye size={22} className="sm:w-5 sm:h-5" />
                }
              </button>
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );
      }

      /* ──────────────────────────────────────────
         Caso default: input nativo
         Cubre type="text", "number", "email", etc.
         El valor se coerce a string para evitar
         que React cambie entre controlled/uncontrolled
         cuando el valor es un objeto.
      ────────────────────────────────────────── */
      default:
        return (
          <div className="relative pt-2 sm:pt-1">
            <label className={`
              block text-lg sm:text-base font-bold transition-all duration-300 mb-3 sm:mb-2
              ${hasValue ? 'text-blue-600' : 'text-gray-700 sm:text-gray-600'}
            `}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <input
              type={field.type}
              name={field.name}
              value={typeof fieldValue === 'object' ? '' : fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => handleFieldBlur(field.name, field.onBlur)}
              placeholder={field.placeholder || " "}
              required={field.required}
              step={field.step}
              className={`
                w-full px-3 py-4 sm:py-3 bg-transparent text-base sm:text-base text-gray-900
                border-b-2 transition-all duration-300 font-medium focus:outline-none placeholder-gray-400
                ${hasError
                  ? 'border-red-500 focus:border-red-500'
                  : isFocused
                  ? 'border-blue-500'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}
            {field.helperText && !hasError && <div className="mt-2">{field.helperText}</div>}
          </div>
        );
    }
  };

  /* ─────────────────────────────────────────────────
   * Render principal del modal
   * ───────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">

      {/* Animación de entrada: deslizamiento vertical con efecto spring */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div className={`
        bg-white rounded-3xl sm:rounded-2xl shadow-2xl w-full ${sizeClasses[size]}
        max-h-[95vh] overflow-hidden flex flex-col
        animate-slide-up border border-gray-200
      `}>

        {/* ── Encabezado del modal ── */}
        <div className="relative px-5 sm:px-6 py-6 sm:py-4 border-b-2 sm:border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl sm:text-xl font-bold text-gray-900 pr-10">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 text-base sm:text-sm mt-2 sm:mt-1 font-medium">{subtitle}</p>
          )}

          <button
            onClick={handleClose}
            className="absolute top-5 sm:top-4 right-5 sm:right-4 p-2 hover:bg-gray-200 sm:hover:bg-gray-100 rounded-full transition-all duration-200 group active:bg-gray-300 sm:active:bg-gray-100"
          >
            <X size={28} className="sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900 sm:group-hover:text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* ── Cuerpo del modal: formulario con scroll independiente ── */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-8 sm:px-6 py-8 sm:py-4 space-y-6 sm:space-y-4">

            {/*
              Grilla responsiva de campos:
              - 1 columna en mobile
              - 2 columnas en tablet (md)
              - 3 columnas en desktop (lg)
              Cada campo puede especificar su span con la prop `cols` (1, 2, 3 o 12/fullWidth).
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-5">
              {fieldsArray.map((field) => {
                let colSpanClass = '';
                if (field.cols === 1)                     colSpanClass = 'md:col-span-1 lg:col-span-1';
                else if (field.cols === 2)                colSpanClass = 'md:col-span-2 lg:col-span-2';
                else if (field.cols === 3 || field.fullWidth) colSpanClass = 'md:col-span-2 lg:col-span-3';
                else if (field.cols === 12)               colSpanClass = 'md:col-span-2 lg:col-span-3';

                return (
                  <div key={field.name} className={colSpanClass}>
                    {renderField(field)}

                    {/* Texto de ayuda secundario (distinto de helperText, se muestra fuera del control) */}
                    {field.helpText && !errors[field.name] && (
                      <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2 ml-1 sm:ml-0 font-medium">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Pie del formulario: botones de acción ── */}
            <div className="flex gap-3 sm:gap-2 pt-6 sm:pt-4 border-t-2 sm:border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 sm:px-4 py-4 sm:py-2 text-base sm:text-sm font-bold text-gray-800 sm:text-gray-700 rounded-lg sm:rounded hover:bg-gray-100 sm:hover:bg-gray-50 active:bg-gray-200 sm:active:bg-gray-100 transition-all duration-200 disabled:opacity-50"
              >
                ✕ Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || submitDisabled}
                className="flex-1 px-6 sm:px-4 py-4 sm:py-2 text-base sm:text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg sm:rounded hover:shadow-xl sm:hover:shadow-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 sm:gap-2 group active-scale-95 sm:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={22} className="sm:w-5 sm:h-5 animate-spin" />
                    <span>Guardando</span>
                  </>
                ) : (
                  <>
                    <span>{submitText || '✓ Guardar'}</span>
                    <ArrowRight size={22} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
