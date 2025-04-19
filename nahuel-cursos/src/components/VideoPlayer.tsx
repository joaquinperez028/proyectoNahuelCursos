'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FaPlayCircle, FaLock, FaSpinner, FaExclamationTriangle, FaCode, FaBug, FaYoutube, FaSync, FaPlay } from 'react-icons/fa';
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
  const [isLocalVideo, setIsLocalVideo] = useState(false);
  const [isGridFSVideo, setIsGridFSVideo] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isVimeo, setIsVimeo] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeFallback, setIframeFallback] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // Procesar la URL del video utilizando nuestro hook
  const videoUrl = useVideoUrl(src);

  // Verificamos si es un formato de video que el navegador puede reproducir
  const isPlayableVideoFormat = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.mp4') || 
           lowerUrl.endsWith('.webm') || 
           lowerUrl.endsWith('.ogg') || 
           lowerUrl.endsWith('.mov');
  };
  
  // Método para usar fallback a YouTube cuando todo lo demás falla
  const useFallbackVideo = () => {
    if (fallbackToYoutube) {
      console.log('VideoPlayer - Usando video de fallback de YouTube');
      setIframeFallback(true);
      setIsYouTube(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Reset states
    setError(null);
    setLoading(true);
    setIsLocalVideo(false);
    setIsGridFSVideo(false);
    setIsYouTube(false);
    setIsVimeo(false);
    setIframeFallback(false);
    setAttemptCount(prev => prev + 1);
    
    // Determina el tipo de video
    const isLocalPath = videoUrl.startsWith('/uploads/') || 
                        videoUrl.startsWith('./uploads/') || 
                        isPlayableVideoFormat(videoUrl);
    const isGridFSPath = videoUrl && videoUrl.startsWith('/api/videos/');
    const isYoutubePath = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
    const isVimeoPath = videoUrl && videoUrl.includes('vimeo.com');
    
    console.log('VideoPlayer - URL procesada:', videoUrl);
    console.log('VideoPlayer - URL original:', src);
    console.log('VideoPlayer - Tipo de video: ', { 
      isLocalPath, 
      isGridFSPath,
      isYoutubePath,
      isVimeoPath
    });
    
    setIsLocalVideo(isLocalPath);
    setIsGridFSVideo(isGridFSPath);
    setIsYouTube(isYoutubePath);
    setIsVimeo(isVimeoPath);
    
    // Si después de varios intentos no funciona, usar fallback
    if (attemptCount > 2) {
      useFallbackVideo();
      setLoading(false);
      return;
    }
    
    // Verificar si las URLs son accesibles
    if (isLocalPath) {
      setLoading(true);
      
      // Para archivos locales, intentamos cargar una imagen del video para ver si existe
      const img = new Image();
      img.onload = () => {
        console.log('VideoPlayer - Archivo local accesible');
        setLoading(false);
      };
      img.onerror = () => {
        console.error('VideoPlayer - Error al verificar archivo local');
        // Si no podemos cargar una imagen, aún podríamos reproducir el video
        setLoading(false);
      };
      // Intentar cargar una imagen relacionada con el video (puede no existir)
      img.src = videoUrl.replace(/\.(mp4|webm|ogg|mov)$/, '.jpg');
      
      // De todos modos, pasamos a cargar después de un tiempo razonable
      setTimeout(() => setLoading(false), 1000);
    } else if (isGridFSPath) {
      setLoading(true);
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error('Error al verificar el video:', response.status);
            setError(`Error al cargar el video (${response.status})`);
            // Si es un error 404 y parece una URL de GridFS, intentar como iframe por si es un enlace externo
            if (response.status === 404) {
              console.log('Intentando como iframe después de error 404');
              useFallbackVideo();
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al verificar el video:', err);
          setError('Error al cargar el video');
          // Intentar como iframe si falla la verificación
          useFallbackVideo();
          setLoading(false);
        });
    } else if (isYoutubePath || isVimeoPath) {
      // Para videos externos, cargar directamente
      setLoading(false);
    } else {
      // Para tipos desconocidos, intentar usar fallback
      if (!useFallbackVideo()) {
        setError('Formato de video no soportado');
      }
      setLoading(false);
    }
  }, [videoUrl, src, attemptCount]);

  // Función para manejar la reproducción
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error al intentar reproducir el video:', error);
        setError(`Error al reproducir: ${error.message}`);
        
        // Si falla la reproducción después de varios intentos, usar fallback
        if (attemptCount > 1) {
          useFallbackVideo();
        }
      });
      setPlaying(true);
    }
  };

  // Maneja clicks en el contenedor
  const handleContainerClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  // Toggle para mostrar/ocultar el panel de depuración
  const toggleDebugInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDebugInfo(!showDebugInfo);
  };

  // Renderiza el panel de información de depuración
  const renderDebugInfo = () => {
    return (
      <div className="absolute top-0 left-0 w-full bg-black bg-opacity-80 text-white p-3 z-20 overflow-auto max-h-[50vh]">
        <h3 className="font-bold mb-2 text-green-400">Información de depuración del video</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <p className="font-semibold text-gray-300">URL Original:</p>
            <code className="block bg-gray-900 p-1 rounded">{src}</code>
          </div>
          <div>
            <p className="font-semibold text-gray-300">URL Procesada:</p>
            <code className="block bg-gray-900 p-1 rounded">{videoUrl}</code>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Tipo de Video:</p>
            <ul className="list-disc list-inside">
              {isLocalVideo && <li className="text-blue-400">Video Local</li>}
              {isGridFSVideo && <li className="text-yellow-400">Video GridFS</li>}
              {isYouTube && <li className="text-red-400">YouTube</li>}
              {isVimeo && <li className="text-teal-400">Vimeo</li>}
              {iframeFallback && <li className="text-purple-400">Usando Fallback</li>}
              {!isLocalVideo && !isGridFSVideo && !isYouTube && !isVimeo && !iframeFallback && 
                <li className="text-red-500">Tipo desconocido</li>}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Estado:</p>
            <ul className="list-disc list-inside">
              {loading && <li className="text-yellow-400">Cargando</li>}
              {error && <li className="text-red-500">Error: {error}</li>}
              {playing && <li className="text-green-400">Reproduciendo</li>}
              <li>Intento #: {attemptCount}</li>
            </ul>
          </div>
          
          <div className="flex justify-between mt-2">
            <button 
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setAttemptCount(0);
                window.location.reload();
              }}
            >
              Reintentar
            </button>
            <button 
              className="bg-red-600 text-white px-2 py-1 rounded text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowDebugInfo(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Función para preparar URL con parámetros que eviten autoplay a menos que sea explícitamente solicitado
  const prepararURLExterna = (url: string): string => {
    if (!url) return '';
    
    let urlModificada = url;
    
    try {
      // Asegurar que el parámetro de autoplay se aplica según la prop autoPlay
      if (url.includes('youtube.com/embed/')) {
        // Extraer el ID del video
        const videoId = url.split('/embed/')[1]?.split('?')[0];
        if (!videoId) return url;
        
        // Construir URL con parámetros controlados
        urlModificada = `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? '1' : '0'}&mute=${muted ? '1' : '0'}&controls=${controls ? '1' : '0'}`;
      }
      // Para Vimeo
      else if (url.includes('player.vimeo.com/video/')) {
        // Extraer el ID del video
        const videoId = url.split('/video/')[1]?.split('?')[0];
        if (!videoId) return url;
        
        // Construir URL con parámetros controlados
        urlModificada = `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? '1' : '0'}&muted=${muted ? '1' : '0'}&controls=${controls ? '1' : '0'}`;
      }
    } catch (error) {
      console.error('Error al preparar URL externa:', error);
      return url; // Devolver la URL original en caso de error
    }
    
    return urlModificada;
  };

  // Renderizado del componente
  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ aspectRatio: aspectRatio || '16/9', ...style }}
      onClick={handleContainerClick}
    >
      {/* Panel de depuración */}
      {showDebugInfo && renderDebugInfo()}
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && !iframeFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-10 p-4">
          <div className="text-red-500 mb-4 font-semibold text-center">{error}</div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Botón para reintentar */}
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center"
              onClick={() => setAttemptCount(count => count + 1)}
            >
              <FaSync className="mr-1" /> Reintentar
            </button>
            
            {/* Opción para usar YouTube si está disponible */}
            {fallbackToYoutube && (
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center"
                onClick={useFallbackVideo}
              >
                <FaYoutube className="mr-1" /> Ver en YouTube
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Video nativo (para archivos locales o GridFS) */}
      {(isLocalVideo || isGridFSVideo) && !iframeFallback && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            controls={playing || controls}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline
            onCanPlay={() => {
              setLoading(false);
              if (autoPlay) {
                setPlaying(true);
              }
            }}
            onError={(e) => {
              console.error('Error en elemento video:', e);
              setError('No se pudo cargar el video. Formato no soportado o archivo corrupto.');
              if (attemptCount > 1) {
                useFallbackVideo();
              }
            }}
          />
          
          {/* Overlay para reproducir (solo si no está reproduciendo) */}
          {!playing && !controls && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer z-5 group"
              onClick={handlePlay}
            >
              <div className="w-16 h-16 bg-blue-600 bg-opacity-80 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all transform group-hover:scale-110">
                <FaPlayCircle className="text-white text-lg ml-1" />
              </div>
            </div>
          )}
        </>
      )}
      
      {/* iFrame para YouTube, Vimeo o fallbacks */}
      {(isYouTube || isVimeo || iframeFallback) && (
        <iframe
          ref={iframeRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Embedded video"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('No se pudo cargar el video desde la fuente externa.');
            console.error('Error al cargar iframe');
          }}
        />
      )}
      
      {/* Botón de depuración (solo visible en modo desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={toggleDebugInfo}
          className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-50 text-white p-1 rounded-full z-20 hover:bg-opacity-80"
          title="Mostrar/ocultar información de depuración"
        >
          <FaBug size={14} />
        </button>
      )}
    </div>
  );
}