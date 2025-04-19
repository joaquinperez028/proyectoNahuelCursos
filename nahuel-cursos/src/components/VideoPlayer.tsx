'use client';

import { useRef, useEffect, useState } from 'react';
import { FaPlayCircle, FaLock, FaSpinner, FaExclamationTriangle, FaCode, FaBug } from 'react-icons/fa';
import useVideoUrl from '@/lib/hooks/useVideoUrl';

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
  const [isYouTube, setIsYouTube] = useState(false);
  const [isVimeo, setIsVimeo] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeFallback, setIframeFallback] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Procesar la URL del video utilizando nuestro hook
  const videoUrl = useVideoUrl(src);

  useEffect(() => {
    // Reset states
    setError(null);
    setLoading(true);
    setIsLocalVideo(false);
    setIsGridFSVideo(false);
    setIsYouTube(false);
    setIsVimeo(false);
    setIframeFallback(false);
    
    // Determina el tipo de video
    const isLocalPath = videoUrl.startsWith('/uploads/') || videoUrl.startsWith('./uploads/');
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
    
    // Verificar si las URLs son accesibles
    if (isLocalPath || isGridFSPath) {
      setLoading(true);
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error('Error al verificar el video:', response.status);
            setError(`Error al cargar el video (${response.status})`);
            // Si es un error 404 y parece una URL de GridFS, intentar como iframe por si es un enlace externo
            if (response.status === 404 && isGridFSPath) {
              console.log('Intentando como iframe después de error 404');
              setIframeFallback(true);
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al verificar el video:', err);
          setError('Error al cargar el video');
          // Intentar como iframe si falla la verificación
          if (isGridFSPath) {
            console.log('Intentando como iframe después de error de conexión');
            setIframeFallback(true);
          }
          setLoading(false);
        });
    } else {
      // Para videos externos no necesitamos verificar
      setLoading(false);
    }
  }, [videoUrl, src]);

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
        // Intentar como iframe si falla la reproducción
        setIframeFallback(true);
      });
    } else if (iframeRef.current) {
      // Modificar URL para activar autoplay
      let playUrl = videoUrl;
      
      if (isYouTube) {
        // Extraer el ID y añadir autoplay
        const videoId = videoUrl.includes('/embed/') 
          ? videoUrl.split('/embed/')[1]?.split('?')[0]
          : videoUrl.includes('v=')
            ? videoUrl.split('v=')[1]?.split('&')[0]
            : '';
            
        if (videoId) {
          playUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? '1' : '0'}`;
        }
      } else if (isVimeo) {
        // Extraer el ID y añadir autoplay
        const videoId = videoUrl.includes('/video/') 
          ? videoUrl.split('/video/')[1]?.split('?')[0]
          : videoUrl.split('vimeo.com/')[1]?.split('?')[0];
            
        if (videoId) {
          playUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=${muted ? '1' : '0'}`;
        }
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
  
  // Para mostrar información de depuración
  const toggleDebugInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDebugInfo(!showDebugInfo);
  };
  
  // Información de depuración
  const renderDebugInfo = () => {
    return (
      <div className="absolute top-0 right-0 bg-black bg-opacity-80 text-white p-3 text-xs rounded-bl-lg max-w-xs overflow-auto max-h-40">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold">Debug Info</h4>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDebugInfo(false);
            }}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1">
          <p><span className="text-gray-400">Original URL:</span> {src}</p>
          <p><span className="text-gray-400">Processed URL:</span> {videoUrl}</p>
          <p>
            <span className="text-gray-400">Type:</span> 
            {isLocalVideo ? 'Local' : ''}
            {isGridFSVideo ? 'GridFS' : ''}
            {isYouTube ? 'YouTube' : ''}
            {isVimeo ? 'Vimeo' : ''}
            {!isLocalVideo && !isGridFSVideo && !isYouTube && !isVimeo ? 'Unknown' : ''}
            {iframeFallback ? ' (Fallback)' : ''}
          </p>
          <p><span className="text-gray-400">Status:</span> {error ? 'Error' : loading ? 'Loading' : playing ? 'Playing' : 'Ready'}</p>
          {error && <p><span className="text-red-400">Error:</span> {error}</p>}
        </div>
      </div>
    );
  };

  // Si es un enlace externo de YouTube o Vimeo
  if (isYouTube || isVimeo || iframeFallback) {
    const urlSegura = prepararURLExterna(videoUrl);
    
    return (
      <div className={`relative w-full ${className}`} onClick={handleContainerClick}>
        {loading ? (
          <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
            <span className="ml-2 text-white">Cargando video...</span>
          </div>
        ) : !urlSegura ? (
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
            className="w-full aspect-video rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
        
        {/* Botón de depuración */}
        <button 
          onClick={toggleDebugInfo} 
          className="absolute bottom-2 right-2 p-1 bg-black bg-opacity-50 rounded text-white text-xs hover:bg-opacity-70 z-10"
          title="Mostrar información de depuración"
        >
          <FaBug className="text-xl" />
        </button>
        
        {/* Panel de información de depuración */}
        {showDebugInfo && renderDebugInfo()}
      </div>
    );
  }

  // Para videos locales o GridFS
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
            <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
            <div className="text-red-500 text-xl mb-2">Error al cargar el video</div>
            <div className="text-white text-sm">{error}</div>
            <div className="mt-4 flex gap-2 justify-center">
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
              <button 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={() => setIframeFallback(true)}
              >
                Intentar como video externo
              </button>
              <button 
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={toggleDebugInfo}
              >
                <FaCode className="inline-block mr-1" />
                Analizar URL
              </button>
            </div>
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
              // Intentar como iframe si falla la reproducción
              if (isGridFSVideo) {
                console.log('Error de reproducción, intentando como iframe');
                setIframeFallback(true);
              }
            }}
          >
            <source src={videoUrl} type="video/mp4" />
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
      
      {/* Botón de depuración */}
      <button 
        onClick={toggleDebugInfo} 
        className="absolute bottom-2 right-2 p-1 bg-black bg-opacity-50 rounded text-white text-xs hover:bg-opacity-70 z-10"
        title="Mostrar información de depuración"
      >
        <FaBug className="text-xl" />
      </button>
      
      {/* Panel de información de depuración */}
      {showDebugInfo && renderDebugInfo()}
    </div>
  );
}