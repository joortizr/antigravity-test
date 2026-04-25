import React, { useState, useRef, PointerEvent, KeyboardEvent, memo, useCallback, useMemo } from 'react';
import { OptimizedImage } from '../common/OptimizedImage';

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  posterUrl: string;
}

export interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'like' | 'dislike') => void;
}

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.05;

/**
 * COMPONENTE OPTIMIZADO: SwipeCard
 * Se utiliza React.memo para evitar re-renders innecesarios cuando el padre (Discovery) 
 * cambia su estado pero esta tarjeta específica no ha recibido cambios en sus props.
 */
export const SwipeCard = memo(({ movie, onSwipe }: SwipeCardProps) => {
  const [offset, setOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);

  /**
   * useCallback: Mantiene la referencia de la función estable.
   * Evita que hijos que dependan de este handler se re-rendericen innecesariamente.
   */
  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    startXRef.current = e.clientX - offset;
  }, [offset]);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentOffset = e.clientX - startXRef.current;
    setOffset(currentOffset);
  }, [isDragging]);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (offset > SWIPE_THRESHOLD) {
      onSwipe('like');
    } else if (offset < -SWIPE_THRESHOLD) {
      onSwipe('dislike');
    } else {
      setOffset(0);
    }
  }, [isDragging, offset, onSwipe]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') onSwipe('like');
    else if (e.key === 'ArrowLeft') onSwipe('dislike');
  }, [onSwipe]);

  /**
   * useMemo: Memoriza los valores calculados de rotación y estilo.
   * Solo se recalculan si el offset cambia, optimizando el cálculo en cada render de dragging.
   */
  const rotation = useMemo(() => offset * ROTATION_FACTOR, [offset]);
  
  const dynamicStyle = useMemo(() => ({
    transform: `translate3d(${offset}px, 0, 0) rotate(${rotation}deg)`
  }), [offset, rotation]);

  const isLiking = offset > SWIPE_THRESHOLD;
  const isDisliking = offset < -SWIPE_THRESHOLD;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Tarjeta de pelicula: ${movie.title}`}
      className={`relative w-80 h-[28rem] rounded-2xl shadow-xl overflow-hidden touch-none select-none focus:outline-none focus:ring-4 focus:ring-indigo-500
        ${!isDragging ? 'transition-transform duration-300 ease-out' : 'cursor-grabbing'}
      `}
      style={dynamicStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <OptimizedImage
        src={movie.posterUrl}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        priority={true}
      />
      
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
});

SwipeCard.displayName = 'SwipeCard';
