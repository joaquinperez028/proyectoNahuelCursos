'use client';

import React from 'react';
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
  const [isMuxVideo, setIsMuxVideo] = useState(false);
  const [isLocalVideo, setIsLocalVideo] = useState(false);

  useEffect(() => {
    // Determinar tipo de video
    const isMux = src.includes('stream.mux.com') || src.includes('.m3u8');
    const isLocalPath = src.startsWith('/uploads/') || src.startsWith('./uploads/');
    setIsMuxVideo(isMux);
    setIsLocalVideo(isLocalPath);
  }, [src]);

  // Para videos de Mux (HLS) o videos locales
  if (isMuxVideo || isLocalVideo) {
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
        >
          <source 
            src={videoUrl} 
            type="application/x-mpegURL" 
          />
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