'use client';

import { useEffect, useRef, useState } from 'react';

interface FallbackVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export default function FallbackVideoPlayer({ src, poster, title = 'Video del curso' }: FallbackVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Limpiar error cuando cambia la fuente
    setError(null);
  }, [src]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Error al reproducir video:', err);
          setError('No se pudo reproducir el video automáticamente. Intente haciendo clic en el botón de reproducción.');
        });
    }
  };

  const handleError = () => {
    setError('No se pudo cargar el video. La URL podría ser inválida o no tener permisos de acceso.');
  };

  return (
    <div className="w-full relative bg-black">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        controls
        poster={poster}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={src} type="application/x-mpegURL" />
        Su navegador no soporta la reproducción de videos HTML5.
      </video>

      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="text-white text-center max-w-md">
            <p className="text-lg font-medium mb-2">Error de reproducción</p>
            <p className="mb-4">{error}</p>
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Intentar reproducir de nuevo
            </button>
          </div>
        </div>
      )}

      {!isPlaying && !error && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
        >
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-8 border-b-8 border-l-14 border-transparent border-l-white ml-1"></div>
          </div>
          <span className="sr-only">Reproducir {title}</span>
        </div>
      )}
    </div>
  );
} 