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
  const [isHlsVideo, setIsHlsVideo] = useState(false);
  const [isMuxVideo, setIsMuxVideo] = useState(false);
  const [isLocalVideo, setIsLocalVideo] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Limpieza del reproductor de video anterior si existe
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Determinar tipo de video
    const isMux = src.includes('stream.mux.com') || src.includes('.m3u8');
    const isLocalPath = src.startsWith('/uploads/') || src.startsWith('./uploads/');
    setIsMuxVideo(isMux);
    setIsHlsVideo(src.includes('.m3u8'));
    setIsLocalVideo(isLocalPath);

    // Si es un video HLS (Mux), inicializar video.js
    if (isMux && videoRef.current) {
      const initializePlayer = async () => {
        // Importar Video.js dinámicamente
        const videojs = (await import('video.js')).default;
        // Importar el plugin de HLS si es necesario
        if (!videojs.getPlugin('hlsQualitySelector')) {
          try {
            // Intentar cargar el plugin videojs-hls-quality-selector
            await import('videojs-hls-quality-selector');
            await import('videojs-contrib-quality-levels');
          } catch (e) {
            console.warn('No se pudo cargar el selector de calidad HLS:', e);
          }
        }

        // Crear el reproductor
        const player = videojs(videoRef.current, {
          controls,
          autoplay: autoPlay,
          muted,
          loop,
          fluid: true,
          html5: {
            vhs: {
              overrideNative: true
            }
          },
          sources: [{
            src: src,
            type: 'application/x-mpegURL'
          }]
        });

        // Configurar selector de calidad si está disponible
        try {
          player.hlsQualitySelector && player.hlsQualitySelector({ displayCurrentQuality: true });
        } catch (e) {
          console.warn('Error al inicializar el selector de calidad:', e);
        }

        playerRef.current = player;
      };

      initializePlayer().catch(err => console.error('Error al inicializar el reproductor:', err));
    }
  }, [src, autoPlay, controls, loop, muted]);

  // Para videos de Mux (HLS)
  if (isMuxVideo) {
    return (
      <div className={`video-js-container ${className}`}>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
          playsInline
        />
      </div>
    );
  }

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