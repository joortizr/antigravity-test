import { useState, useEffect, useRef, useCallback } from 'react';
import { TMDBDiscoverResponse, TMDBMovie } from '../types/tmdb.types';

const BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL = 5 * 60 * 1000;

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

// ==========================================
// HOOK SECUNDARIO: Gestión de Capa de Caché
// ==========================================
function useTmdbCache() {
  const getCache = useCallback((key: string): TMDBDiscoverResponse | null => {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    try {
      const parsed: CacheItem = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed.data;
      sessionStorage.removeItem(key);
    } catch {
      sessionStorage.removeItem(key);
    }
    return null;
  }, []);

  const setCache = useCallback((key: string, data: TMDBDiscoverResponse) => {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  }, []);

  return { getCache, setCache };
}

// ==========================================
// HOOK PRINCIPAL (API Pública intacta como v1)
// ==========================================
export function useMovies(options: UseMoviesOptions = {}): UseMoviesReturn {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { getCache, setCache } = useTmdbCache();

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [options.genreId, options.year]);

  const fetchMovies = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    setError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const cacheKey = `cineswipe_v2_${options.genreId || 'all'}_${options.year || 'all'}_p${page}`;
    const cached = getCache(cacheKey);

    if (cached) {
      setMovies(prev => page === 1 ? cached.results : [...prev, ...cached.results]);
      setHasMore(cached.page < cached.total_pages);
      setLoading(false);
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_TMDB_KEY;
      const params = new URLSearchParams({
        page: page.toString(),
        sort_by: 'popularity.desc',
        language: 'es-ES',
        api_key: apiKey
      });

      if (options.genreId) params.append('with_genres', options.genreId.toString());
      if (options.year) params.append('primary_release_year', options.year.toString());

      const response = await fetch(`${BASE_URL}/discover/movie?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const rawData: TMDBDiscoverResponse = await response.json();
      
      setCache(cacheKey, rawData);
      setMovies(prev => page === 1 ? rawData.results : [...prev, ...rawData.results]);
      setHasMore(rawData.page < rawData.total_pages);

    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name !== 'AbortError') {
        setError(errorObj.message || 'Error de red');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  }, [page, options.genreId, options.year, hasMore, getCache, setCache]);

  useEffect(() => {
    fetchMovies();
    return () => abortControllerRef.current?.abort();
  }, [fetchMovies]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage(p => p + 1);
  }, [loading, hasMore]);

  return { movies, loading, error, loadMore, hasMore };
}
