// ===============================================
// ARCHIVO: src/utils/jugadoresUtils.js
// ===============================================

export const formatDate = (dateValue) => {
  if (!dateValue) return '';
  // Si ya viene como string yyyy-mm-dd
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  
  // Extraer formato YYYY-MM-DD de forma segura
  return date.toISOString().split('T')[0];
};

export const calcularEdad = (fnac) => {
  if (!fnac) return null;
  const hoy = new Date();
  const nacimiento = new Date(fnac);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// Convierte la respuesta compleja del backend en un objeto plano fácil de leer para la tabla
export const flattenJugador = (j) => {
  const p = j.Persona || j.persona || {};
  const nombreCompleto = [p.nombre, p.ap, p.am].filter(Boolean).join(' ').trim();
  const nombreFinal = nombreCompleto || j.nombre || `Jugador ${j.id_jugador || j.id}`;

  return {
    id: j.id_jugador || j.id, // ID único para React keys
    id_jugador: j.id_jugador || j.id,
    nombre: nombreFinal,
    estatura: j.estatura || 0,
    dorsal: j.dorsal || '—',
    nombreClub: j.Club?.nombre || j.club?.nombre || 'Sin Club',
    fnac: p.fnac, // Necesario para calcular edad
    foto: j.foto,
    // Guardamos el objeto original para poder editarlo luego
    raw: { 
      ...j, 
      persona: p 
    } 
  };
};