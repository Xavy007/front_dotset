import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Eye, EyeOff, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import DateTimePicker from './DateTimePicker';

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
  const [formData, setFormData] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const fileInputsRef = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileObjects, setFileObjects] = useState({});

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // ====== PRIMER useEffect: Solo cuando se abre el modal ======
  useEffect(() => {
    console.log('🔄 useEffect [isOpen] - Modal abierto:', isOpen);
    
    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        console.log('📝 Cargando initialData:', initialData);
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
        console.log('📝 Inicializando formulario vacío');
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
      setShowPasswords({});
      setErrors({});
      setTouchedFields({});
      setFocusedField(null);
      // ✅ NO limpiar fileObjects aquí - solo cuando el modal se CIERRA
    } else {
      // ✅ Limpiar fileObjects solo cuando el modal se CIERRA
      setFileObjects({});
    }
  }, [isOpen]); // ← SOLO isOpen

  const fieldsArray = typeof fields === 'function' 
    ? fields(updateFormData) 
    : Array.isArray(fields) 
    ? fields 
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const datosConvertidos = { ...formData };
      
      // Agregar archivos al formData
      Object.keys(fileObjects).forEach(fieldName => {
        datosConvertidos[fieldName] = fileObjects[fieldName];
      });
      
      console.log('📦 FormModal - Datos a enviar:', datosConvertidos);
      console.log('📦 FormModal - Archivos incluidos:', fileObjects);
      
      await onSubmit(datosConvertidos);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setShowPasswords({});
    setErrors({});
    setTouchedFields({});
    setFocusedField(null);
    setFileObjects({});
    onClose();
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    console.log('✏️ handleFieldChange:', fieldName, '=', value);
    setFormData(prev => {
      const updated = { ...prev, [fieldName]: value };
      console.log('📝 FormData actualizado:', updated);
      return updated;
    });
    setErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // ====== MODIFICADO: handleFileChange SIN tocar formData ======
  const handleFileChange = useCallback((fieldName, file, field) => {
    console.log('📷 handleFileChange - Campo:', fieldName);
    console.log('📷 handleFileChange - Archivo:', file?.name);
    console.log('📷 handleFileChange - formData ANTES:', { ...formData });
    
    if (file instanceof File) {
      // SOLO guardar en fileObjects
      setFileObjects(prev => {
        const updated = { ...prev, [fieldName]: file };
        console.log('📦 fileObjects actualizado:', Object.keys(updated));
        return updated;
      });
      
      // Llamar onChange personalizado si existe (para preview)
      if (field.onChange && typeof field.onChange === 'function') {
        console.log('📷 Ejecutando onChange personalizado');
        field.onChange(file);
      }
      
      console.log('✅ Archivo guardado en fileObjects');
    }
  }, []); // ← Sin dependencias para evitar re-renders

  const handleFieldBlur = useCallback((fieldName, customOnBlur) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    setFocusedField(null);
    
    if (customOnBlur && typeof customOnBlur === 'function') {
      customOnBlur(formData[fieldName]);
    }
  }, [formData]);

  const togglePasswordVisibility = useCallback((fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  }, []);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl md:max-w-2xl',
    '3xl': 'sm:max-w-3xl md:max-w-3xl',
    '4xl': 'sm:max-w-4xl md:max-w-4xl',
    '5xl': 'sm:max-w-5xl md:max-w-5xl lg:max-w-5xl',
    '6xl': 'sm:max-w-6xl md:max-w-6xl lg:max-w-6xl',
    '7xl': 'sm:max-w-7xl md:max-w-7xl lg:max-w-7xl',
    full: 'w-[95vw] sm:w-[98vw]',
    fullscreen: 'w-[95vw] sm:w-[98vw]',
    mega: 'w-[95vw] sm:w-[98vw]',
  };

  const getFieldOptions = (fieldName) => {
    const field = fieldsArray.find(f => f.name === fieldName);
    if (!field) return [];

    if (field.getDynamicOptions && typeof field.getDynamicOptions === 'function') {
      try {
        const dynamicOpts = field.getDynamicOptions(formData);
        return Array.isArray(dynamicOpts) ? dynamicOpts : [];
      } catch {
        const fallback = Array.isArray(field.options) ? field.options : [];
        return fallback;
      }
    }

    const staticOpts = Array.isArray(field.options) ? field.options : [];
    return staticOpts;
  };

  const renderField = (field) => {
    const fieldValue = formData[field.name] ?? '';
    const hasError = errors[field.name] && touchedFields[field.name];
    const isFocused = focusedField === field.name;
    const hasValue = fieldValue && (typeof fieldValue === 'string' ? String(fieldValue).length > 0 : true);
    const options = getFieldOptions(field.name);

    switch (field.type) {
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
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );

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

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );

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
                      let newValue;
                      if (e.target.checked) {
                        newValue = [...checkboxValue, val];
                      } else {
                        newValue = checkboxValue.filter(v => v !== val);
                      }
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

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );
      }

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
              
              <button
                type="button"
                onClick={() => handleFieldChange(field.name, !isOn)}
                onBlur={() => handleFieldBlur(field.name, field.onBlur)}
                className={`
                  relative w-14 sm:w-12 h-8 sm:h-6 rounded-full transition-all duration-300 flex-shrink-0
                  ${isOn ? 'bg-blue-600' : 'bg-gray-300 sm:bg-gray-300'}
                `}
              >
                <div
                  className={`
                    absolute top-1 sm:top-0.5 w-6 sm:w-5 h-6 sm:h-5 bg-white rounded-full transition-all duration-300
                    ${isOn ? 'right-1 sm:right-0.5' : 'left-1 sm:left-0.5'}
                  `}
                />
              </button>
            </label>

            {field.description && (
              <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2 ml-3 sm:ml-0">{field.description}</p>
            )}
          </div>
        );
      }

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
                <span className="text-base sm:text-sm text-gray-700 sm:text-gray-600 font-mono font-bold">{fieldValue || '#000000'}</span>
              </div>
            )}

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );

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
            
            <input
              ref={(el) => {
                if (el) fileInputsRef.current[field.name] = el;
              }}
              type="file"
              name={field.name}
              accept={field.accept}
              onChange={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const file = e.target.files?.[0];
                if (file) {
                  console.log('📷 Input onChange - Archivo:', file.name);
                  handleFileChange(field.name, file, field);
                }
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleFieldBlur(field.name, field.onBlur);
              }}
              required={field.required}
              className="hidden"
              id={field.name}
            />
            <label 
              htmlFor={field.name}
              className={`
                block cursor-pointer transition-all duration-300 text-base sm:text-sm font-bold
                px-3 sm:px-3 py-3 sm:py-2 text-center pb-3 sm:pb-2 border-b-2
                ${hasError ? 'border-red-500 text-red-600 sm:text-red-500' : 'border-gray-300 hover:border-blue-400 text-gray-700 sm:text-gray-600'}
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

            {field.renderCustom && typeof field.renderCustom === 'function' && (
              <div className="mt-4">
                {field.renderCustom()}
              </div>
            )}
          </div>
        );

      // ====== NUEVO: SOPORTE PARA TYPE CUSTOM ======
      case 'custom':
        return (
          <div className="relative pt-2 sm:pt-1">
            {field.renderCustom ? (
              field.renderCustom(formData, handleFieldChange)
            ) : (
              <div className="text-red-500 font-bold">Error: renderCustom no definido para campo custom</div>
            )}
            
            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );

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
                focus:outline-none resize-none font-medium
                placeholder-gray-400
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

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );

      case 'select': {
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

                if (field.resetChildren && Array.isArray(field.resetChildren)) {
                  field.resetChildren.forEach(childField => {
                    handleFieldChange(childField, '');
                  });
                }

                // Ejecutar onChange personalizado si existe
                if (field.onChange && typeof field.onChange === 'function') {
                  field.onChange(value);
                }
              }}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => handleFieldBlur(field.name, field.onBlur)}
              required={field.required}
              className={`
                w-full px-0 py-3 sm:py-2 pr-6 sm:pr-4 bg-transparent text-base sm:text-sm text-gray-900
                border-b-2 transition-all duration-300 appearance-none font-medium
                focus:outline-none
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

            <ChevronDown 
              className={`
                absolute right-0 top-1/2 translate-y-1/2 pointer-events-none transition-all duration-300
                w-5 sm:w-4 h-5 sm:h-4
                ${isFocused ? 'text-blue-500 sm:text-blue-500' : 'text-gray-400 sm:text-gray-400'}
              `} 
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );
      }

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
                  border-b-2 transition-all duration-300 font-medium
                  focus:outline-none
                  placeholder-gray-400
                  ${hasError 
                    ? 'border-red-500 focus:border-red-500' 
                    : isFocused
                    ? 'border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              />
              
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.name)}
                className={`
                  absolute right-0 top-1/2 -translate-y-1/2 transition-colors duration-300 p-2 sm:p-1
                  ${isFocused ? 'text-blue-500 sm:text-blue-400' : 'text-gray-600 sm:text-gray-400 hover:text-gray-800 sm:hover:text-gray-600'}
                `}
              >
                {isVisible ? <EyeOff size={22} className="sm:w-5 sm:h-5" /> : <Eye size={22} className="sm:w-5 sm:h-5" />}
              </button>
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm sm:text-xs font-medium">
                <AlertCircle size={18} className="sm:w-4 sm:h-4" />
                {errors[field.name]}
              </div>
            )}

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );
      }

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
                border-b-2 transition-all duration-300 font-medium
                focus:outline-none
                placeholder-gray-400
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

            {field.helperText && !hasError && (
              <div className="mt-2">
                {field.helperText}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className={`
        bg-white rounded-3xl sm:rounded-2xl shadow-2xl w-full ${sizeClasses[size]} 
        max-h-[95vh] overflow-hidden flex flex-col
        animate-slide-up border border-gray-200
      `}>

        <div className="relative px-5 sm:px-6 py-6 sm:py-4 border-b-2 sm:border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl sm:text-xl font-bold text-gray-900 pr-10">{title}</h2>
          {subtitle && <p className="text-gray-600 text-base sm:text-sm mt-2 sm:mt-1 font-medium">{subtitle}</p>}

          <button 
            onClick={handleClose} 
            className="absolute top-5 sm:top-4 right-5 sm:right-4 p-2 hover:bg-gray-200 sm:hover:bg-gray-100 rounded-full transition-all duration-200 group active:bg-gray-300 sm:active:bg-gray-100"
          >
            <X size={28} className="sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900 sm:group-hover:text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-8 sm:px-6 py-8 sm:py-4 space-y-6 sm:space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-5">
              {fieldsArray.map((field) => {
                let colSpanClass = '';
                if (field.cols === 1) {
                  colSpanClass = 'md:col-span-1 lg:col-span-1';
                } else if (field.cols === 2) {
                  colSpanClass = 'md:col-span-2 lg:col-span-2';
                } else if (field.cols === 3 || field.fullWidth) {
                  colSpanClass = 'md:col-span-2 lg:col-span-3';
                } else if (field.cols === 12) {
                  colSpanClass = 'md:col-span-2 lg:col-span-3';
                }

                return (
                  <div 
                    key={field.name} 
                    className={colSpanClass}
                  >
                    {renderField(field)}

                    {field.helpText && !errors[field.name] && (
                      <p className="text-sm sm:text-xs text-gray-600 sm:text-gray-500 mt-2 ml-1 sm:ml-0 font-medium">{field.helpText}</p>
                    )}
                  </div>
                );
              })}
            </div>

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
