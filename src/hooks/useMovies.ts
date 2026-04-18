import { useState, useEffect, useRef, useCallback } from 'react';
import { TMDBDiscoverResponse, TMDBMovie } from '../types/tmdb.types';

const BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CacheItem {
  timestamp: number;
  data: TMDBDiscoverResponse;
}

export interface UseMoviesOptions {
  genreId?: number;
  year?: number;
}

interface UseMoviesReturn {
  movies: TMDBMovie[];
  loading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
}

// Type Guard para validar la respuesta cruda de TMDB
function isValidTMDBResponse(data: unknown): data is TMDBDiscoverResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'page' in data &&
    'total_pages' in data &&
    Array.isArray((data as Record<string, unknown>).results)
  );
}

/**
 * Hook para obtener películas populares desde TMDB (/discover/movie).
 * Implementa paginación local, filtros de género/año y caché con SessionStorage (TTL 5 mins).
 * 
 * @param {UseMoviesOptions} options - Opciones de filtrado como `genreId` o `year`.
 * @returns {UseMoviesReturn} Estado reactivo del catálogo, estado de carga, errores y función de carga.
 */
export function useMovies(options: UseMoviesOptions = {}): UseMoviesReturn {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Referencia para mantener el signal abort controller entre re-renders
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cada que cambian los filtros principales, reseteamos la memoria local y la página a 1
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [options.genreId, options.year]);

  const fetchMovies = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    setError(null);

    // Cancelar la petición anterior si aún está en vuelo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const apiKey = import.meta.env.VITE_TMDB_KEY;
      if (!apiKey) {
        throw new Error('API Key ausente. Verifica tus variables de entorno.');
      }

      // Construcción dinámica de URL y Search Params
      const params = new URLSearchParams({
        page: page.toString(),
        sort_by: 'popularity.desc',
        language: 'es-ES'
      });

      if (options.genreId) params.append('with_genres', options.genreId.toString());
      if (options.year) params.append('primary_release_year', options.year.toString());

      // Usando el token como parametro estándar de v3. Alternativa para tu Token JWT largo: agregar header
      // headers: { 'Authorization': `Bearer ${apiKey}` }
      params.append('api_key', apiKey);

      const url = `${BASE_URL}/discover/movie?${params.toString()}`;
      const cacheKey = `cineswipe_tmdb_${options.genreId || 'all'}_${options.year || 'all'}_page_${page}`;

      // Búsqueda en Caché de Sesión de la ruta específica
      const cachedResponse = sessionStorage.getItem(cacheKey);
      if (cachedResponse) {
        try {
          const parsedCache: CacheItem = JSON.parse(cachedResponse);
          const isFresh = (Date.now() - parsedCache.timestamp) < CACHE_TTL;
          
          if (isFresh) {
            setMovies(prev => page === 1 ? parsedCache.data.results : [...prev, ...parsedCache.data.results]);
            setHasMore(parsedCache.data.page < parsedCache.data.total_pages);
            setLoading(false);
            return; // Retorno temprano si está cacheado y válido
          } else {
            sessionStorage.removeItem(cacheKey); // Invalida el caché viejo
          }
        } catch {
          sessionStorage.removeItem(cacheKey); // Resuelve corrupción de JSON manual
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
          // Si el VITE_TMDB_KEY que usas es el Access Token largo (JWT), descomenta esta línea:
          // 'Authorization': `Bearer ${apiKey}`
        },
        signal: abortControllerRef.current.signal
      });

      // Manejo estricto de códigos HTTP (Protección de casos edge)
      if (!response.ok) {
        if (response.status === 401) throw new Error('Error 401: API Key de TMDB inválida o expirada.');
        if (response.status === 404) throw new Error('Error 404: Endpoint no encontrado.');
        if (response.status === 429) throw new Error('Error 429: Rate Limit excedido. Demasiadas peticiones.');
        throw new Error(`Error inesperado del servidor: ${response.status}`);
      }

      const rawData = await response.json();

      // Validación Typesafe en tiempo de ejecución (Type Guard)
      if (!isValidTMDBResponse(rawData)) {
        throw new Error('Estructura de payload de TMDB desconocida o corrupta.');
      }

      // Guardar en caché antes de actualizar React State
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: rawData
      }));

      // Actualizar el estado combinando lo viejo y lo nuevo (en paginación)
      setMovies(prev => page === 1 ? rawData.results : [...prev, ...rawData.results]);
      setHasMore(rawData.page < rawData.total_pages);

    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name === 'AbortError') {
        console.log('Petición fetch abortada (limpieza normal o request duplicada)');
      } else {
        setError(errorObj.message || 'Error de red desconocido');
      }
    } finally {
      // Ojo: no seteamos loading false si fue abortado para evitar flicker
      if (abortControllerRef.current?.signal.aborted === false) {
        setLoading(false);
      }
    }
  }, [page, options.genreId, options.year, hasMore]); // dependencias reactivas del scope de useCallback

  // Trigger automático cuando cambia página o se limpian filtros
  useEffect(() => {
    fetchMovies();

    // Función de cleanup (Desmontaje del Hook)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMovies]);

  // Función proxy a exponer
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [loading, hasMore]);

  return { movies, loading, error, loadMore, hasMore };
}
