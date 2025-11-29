import { useState, useEffect } from 'react';
import { jugadoresService } from '../services/jugadoresService';

export function useJugadoresCatalogos() {
  const [nacionalidades, setNacionalidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Helper seguro para arrays
  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.categorias && Array.isArray(res.categorias)) return res.categorias;
    if (res?.clubs && Array.isArray(res.clubs)) return res.clubs;
    if (res?.nacionalidades && Array.isArray(res.nacionalidades)) return res.nacionalidades;
    return [];
  };

  useEffect(() => {
    const loadAll = async () => {
      // Usamos allSettled para que NO se rompa todo si falla una sola API
      const results = await Promise.allSettled([
        jugadoresService.getNacionalidades(),
        jugadoresService.getDepartamentos(),
        jugadoresService.getProvincias(),
        jugadoresService.getClubes(),
        jugadoresService.getCategorias()
      ]);

      const [resNac, resDep, resProv, resClub, resCat] = results;

      // 1. Nacionalidades
      if (resNac.status === 'fulfilled') {
        const arr = extractArray(resNac.value);
        setNacionalidades(arr.map(n => ({ label: n.pais, value: String(n.id_nacionalidad) })));
      } else console.error("❌ Falló Nacionalidades:", resNac.reason);

      // 2. Departamentos
      if (resDep.status === 'fulfilled') {
        const arr = extractArray(resDep.value);
        setDepartamentos(arr.map(d => ({ label: d.nombre, value: String(d.id_departamento), id_nacionalidad: d.id_nacionalidad })));
      }

      // 3. Provincias
      if (resProv.status === 'fulfilled') {
        const arr = extractArray(resProv.value);
        setProvincias(arr.map(p => ({ label: p.nombre, value: String(p.id_provincia), id_departamento: p.id_departamento })));
      }

      // 4. Clubes
      if (resClub.status === 'fulfilled') {
        const arr = extractArray(resClub.value);
        setClubs(arr.map(c => ({ label: c.nombre, value: String(c.id_club) })));
      } else console.error("❌ Falló Clubes:", resClub.reason);

      // 5. Categorías
      if (resCat.status === 'fulfilled') {
        setCategorias(extractArray(resCat.value));
      } else console.error("❌ Falló Categorías (Posible 404):", resCat.reason);

      setLoadingCatalogos(false);
    };

    loadAll();
  }, []);

  return { nacionalidades, departamentos, provincias, clubs, categorias, loadingCatalogos };
}