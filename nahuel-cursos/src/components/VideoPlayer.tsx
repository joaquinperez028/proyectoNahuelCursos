'use client';

import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    // Asegurarnos que el componente está montado
    if (!videoRef.current) return;
    
    // Forzar el tipo MIME correcto para streaming
    const video = videoRef.current;
    video.type = "application/x-mpegURL";
  }, []);

  // Para videos de Mux (HLS) o videos locales
  if (src.includes('stream.mux.com') || src.includes('.m3u8')) {
    // Asegurarse de que la URL sea para streaming (m3u8)
    const videoUrl = src.includes('.m3u8') 
      ? src 
      : src.includes('stream.mux.com') 
        ? `${src}` // Ya tiene formato correcto
        : `https://stream.mux.com/${src}.m3u8`; // Corregir URL si es sólo un playbackId

    return (
      <div className={`video-container ${className}`}>
        <video
          ref={videoRef}
          className="w-full h-full rounded-lg"
          autoPlay={autoPlay}
          controls={controls}
          loop={loop}
          muted={muted}
          playsInline
          src={videoUrl}
          type="application/x-mpegURL"
          preload="auto"
        >
          Tu navegador no soporta la reproducción de videos.
        </video>
      </div>
    );
  }

  // Para videos de servicios externos (YouTube, Vimeo, etc.)
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