import React, { createContext, useReducer, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { TMDBMovie } from '../../types/tmdb.types';
import { supabase } from '../../lib/supabase';

// ==========================================
// 1. TIPOS DE ESTADO Y ACCIONES
// ==========================================

export type SwipeDirection = 'like' | 'dislike';

export interface HistoryItem {
  movie: TMDBMovie;
  direction: SwipeDirection;
  timestamp: number;
}

export interface MovieState {
  history: HistoryItem[];
}

export type MovieAction =
  | { type: 'SWIPE_RIGHT'; payload: TMDBMovie }
  | { type: 'SWIPE_LEFT'; payload: TMDBMovie }
  | { type: 'UNDO_LAST' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'REHYDRATE'; payload: MovieState };

// Interfaz para el Custom Dispatcher
export interface MovieActions {
  swipe: (direction: SwipeDirection, movie: TMDBMovie) => Promise<void>;
  undo: () => void;
  clear: () => void;
}

// ==========================================
// 2. REDUCER PURO
// ==========================================

const MAX_HISTORY = 50;
const INITIAL_STATE: MovieState = { history: [] };

export const movieReducer = (state: MovieState, action: MovieAction): MovieState => {
  switch (action.type) {
    case 'SWIPE_RIGHT':
    case 'SWIPE_LEFT': {
      const direction = action.type === 'SWIPE_RIGHT' ? 'like' : 'dislike';
      const newItem: HistoryItem = { movie: action.payload, direction, timestamp: Date.now() };
      const newHistory = [newItem, ...state.history];
      if (newHistory.length > MAX_HISTORY) newHistory.pop();
      return { ...state, history: newHistory };
    }
    case 'UNDO_LAST': {
      if (state.history.length === 0) return state;
      return { ...state, history: state.history.slice(1) };
    }
    case 'CLEAR_HISTORY': {
      return { ...state, history: [] };
    }
    case 'REHYDRATE': {
      return action.payload;
    }
    default:
      return state;
  }
};

// ==========================================
// 3. CONTEXTOS (Separación Read/Write)
// ==========================================

const MovieStateContext = createContext<MovieState | undefined>(undefined);
const MovieDispatchContext = createContext<MovieActions | undefined>(undefined);

// ==========================================
// 4. PROVIDER COMPONENT
// ==========================================

const LOCAL_SESSION_KEY = 'cineswipe_session_id';

export const MovieProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, INITIAL_STATE);

  // Inicialización de la sesión anónima
  useEffect(() => {
    let sessionId = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem(LOCAL_SESSION_KEY, sessionId);
    }

    // Opcional: Rehidratar el historial recuperando los likes base de Supabase si quisieramos
    // Por ahora partimos con historial limpio al inicializar si no se implementa el fetching de historial.
  }, []);

  // Custom Wrapper para desencadenar efectos secundarios (Network) sincronizados con UI
  const swipe = useCallback(async (direction: SwipeDirection, movie: TMDBMovie) => {
    // 1. Actualización Optimizada de la Vista (Optimistic UI) Inmediata
    dispatch({ type: direction === 'like' ? 'SWIPE_RIGHT' : 'SWIPE_LEFT', payload: movie });

    // 2. Sincronización en Background hacia Supabase Cloud
    try {
      const { error } = await supabase.from('movie_interactions').insert({
        movie_id: movie.id,
        movie_title: movie.title,
        movie_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        movie_rating: movie.vote_average,
        poster_path: movie.poster_path,
        interaction: direction
        // Nota: Omitimos user_id porque se requiere relajar el RLS para que inserte null o un formato de UUID fantasma
      });

      if (error) {
        console.error('CineSwipe Supabase Sync Error:', error.message);
      }
    } catch (err) {
      console.error('Error fatal comunicando con Supabase:', err);
    }
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO_LAST' }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []);

  const stateValue = useMemo(() => state, [state]);
  const dispatchValue = useMemo(() => ({ swipe, undo, clear }), [swipe, undo, clear]);

  return (
    <MovieStateContext.Provider value={stateValue}>
      <MovieDispatchContext.Provider value={dispatchValue}>
        {children}
      </MovieDispatchContext.Provider>
    </MovieStateContext.Provider>
  );
};

// ==========================================
// 5. CUSTOM HOOKS DE ACCESO
// ==========================================

export function useMovieHistory() {
  const context = useContext(MovieStateContext);
  if (context === undefined) {
    throw new Error('useMovieHistory debe ser usado dentro de MovieProvider');
  }
  return context;
}

export function useMovieActions() {
  const context = useContext(MovieDispatchContext);
  if (context === undefined) {
    throw new Error('useMovieActions debe ser usado dentro de MovieProvider');
  }
  return context;
}
