import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = '', priority = false }) => {
  const [loaded, setLoaded] = useState(false);

  // Derivar fuentes responsivas si es una imagen de TMDB
  let w185Src = src;
  let w342Src = src;
  let w500Src = src;
  
  const tmdbRegex = /https:\/\/image\.tmdb\.org\/t\/p\/[a-zA-Z0-9]+\/(.+)/;
  const match = src.match(tmdbRegex);
  
  if (match && match[1]) {
    w185Src = `https://image.tmdb.org/t/p/w185/${match[1]}`;
    w342Src = `https://image.tmdb.org/t/p/w342/${match[1]}`;
    w500Src = `https://image.tmdb.org/t/p/w500/${match[1]}`;
  }

  return (
    <img
      src={w500Src}
      srcSet={match ? `${w185Src} 185w, ${w342Src} 342w, ${w500Src} 500w` : undefined}
      sizes={match ? "(max-width: 400px) 100vw, 320px" : undefined}
      alt={alt}
      className={`${!priority ? `transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}` : ''} ${className}`}
      loading={priority ? "eager" : "lazy"}
      // @ts-ignore
      fetchpriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      onLoad={() => setLoaded(true)}
      draggable="false"
    />
  );
};
