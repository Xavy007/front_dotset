// ===============================================
// ARCHIVO: src/utils/categoriasPorEdad.js
// Funciones para calcular categorías según edad
// ===============================================

/**
 * Calcula la categoría correspondiente basada en fnac
 * @param {string} fnac - Fecha de nacimiento (YYYY-MM-DD)
 * @returns {object} { categoria_base, edad_actual }
 */
export function obtenerCategoriasPorEdad(fnac) {
  if (!fnac) {
    return {
      edad_actual: null,
      categoria_base: null
    };
  }

  const hoy = new Date();
  const nacimiento = new Date(fnac);
  
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  // Determinar categoría basada en edad
  let categoriaBase = null;
  
  if (edad >= 8 && edad <= 10) categoriaBase = 'U10';
  else if (edad >= 11 && edad <= 12) categoriaBase = 'U12';
  else if (edad >= 13 && edad <= 14) categoriaBase = 'U14';
  else if (edad >= 15 && edad <= 16) categoriaBase = 'U16';
  else if (edad >= 17 && edad <= 18) categoriaBase = 'U18';
  else if (edad >= 19) categoriaBase = 'Adulto';

  return {
    edad_actual: edad,
    categoria_base: categoriaBase
  };
}

/**
 * Obtiene las categorías permitidas para un jugador
 * (su categoría + hasta 2 categorías superiores)
 * @param {string} fnac - Fecha de nacimiento
 * @param {array} todasCategorias - Array de todas las categorías disponibles
 * @returns {array} Categorías permitidas
 */
export function obtenerCategoriasPermitidas(fnac, todasCategorias = []) {
  const { categoria_base } = obtenerCategoriasPorEdad(fnac);
  
  // Orden de categorías de menor a mayor
  const orden = ['U10', 'U12', 'U14', 'U16', 'U18', 'Adulto'];
  
  if (!categoria_base || !orden.includes(categoria_base)) {
    return []; // Sin categorías permitidas
  }

  const indexBase = orden.indexOf(categoria_base);
  const indicesPermitidos = [indexBase]; // Su categoría

  // Agregar hasta 2 categorías superiores
  if (indexBase + 1 < orden.length) {
    indicesPermitidos.push(indexBase + 1);
  }
  if (indexBase + 2 < orden.length) {
    indicesPermitidos.push(indexBase + 2);
  }

  // Filtrar categorías permitidas desde el array recibido
  return todasCategorias.filter(cat => {
    // Intentar obtener el nombre de la categoría (puede ser 'nombre' o 'name')
    const nombreCat = cat.nombre || cat.name || '';
    
    // Verificar si el nombre coincide con alguna categoría permitida
    return indicesPermitidos.some(i => nombreCat === orden[i]);
  });
}

/**
 * Valida si un jugador puede inscribirse en una categoría específica
 * @param {string} fnac - Fecha de nacimiento
 * @param {number} id_categoria - ID de la categoría
 * @param {array} todasCategorias - Array de todas las categorías
 * @returns {boolean} true si puede inscribirse
 */
export function puedeInscribirse(fnac, id_categoria, todasCategorias = []) {
  const categoriasPermitidas = obtenerCategoriasPermitidas(fnac, todasCategorias);
  return categoriasPermitidas.some(c => c.id_categoria === id_categoria);
}

/**
 * Calcula cuántas categorías superiores puede ocupar un jugador
 * @param {string} fnac - Fecha de nacimiento
 * @returns {number} Cantidad de categorías superiores permitidas
 */
export function obtenerCantidadCategoriasSuperiores(fnac) {
  const { categoria_base } = obtenerCategoriasPorEdad(fnac);
  const orden = ['U10', 'U12', 'U14', 'U16', 'U18', 'Adulto'];
  
  if (!categoria_base || !orden.includes(categoria_base)) {
    return 0;
  }

  const indexBase = orden.indexOf(categoria_base);
  let cantidad = 0;

  // Contar cuántas categorías superiores existen
  if (indexBase + 1 < orden.length) cantidad++;
  if (indexBase + 2 < orden.length) cantidad++;

  return cantidad;
}

/**
 * Obtiene información detallada de una categoría
 * @param {number} id_categoria - ID de la categoría
 * @param {array} todasCategorias - Array de todas las categorías
 * @returns {object} Datos de la categoría o null
 */
export function obtenerDatosCategoria(id_categoria, todasCategorias = []) {
  return todasCategorias.find(c => c.id_categoria === id_categoria) || null;
}

/**
 * Formatea información de edad y categoría
 * @param {string} fnac - Fecha de nacimiento
 * @param {array} todasCategorias - Array de todas las categorías
 * @returns {object} Objeto con información formateada
 */
export function obtenerInfoEdadCategoria(fnac, todasCategorias = []) {
  const { edad_actual, categoria_base } = obtenerCategoriasPorEdad(fnac);
  const permitidas = obtenerCategoriasPermitidas(fnac, todasCategorias);
  const superiores = obtenerCantidadCategoriasSuperiores(fnac);

  return {
    edad: edad_actual,
    categoria_base,
    categorias_permitidas: permitidas,
    cantidad_categorias_superiores: superiores,
    puede_inscribirse: permitidas.length > 0,
    texto_resumen: `${edad_actual} años - ${categoria_base}${superiores > 0 ? ` (+${superiores} superior${superiores > 1 ? 'es' : ''})` : ''}`
  };
}