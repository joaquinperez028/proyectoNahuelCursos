'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // No renderizar nada en el servidor
  if (!isMounted) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando reproductor...</p>
      </div>
    );
  }

  return (
    <MuxPlayerReact
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
    />
  );
} 