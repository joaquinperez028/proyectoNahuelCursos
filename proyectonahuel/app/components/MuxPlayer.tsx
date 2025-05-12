'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Importar el reproductor de MUX de forma dinámica para evitar problemas de SSR
const MuxPlayerReact = dynamic(
  () => import('@mux/mux-player-react'),
  { ssr: false }
);

interface MuxPlayerProps {
  playbackId: string;
  title?: string;
  autoPlay?: boolean;
}

export default function MuxPlayer({ playbackId, title = 'Video del curso', autoPlay = false }: MuxPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    // Resetear error cuando cambia el playbackId
    setHasError(false);
  }, [playbackId]);

  // Manejar errores del reproductor
  const handleError = (event: any) => {
    console.error('Error al cargar el video:', event);
    setHasError(true);
  };

  // No renderizar nada en el servidor
  if (!isMounted) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando reproductor...</p>
      </div>
    );
  }

  // Mostrar mensaje de error si falla la carga
  if (hasError) {
    return (
      <div className="w-full aspect-video bg-[var(--neutral-900)] flex items-center justify-center">
        <div className="text-center p-4">
          <svg className="w-16 h-16 mx-auto text-[var(--primary-light)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">Error al cargar el video</h3>
          <p className="text-[var(--neutral-300)]">No se pudo reproducir este video. Por favor, inténtelo de nuevo más tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <MuxPlayerReact
      ref={playerRef}
      playbackId={playbackId}
      streamType="on-demand"
      title={title}
      className="w-full h-auto aspect-video"
      poster="auto"
      thumbnailTime={0}
      primaryColor="#3B82F6"
      secondaryColor="#1D4ED8"
      autoPlay={autoPlay}
      muted={autoPlay}
      preload="auto"
      onError={handleError}
    />
  );
} 