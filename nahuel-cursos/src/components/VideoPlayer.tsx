'use client';

import React, { useRef, useState } from 'react';
import { FaYoutube, FaExclamationTriangle } from 'react-icons/fa';
import useVideoUrl from '@/lib/hooks/useVideoUrl';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  stopPropagation?: boolean;
  fallbackToYoutube?: boolean;
  aspectRatio?: string;
  style?: React.CSSProperties;
}

export default function VideoPlayer({
  src,
  className = '',
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  stopPropagation = false,
  fallbackToYoutube = true,
  aspectRatio,
  style
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Procesar la URL del video utilizando nuestro hook (que ahora tiene protección contra bucles)
  const videoUrl = useVideoUrl(src);
  
  // Verificar el tipo de video según la URL
  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  const isVimeo = videoUrl && videoUrl.includes('vimeo.com');
  const isExternalVideo = videoUrl && (isYouTube || isVimeo || videoUrl.startsWith('http'));
  
  // Preparar URL externa con parámetros adecuados
  const prepareExternalUrl = (url: string): string => {
    let finalUrl = url;
    
    // Para YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Si es un embed, asegurarse de que tenga los parámetros correctos
      if (url.includes('embed')) {
        const separator = url.includes('?') ? '&' : '?';
        const params = [
          autoPlay ? 'autoplay=1' : '',
          muted ? 'mute=1' : '',
          controls ? 'controls=1' : 'controls=0',
          loop ? 'loop=1' : ''
        ].filter(Boolean).join('&');
        
        return `${url}${separator}${params}`;
      }
      
      // Si es un link normal, convertir a embed
      if (url.includes('watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        const params = [
          autoPlay ? 'autoplay=1' : '',
          muted ? 'mute=1' : '',
          controls ? 'controls=1' : 'controls=0',
          loop ? 'loop=1' : ''
        ].filter(Boolean).join('&');
        
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      }
    }
    
    // Para Vimeo
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    }
    
    return finalUrl;
  };
  
  // Contenedor principal con relación de aspecto
  const containerStyle = {
    position: 'relative' as const,
    paddingBottom: aspectRatio || '56.25%', // Default 16:9
    height: 0,
    overflow: 'hidden',
    ...style
  };
  
  // Estilo para iframe/video
  const mediaStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 0
  };
  
  // Si hay un error, mostrar mensaje
  if (error) {
    return (
      <div style={containerStyle} className={`video-error ${className}`}>
        <div style={{
          ...mediaStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#f8f9fa',
          padding: '20px',
          textAlign: 'center'
        }}>
          <FaExclamationTriangle size={48} color="#dc3545" />
          <h3 style={{ margin: '10px 0', color: '#dc3545' }}>Error al cargar el video</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  // Renderizar video externo (YouTube, Vimeo)
  if (isExternalVideo) {
    const externalUrl = prepareExternalUrl(videoUrl);
    
    return (
      <div style={containerStyle} className={`video-container ${className}`}>
        <iframe
          ref={iframeRef}
          src={externalUrl}
          style={mediaStyle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  
  // Renderizar video local o de API
  return (
    <div style={containerStyle} className={`video-container ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={mediaStyle}
        playsInline
      />
    </div>
  );
}