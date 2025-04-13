'use client';

import { useRef, useEffect, useState } from 'react';
import { FaPlayCircle, FaLock, FaSpinner } from 'react-icons/fa';

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
  const [isGridFSVideo, setIsGridFSVideo] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determina si es un video local (uploads) o un video de GridFS (/api/videos/...)
    // o una URL externa (YouTube, Vimeo, etc.)
    const isLocalPath = src.startsWith('/uploads/') || src.startsWith('./uploads/');
    const isGridFSPath = src && (src.startsWith('/api/videos/') || src.includes('fileId='));
    
    setIsLocalVideo(isLocalPath);
    setIsGridFSVideo(isGridFSPath);
    
    // Si es un video GridFS, verificar que sea accesible
    if (isGridFSPath) {
      setLoading(true);
      fetch(src, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error('Error al verificar el video GridFS:', response.status);
            setError(`Error al cargar el video (${response.status})`);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al verificar el video GridFS:', err);
          setError('Error al cargar el video');
          setLoading(false);
        });
    }
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
    
    if ((isLocalVideo || isGridFSVideo) && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Error al reproducir el video:', err);
        setError('Error al reproducir el video');
      });
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

  // Para videos locales o GridFS
  if (isLocalVideo || isGridFSVideo) {
    return (
      <div className={`relative w-full ${className}`} onClick={handleContainerClick}>
        {loading ? (
          <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
            <span className="ml-2 text-white">Cargando video...</span>
          </div>
        ) : error ? (
          <div className="aspect-video bg-gray-800 flex items-center justify-center text-center p-4">
            <div>
              <div className="text-red-500 text-xl mb-2">Error al cargar el video</div>
              <div className="text-white text-sm">{error}</div>
              <button 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={`w-full rounded-lg`}
              autoPlay={autoPlay}
              controls={controls}
              loop={loop}
              muted={muted}
              onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
              onError={(e) => {
                console.error('Error en la reproducción del video:', e);
                setError('Error en la reproducción del video. Intente nuevamente.');
              }}
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
          </>
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
          ref={iframeRef}
          src={urlSegura}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
}