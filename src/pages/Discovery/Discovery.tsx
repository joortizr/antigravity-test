import React, { useState } from 'react';
import { useMovies } from '../../hooks/useMovies';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { useMovieActions, useMovieHistory } from '../../context/movies/MovieContext';
import { TMDBMovie } from '../../types/tmdb.types';

export const Discovery: React.FC = () => {
  const { movies, loading, error, loadMore, hasMore } = useMovies();
  const { swipe } = useMovieActions();
  const historyState = useMovieHistory();
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMovie = movies[currentIndex] as TMDBMovie | undefined;

  const handleSwipe = (direction: 'like' | 'dislike') => {
    if (currentMovie) {
       swipe(direction, currentMovie);
       
       if (currentIndex + 1 >= movies.length) {
          if (hasMore) {
             loadMore();
             setCurrentIndex(0);
          } else {
             setCurrentIndex(currentIndex + 1);
          }
       } else {
          setCurrentIndex(prev => prev + 1);
       }
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="relative flex flex-col items-center animate-pulse">
        <div className="mb-6 h-5 w-32 bg-gray-800 rounded"></div>
        <div className="w-80 h-[28rem] bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center border border-gray-700">
          <p className="text-gray-400 font-bold text-lg">Cargando Películas...</p>
        </div>
        <div className="mt-10 flex justify-center space-x-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full border border-gray-700"></div>
          <div className="w-16 h-16 bg-gray-800 rounded-full border border-gray-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-sm text-center bg-gray-800 rounded-2xl border border-red-500/50">
        <p className="text-red-400 text-xl font-bold mb-2">¡Ups! Algo falló</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (!currentMovie) {
    return (
       <div className="p-8 text-center bg-gray-800 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
         <h2 className="text-2xl font-bold text-gray-200">No hay más películas</h2>
         <p className="text-gray-400 mt-2">Has revisado todas las recomendaciones actuales.</p>
         <div className="mt-6 pt-6 border-t border-gray-700">
           <span className="text-sm text-gray-500 font-medium">Películas en Historial: </span>
           <span className="ml-2 text-xl font-bold text-indigo-400">{historyState?.history?.length || 0}</span>
         </div>
       </div>
    );
  }

  const movieWithAbsoluteUrl = {
    ...currentMovie,
    id: currentMovie.id.toString(),
    title: currentMovie.title,
    year: currentMovie.release_date ? new Date(currentMovie.release_date).getFullYear() : 0,
    rating: currentMovie.vote_average,
    posterUrl: currentMovie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` 
      : 'https://via.placeholder.com/500x750/111827/ffffff?text=No+Poster'
  };

  const nextMovie = currentIndex + 1 < movies.length ? (movies[currentIndex + 1] as TMDBMovie) : undefined;
  const nextMovieUrl = nextMovie?.poster_path ? `https://image.tmdb.org/t/p/w342${nextMovie.poster_path}` : undefined;

  return (
    <div className="relative flex flex-col items-center">
       <div className="mb-6 h-5 text-sm text-gray-400 font-semibold tracking-widest uppercase flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Recomendación
       </div>
       
       <SwipeCard 
         key={movieWithAbsoluteUrl.id}
         movie={movieWithAbsoluteUrl} 
         onSwipe={handleSwipe} 
       />
       
       {nextMovieUrl && (
         <link rel="preload" as="image" href={nextMovieUrl} />
       )}
       
       <div className="mt-10 flex justify-center space-x-8">
          <button 
             className="w-16 h-16 bg-gray-800 shadow-lg border-2 border-red-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-500/50"
             onClick={() => handleSwipe('dislike')}
             aria-label="Dislike"
          >
            <span className="text-red-500 text-3xl font-bold">✗</span>
          </button>
          
          <button 
             className="w-16 h-16 bg-gray-800 shadow-lg border-2 border-green-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-green-500/10 focus:outline-none focus:ring-4 focus:ring-green-500/50"
             onClick={() => handleSwipe('like')}
             aria-label="Like"
          >
            <span className="text-green-500 text-4xl font-bold">♥</span>
          </button>
       </div>
    </div>
  );
};
