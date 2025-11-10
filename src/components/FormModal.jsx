import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Eye, EyeOff } from 'lucide-react'; // ✅ Agregar Eye y EyeOff

export default function FormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  fields = [],
  initialData = null,
  size = 'md'
}) {
  const [formData, setFormData] = useState({});
  const [showPasswords, setShowPasswords] = useState({}); // ✅ Estado para controlar visibilidad de passwords

  useEffect(() => {
    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        console.log('📝 Estableciendo initialData:', initialData);
        setFormData(initialData);
      } else {
        const emptyData = {};
        fields.forEach(field => {
          emptyData[field.name] = field.type === 'select' ? '' : '';
        });
        console.log('📝 Estableciendo datos vacíos:', emptyData);
        setFormData(emptyData);
      }
      // ✅ Resetear visibilidad de passwords al abrir
      setShowPasswords({});
    }
  }, [initialData, fields, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Campo ${name} cambió a:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📤 Enviando formulario:', formData);
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({});
    setShowPasswords({}); // ✅ Limpiar visibilidad de passwords
    onClose();
  };

  // ✅ Toggle para mostrar/ocultar contraseña
  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl md:max-w-2xl',
    '3xl': 'sm:max-w-3xl md:max-w-3xl',
    '4xl': 'sm:max-w-4xl md:max-w-4xl',
  };

  const renderField = (field) => {
    const fieldValue = formData[field.name] ?? '';
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={fieldValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        );

      case 'select':
        console.log(`🔍 Select ${field.name}:`, {
          value: fieldValue,
          options: field.options,
          hasMatch: field.options?.some(opt => String(opt.value) === String(fieldValue))
        });

        return (
          <div className="relative">
            <select
              name={field.name}
              value={fieldValue}
              onChange={handleChange}
              required={field.required}
              className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
            >
              {field.placeholder && (
                <option value="" disabled={field.required}>
                  {field.placeholder}
                </option>
              )}
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
              size={18} 
            />
          </div>
        );

      // ✅ CASO ESPECIAL PARA PASSWORD CON TOGGLE
      case 'password':
        const isVisible = showPasswords[field.name] || false;
        return (
          <div className="relative">
            <input
              type={isVisible ? 'text' : 'password'} // ✅ Cambiar dinámicamente
              name={field.name}
              value={fieldValue}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* ✅ Botón para mostrar/ocultar contraseña */}
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {isVisible ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        );

      default:
        return (
          <input
            type={field.type || 'text'}
            name={field.name}
            value={fieldValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`
        bg-white rounded-lg shadow-xl 
        w-full ${sizeClasses[size]}
        max-h-[95vh] sm:max-h-[90vh]
        overflow-hidden
        flex flex-col
      `}>
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-4">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={24} className="sm:w-6 sm:h-6 w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.helpText && (
                  <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium order-1 sm:order-2"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}