'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export default function VideoPlayer({
  src,
  className = '',
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLocalVideo, setIsLocalVideo] = useState(false);

  useEffect(() => {
    // Determina si es un video local o una URL externa (YouTube, Vimeo, etc.)
    const isLocalPath = src.startsWith('/uploads/') || src.startsWith('./uploads/');
    setIsLocalVideo(isLocalPath);
  }, [src]);

  // Para videos locales
  if (isLocalVideo) {
    return (
      <video
        ref={videoRef}
        className={`w-full rounded-lg ${className}`}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={muted}
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta la reproducción de videos.
      </video>
    );
  }

  // Para videos de servicios externos (YouTube, Vimeo, etc.)
  // Asume que 'src' es una URL de iframe embebido
  return (
    <div className={`relative w-full pt-[56.25%] ${className}`}>
      {src.startsWith('http') ? (
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
          <p className="text-gray-600">URL de video no válida</p>
        </div>
      )}
    </div>
  );
} 