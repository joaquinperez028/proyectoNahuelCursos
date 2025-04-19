'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FaPlayCircle, FaSpinner, FaSync, FaBug } from 'react-icons/fa';

interface FragmentedVideoPlayerProps {
  videoId: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  aspectRatio?: string;
  style?: React.CSSProperties;
}

/**
 * Componente especializado para reproducir videos fragmentados
 * Utiliza el endpoint específico para videos fragmentados y maneja
 * correctamente errores y recargas
 */
export default function FragmentedVideoPlayer({
  videoId,
  className = '',
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  aspectRatio = '16/9',
  style
}: FragmentedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Construir la URL del endpoint para videos fragmentados
  const videoUrl = `/api/videos/fragmentados/${videoId}`;
  
  // Función para cargar el video con timestamp para evitar caché
  const getTimestampedUrl = () => {
    return `${videoUrl}?t=${Date.now()}`;
  };
  
  // Función para verificar si el video está disponible
  const checkVideoAvailability = async () => {
    try {
      const response = await fetch(videoUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error al verificar disponibilidad del video:', error);
      return false;
    }
  };
  
  // Efecto para cargar el video
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    let timeoutId: NodeJS.Timeout;
    
    const loadVideo = async () => {
      try {
        const isAvailable = await checkVideoAvailability();
        
        if (!isAvailable) {
          console.error('Video fragmentado no disponible:', videoId);
          setError('Video fragmentado no disponible. Intenta recargar.');
          setLoading(false);
          return;
        }
        
        if (videoRef.current) {
          // Usar URL con timestamp para evitar problemas de caché
          videoRef.current.src = getTimestampedUrl();
          
          videoRef.current.oncanplay = () => {
            setLoading(false);
            if (autoPlay) {
              videoRef.current?.play().catch(e => {
                console.error('Error al reproducir automáticamente:', e);
              });
            }
          };
          
          videoRef.current.onerror = (e) => {
            console.error('Error al cargar video fragmentado:', e);
            setError('Error al cargar el video fragmentado. Intenta recargar.');
            setLoading(false);
          };
        }
      } catch (error) {
        console.error('Error al cargar el video fragmentado:', error);
        setError('Error al cargar el video.');
        setLoading(false);
      }
    };
    
    loadVideo();
    
    // Si después de 10 segundos sigue cargando, mostrar error
    timeoutId = setTimeout(() => {
      if (loading) {
        setError('Tiempo de carga excedido. Intenta recargar.');
        setLoading(false);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeoutId);
      if (videoRef.current) {
        videoRef.current.oncanplay = null;
        videoRef.current.onerror = null;
      }
    };
  }, [videoId, retryCount, autoPlay]);
  
  // Función para reintentar la carga del video
  const handleRetry = () => {
    setRetryCount(count => count + 1);
  };
  
  // Función para reproducir el video
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error al reproducir:', error);
      });
      setPlaying(true);
    }
  };
  
  // Toggle para mostrar/ocultar información de depuración
  const toggleDebugInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDebugInfo(!showDebugInfo);
  };
  
  // Renderiza el panel de debug
  const renderDebugInfo = () => {
    return (
      <div className="absolute top-0 left-0 w-full bg-black bg-opacity-80 text-white p-3 z-20 overflow-auto max-h-[50vh]">
        <h3 className="font-bold mb-2 text-orange-400">Debug: Video Fragmentado</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <p className="font-semibold text-gray-300">ID del video:</p>
            <code className="block bg-gray-900 p-1 rounded">{videoId}</code>
          </div>
          <div>
            <p className="font-semibold text-gray-300">URL procesada:</p>
            <code className="block bg-gray-900 p-1 rounded">{videoUrl}</code>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Estado:</p>
            <ul className="list-disc list-inside">
              {loading && <li className="text-yellow-400">Cargando</li>}
              {error && <li className="text-red-500">Error: {error}</li>}
              {playing && <li className="text-green-400">Reproduciendo</li>}
              <li>Intento #: {retryCount}</li>
            </ul>
          </div>
          
          <div className="flex justify-between mt-2">
            <button 
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
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
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ aspectRatio: aspectRatio, ...style }}
    >
      {/* Panel de debug */}
      {showDebugInfo && renderDebugInfo()}
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <FaSpinner className="text-4xl text-white animate-spin" />
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-10 p-4">
          <div className="text-red-500 mb-4 font-semibold text-center">{error}</div>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={handleRetry}
          >
            <FaSync className="mr-1" /> Reintentar
          </button>
        </div>
      )}
      
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
      />
      
      {/* Overlay para reproducir si no hay controles */}
      {!playing && !controls && !loading && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer z-5 group"
          onClick={handlePlay}
        >
          <div className="w-16 h-16 bg-blue-600 bg-opacity-80 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all transform group-hover:scale-110">
            <FaPlayCircle className="text-white text-2xl ml-1" />
          </div>
        </div>
      )}
      
      {/* Botón de debug */}
      <button 
        onClick={toggleDebugInfo}
        className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-50 text-white p-1 rounded-full z-20 hover:bg-opacity-80"
        title="Mostrar/ocultar información de depuración"
      >
        <FaBug size={14} />
      </button>
    </div>
  );
}