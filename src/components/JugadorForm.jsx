import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

export default function JugadorForm({
  onClose,
  onSubmit,
  title,
  fields = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState({});
  const [showPasswords, setShowPasswords] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    } else {
      const emptyData = {};
      fields.forEach(field => {
        emptyData[field.name] = '';
      });
      setFormData(emptyData);
    }
    setShowPasswords({});
  }, [initialData]); // ✅ IMPORTANTE: Solo initialData, NO fields

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // ============================================
  // RENDER FIELD
  // ============================================
  const renderField = (field) => {
    const fieldValue = formData[field.name] ?? '';

    switch (field.type) {
      case 'file':
        return (
          <div>
            <input
              type="file"
              name={field.name}
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFormData({ ...formData, [field.name]: file });
              }}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {fieldValue && fieldValue.name && (
              <p className="text-xs text-gray-500 mt-1">
                Archivo: {fieldValue.name}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={fieldValue}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'select':
        return (
          <div className="relative">
            <select
              name={field.name}
              value={fieldValue}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, [field.name]: value });
                if (field.onChange) {
                  field.onChange(value);
                }
              }}
              required={field.required}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {field.placeholder && (
                <option value="">{field.placeholder}</option>
              )}
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'select-dependent':
        return (
          <div className="relative">
            <select
              name={field.name}
              value={fieldValue}
              onChange={(e) => {
                const value = e.target.value;
                let newData = { ...formData, [field.name]: value };

                if (field.resetChildren) {
                  newData[field.resetChildren] = '';
                }

                setFormData(newData);

                if (field.onChange) {
                  field.onChange(value);
                }
              }}
              required={field.required}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {field.placeholder && (
                <option value="">{field.placeholder}</option>
              )}

              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'password':
        const isVisible = showPasswords[field.name] || false;
        return (
          <div className="relative">
            <input
              type={isVisible ? 'text' : 'password'}
              name={field.name}
              value={fieldValue}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={typeof fieldValue === 'object' ? '' : fieldValue}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            step={field.step}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {renderField(field)}

              {field.helpText && (
                <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save size={20} />
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}