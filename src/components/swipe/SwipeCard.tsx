import React, { useState, useRef, PointerEvent, KeyboardEvent } from 'react';
import { OptimizedImage } from '../common/OptimizedImage';

// ==========================================
// TIPOS E INTERFACES EXPLICITOS
// ==========================================
export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  posterUrl: string;
}

export interface SwipeCardProps {
  movie: Movie;
  /** Callback accionado cuando el usuario desliza la tarjeta más allá del umbral */
  onSwipe: (direction: 'like' | 'dislike') => void;
}

// ==========================================
// CONSTANTES DE CONFIGURACIÓN
// ==========================================
const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.05;

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export const SwipeCard: React.FC<SwipeCardProps> = ({ movie, onSwipe }) => {
  // Estado para la manipulación de gestos
  const [offset, setOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Referencias para el seguimiento de la posición inicial sin re-renders
  const startXRef = useRef<number>(0);

  // -- Gestores de Eventos Pointer (Soporta Mouse y Touch al mismo tiempo) --
  
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Captura el puntero para seguir rastreando el movimiento aunque el ratón salga del elemento
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    // Guárdamos la coordenada X inicial descontando cualquier desviación actual
    startXRef.current = e.clientX - offset;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentOffset = e.clientX - startXRef.current;
    setOffset(currentOffset);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Libera la captura del puntero
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Detección de umbral
    if (offset > SWIPE_THRESHOLD) {
      onSwipe('like');
    } else if (offset < -SWIPE_THRESHOLD) {
      onSwipe('dislike');
    } else {
      // Retorno a la posición base si no superó el umbral
      setOffset(0);
    }
  };

  // -- Flexibilidad y Accesibilidad (Fallback para teclado) --
  
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      onSwipe('like');
    } else if (e.key === 'ArrowLeft') {
      onSwipe('dislike');
    }
  };

  // -- Lógica de Presentación Dinámica --
  
  // Condicionales visuales
  const isLiking = offset > SWIPE_THRESHOLD;
  const isDisliking = offset < -SWIPE_THRESHOLD;
  const rotation = offset * ROTATION_FACTOR;
  
  // Determinamos las transiciones dependiendo de si estamos arrastrando
  // NOTA: Se aplica transform usando estilos en línea dado que el offset es dinámico (px/deg). Layout sigue con Tailwind.
  const dynamicStyle = {
    transform: `translate3d(${offset}px, 0, 0) rotate(${rotation}deg)`
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Tarjeta de pelicula: ${movie.title}`}
      className={`relative w-80 h-[28rem] rounded-2xl shadow-xl overflow-hidden touch-none select-none focus:outline-none focus:ring-4 focus:ring-indigo-500
        ${!isDragging ? 'transition-transform duration-300 ease-out' : 'cursor-grabbing'}
        ${isDragging && offset === 0 ? 'cursor-grab' : ''}
      `}
      style={dynamicStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp} // Manejo seguro de finalizaciones abruptas
      onKeyDown={handleKeyDown}
    >
      {/* Contenido Visual: Póster */}
      <OptimizedImage
        src={movie.posterUrl}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        priority={true}
      />
      
      {/* Indicadores visuales de Like/Dislike */}
      {isLiking && (
        <div className="absolute top-6 left-6 border-4 border-green-500 text-green-500 text-3xl font-bold uppercase py-1 px-4 rounded transform -rotate-12 bg-black bg-opacity-30">
          Like
        </div>
      )}
      {isDisliking && (
        <div className="absolute top-6 right-6 border-4 border-red-500 text-red-500 text-3xl font-bold uppercase py-1 px-4 rounded transform rotate-12 bg-black bg-opacity-30">
          Dislike
        </div>
      )}

      {/* Gradiente estilo viñeta para asegurar legibilidad del texto */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-16 pb-6 px-6 pointer-events-none">
        <h2 className="text-white text-2xl font-bold leading-tight truncate">
          {movie.title}
        </h2>
        <div className="flex items-center space-x-3 mt-2 text-gray-300 text-sm">
          <span className="font-semibold">{movie.year}</span>
          <span className="flex items-center text-yellow-400 font-bold">
            {'★ '}{movie.rating}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EJEMPLO DE USO (Comentado)
// ==========================================
/*
import React from 'react';
import { SwipeCard } from './SwipeCard';

export const DiscoveryPanel = () => {
  const sampleMovie = {
    id: 'm1',
    title: 'Dune: Part Two',
    year: 2024,
    rating: 8.8,
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc91p.jpg'
  };

  const handleSwipe = (direction: 'like' | 'dislike') => {
    console.log(`Movie swiped ${direction}`);
    // Aquí irían logicas del reducer para remover la carta actual y traer la siguiente
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <SwipeCard movie={sampleMovie} onSwipe={handleSwipe} />
    </div>
  );
};
*/
