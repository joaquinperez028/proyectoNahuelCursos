'use client';

import { useRef, useEffect, useState } from 'react';
import { FaPlayCircle, FaLock } from 'react-icons/fa';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  stopPropagation?: boolean;
}

export default function VideoPlayer({
  src,
  className = '',
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  stopPropagation = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLocalVideo, setIsLocalVideo] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);

  useEffect(() => {
    // Determina si es un video local o una URL externa (YouTube, Vimeo, etc.)
    const isLocalPath = src.startsWith('/uploads/') || src.startsWith('./uploads/');
    setIsLocalVideo(isLocalPath);
  }, [src]);

  // Función para preparar URL con parámetros que eviten autoplay a menos que sea explícitamente solicitado
  const prepararURLExterna = (url: string): string => {
    if (!url) return '';
    
    let urlModificada = url;
    
    // Asegurar que el parámetro de autoplay se aplica según la prop autoPlay
    if (url.includes('youtube.com/embed/')) {
      // Remover parámetros de autoplay existentes si están presentes
      urlModificada = urlModificada.replace(/[&?]autoplay=[01]/g, '');
      
      // Añadir el parámetro correcto
      const tieneSeparador = urlModificada.includes('?') ? '&' : '?';
      urlModificada = `${urlModificada}${tieneSeparador}autoplay=${autoPlay ? '1' : '0'}&mute=${muted ? '1' : '0'}`;
    }
    // Para Vimeo
    else if (url.includes('player.vimeo.com/video/')) {
      // Remover parámetros existentes
      urlModificada = urlModificada.replace(/[&?]autoplay=[01]/g, '');
      
      // Añadir el parámetro correcto
      const tieneSeparador = urlModificada.includes('?') ? '&' : '?';
      urlModificada = `${urlModificada}${tieneSeparador}autoplay=${autoPlay ? '1' : '0'}&muted=${muted ? '1' : '0'}`;
    }
    
    return urlModificada;
  };

  // Iniciar la reproducción cuando se hace clic en el overlay
  const handlePlay = (e: React.MouseEvent) => {
    // Detener la propagación si se solicita
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setPlaying(true);
    
    if (isLocalVideo && videoRef.current) {
      videoRef.current.play();
    } else if (iframeRef.current) {
      // Modificar URL para activar autoplay
      let playUrl = src;
      
      if (src.includes('youtube.com/embed/')) {
        // Eliminar autoplay existente si hay
        playUrl = playUrl.replace(/[&?]autoplay=[01]/g, '');
        // Añadir autoplay=1
        playUrl = playUrl.includes('?') 
          ? `${playUrl}&autoplay=1` 
          : `${playUrl}?autoplay=1`;
      } else if (src.includes('player.vimeo.com/video/')) {
        // Eliminar autoplay existente si hay
        playUrl = playUrl.replace(/[&?]autoplay=[01]/g, '');
        // Añadir autoplay=1
        playUrl = playUrl.includes('?') 
          ? `${playUrl}&autoplay=1` 
          : `${playUrl}?autoplay=1`;
      }
      
      iframeRef.current.src = playUrl;
    }
  };
  
  // Para interceptar clics en el iframe
  const handleContainerClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Para videos locales
  if (isLocalVideo) {
    return (
      <div className={`relative w-full ${className}`} onClick={handleContainerClick}>
        <video
          ref={videoRef}
          className={`w-full rounded-lg`}
          autoPlay={autoPlay}
          controls={controls}
          loop={loop}
          muted={muted}
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
        >
          <source src={src} type="video/mp4" />
          Tu navegador no soporta la reproducción de videos.
        </video>
        
        {!playing && !autoPlay && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer hover:bg-opacity-40 transition-all"
            onClick={handlePlay}
          >
            <div className="rounded-full bg-green-600 bg-opacity-80 p-4 transform hover:scale-110 transition-transform">
              <FaPlayCircle className="text-white text-4xl" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Para videos de servicios externos (YouTube, Vimeo, etc.)
  // Asume que 'src' es una URL de iframe embebido
  const urlSegura = prepararURLExterna(src);
  
  return (
    <div className={`relative w-full ${className}`}>
      {!urlSegura ? (
        <div className="aspect-video bg-black flex items-center justify-center">
          <div className="text-center p-8">
            <FaLock className="text-6xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Contenido Premium</h2>
            <p className="text-green-400">Adquiere este curso para acceder al contenido completo</p>
          </div>
        </div>
      ) : (
        <iframe
          src={urlSegura}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
}