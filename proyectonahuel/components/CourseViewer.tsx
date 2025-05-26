'use client';

import { useEffect, useState, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import FallbackVideoPlayer from './FallbackVideoPlayer';

interface CourseViewerProps {
  playbackId: string;
  videoId: string; // Obligatorio pero puede ser string vacía
  courseId: string; // Obligatorio pero puede ser string vacía
  token?: string;
}

const CourseViewer = ({ playbackId, videoId, courseId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);
  const [muxStatus, setMuxStatus] = useState<'checking' | 'ready' | 'processing' | 'error'>('checking');
  
  // Referencias para control de progreso
  const playerRef = useRef<any>(null);
  const progressTrackerRef = useRef({
    lastPosition: 0,
    watchedSeconds: 0,
    duration: 0,
    progressReported: false,
    completionThreshold: 0.95, // 95% de visualización para considerar completado
    trackingInterval: null as NodeJS.Timeout | null,
    progressUpdateInterval: 15000, // Actualizar cada 15 segundos
  });

  const MAX_RETRIES = 3;

  useEffect(() => {
    setIsClient(true);
    // Resetear estados cuando cambia el playbackId
    setError(null);
    setUseFallback(false);
    setDebugInfo(null);
    setRetryCount(0);
    setVideoCompleted(false);
    setShowCompletionNotification(false);
    setMuxStatus('checking');
    
    // Limpiar intervalos de seguimiento al desmontar el componente
    return () => {
      if (progressTrackerRef.current.trackingInterval) {
        clearInterval(progressTrackerRef.current.trackingInterval);
      }
    };
  }, [playbackId]);

  // Reintentar automáticamente una vez si hay error
  useEffect(() => {
    if (error && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);
  
  // Configurar seguimiento de progreso cuando el video está listo
  const setupProgressTracking = () => {
    if (!playerRef.current) return;
    
    try {
      // Obtener la duración del video
      const duration = playerRef.current.duration || 0;
      progressTrackerRef.current.duration = duration;
      
      // Iniciar intervalo de seguimiento
      if (progressTrackerRef.current.trackingInterval) {
        clearInterval(progressTrackerRef.current.trackingInterval);
      }
      
      progressTrackerRef.current.trackingInterval = setInterval(() => {
        if (playerRef.current) {
          // Obtener posición actual
          const currentPosition = playerRef.current.currentTime || 0;
          
          // Calcular segundos vistos
          if (currentPosition > progressTrackerRef.current.lastPosition) {
            const increment = currentPosition - progressTrackerRef.current.lastPosition;
            // Solo contar si el incremento es razonable (evitar saltos)
            if (increment < 5) {
              progressTrackerRef.current.watchedSeconds += increment;
            }
          }
          
          progressTrackerRef.current.lastPosition = currentPosition;
          
          // Verificar si el video se ha completado
          if (duration > 0 && progressTrackerRef.current.watchedSeconds >= (duration * progressTrackerRef.current.completionThreshold)) {
            if (!videoCompleted) {
              setVideoCompleted(true);
              setShowCompletionNotification(true);
              reportVideoCompletion(true);
              
              // Ocultar notificación después de 5 segundos
              setTimeout(() => {
                setShowCompletionNotification(false);
              }, 5000);
            }
          } else {
            // Actualizar progreso regularmente
            if (!progressTrackerRef.current.progressReported) {
              reportVideoProgress();
              progressTrackerRef.current.progressReported = true;
              
              // Resetear el flag después del intervalo
              setTimeout(() => {
                progressTrackerRef.current.progressReported = false;
              }, progressTrackerRef.current.progressUpdateInterval);
            }
          }
        }
      }, 1000);
    } catch (e) {
      console.error('Error al configurar seguimiento de progreso:', e);
    }
  };
  
  // Reportar progreso al servidor
  const reportVideoProgress = async () => {
    try {
      if (!courseId || !videoId || courseId === '' || videoId === '') return;
      
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          videoId,
          position: progressTrackerRef.current.lastPosition,
          watchedSeconds: progressTrackerRef.current.watchedSeconds,
          completed: videoCompleted
        }),
      });
    } catch (e) {
      console.error('Error al reportar progreso:', e);
    }
  };
  
  // Reportar finalización de video
  const reportVideoCompletion = async (completed: boolean) => {
    try {
      if (!courseId || !videoId || courseId === '' || videoId === '') return;
      
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          videoId,
          position: progressTrackerRef.current.lastPosition,
          watchedSeconds: progressTrackerRef.current.watchedSeconds,
          completed
        }),
      });
      
      const data = await response.json();
      
      // Si el curso está completado, mostrar botón para generar certificado
      if (data.progress?.isCompleted) {
        // La lógica para notificar la finalización del curso está en el componente padre
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('courseCompleted', { 
            detail: { 
              courseId, 
              isCompleted: true 
            } 
          }));
        }
      }
    } catch (e) {
      console.error('Error al reportar finalización de video:', e);
    }
  };

  // Manejar eventos de video
  const handleVideoReady = () => {
    setError(null);
    setDebugInfo(null);
    setupProgressTracking();
  };
  
  const handleVideoEnded = () => {
    setVideoCompleted(true);
    reportVideoCompletion(true);
  };
  
  const handleVideoTimeUpdate = () => {
    // El seguimiento principal se hace en el intervalo
  };

  useEffect(() => {
    if (!playbackId) return;
    let cancel = false;
    setMuxStatus('checking');
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/mux-asset-status?playbackId=${playbackId}`);
        const data = await res.json();
        if (cancel) return;
        if (data.status === 'ready') {
          setMuxStatus('ready');
        } else if (data.status === 'errored' || data.status === 'error') {
          setMuxStatus('error');
        } else {
          setMuxStatus('processing');
        }
      } catch (e) {
        setMuxStatus('error');
      }
    };
    checkStatus();
    return () => { cancel = true; };
  }, [playbackId]);

  if (!isClient) {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-[var(--accent)] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[var(--neutral-300)]">Cargando reproductor...</p>
        </div>
      </div>
    );
  }

  // Verificar si el playbackId es válido
  if (!playbackId) {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <svg className="w-12 h-12 text-[var(--error)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-[var(--error)] font-medium mb-2">Error: No se proporcionó un ID de reproducción válido</p>
          <p className="text-[var(--neutral-400)] text-sm">Contacta al soporte técnico si este problema persiste.</p>
        </div>
      </div>
    );
  }
  
  if (muxStatus === 'checking' || muxStatus === 'processing') {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <svg className="w-12 h-12 text-[var(--accent)] mx-auto mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[var(--neutral-100)] font-medium mb-2">Procesando video...</p>
          <p className="text-[var(--neutral-400)] text-sm">El video está siendo procesado por MUX. Por favor, espera unos minutos y recarga la página.</p>
        </div>
      </div>
    );
  }
  
  if (muxStatus === 'error') {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <svg className="w-12 h-12 text-[var(--error)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-[var(--error)] font-medium mb-2">Error: El video no está disponible o falló el procesamiento en MUX</p>
          <p className="text-[var(--neutral-400)] text-sm">Contacta al soporte técnico si este problema persiste.</p>
        </div>
      </div>
    );
  }
  
  // Manejo de errores
  const handleError = async (event: any) => {
    console.error('Error en el reproductor MUX:', event);
    const errorDetails = event.detail?.sourceError?.message || 'Error desconocido';
    const errorType = event.detail?.sourceError?.type || '';
    setDebugInfo(`PlaybackID: ${playbackId} | Error: ${errorDetails} | Tipo: ${errorType}`);

    // Si el error es de token o acceso, intentar recargar con token nuevo
    if (errorDetails.includes('not currently active') || errorDetails.includes('not ready') || errorType === 'MediaError') {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        try {
          // Esperar un momento antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Incrementar el tiempo de espera con cada intento
          
          // Verificar estado del asset antes de reintentar
          try {
            const response = await fetch(`/api/mux-asset-status?playbackId=${playbackId}`);
            const data = await response.json();
            
            if (data.status === 'ready') {
              // Intentar recargar el reproductor
              if (playerRef.current) {
                playerRef.current.load();
              }
              return;
            } else {
              throw new Error(`Asset no está listo. Estado: ${data.status}`);
            }
          } catch (statusError) {
            console.error('Error al verificar estado del asset:', statusError);
            setError('El video no está disponible en este momento. Por favor, intente más tarde.');
          }
        } catch (retryError) {
          console.error('Error al reintentar reproducción:', retryError);
        }
      } else {
        setError('El video no está disponible en este momento. Por favor, intente más tarde.');
      }
    } else {
      setError('Error al cargar el video. Intente con opciones alternativas.');
    }
  };
  
  // Cambiar al reproductor de respaldo
  const switchToFallback = () => {
    setUseFallback(true);
    setError(null);
  };
  
  // URL directa para pruebas
  const directUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  // Si estamos en modo fallback, usar el reproductor alternativo
  if (useFallback) {
    return <FallbackVideoPlayer src={directUrl} />;
  }

  return (
    <div className="w-full relative">
      {error ? (
        <div className="aspect-video bg-[var(--neutral-900)] w-full flex flex-col items-center justify-center p-6">
          <div className="text-center mb-4 max-w-md">
            <svg className="w-12 h-12 text-[var(--warning)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p className="text-[var(--error)] font-medium mb-4">{error}</p>
            {debugInfo && (
              <div className="mb-4 overflow-hidden">
                <div className="bg-[var(--neutral-800)] text-[var(--neutral-300)] text-xs py-2 px-3 rounded-md max-w-full overflow-x-auto">
                  <code>{debugInfo}</code>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setUseFallback(false);
                  if (playerRef.current) {
                    playerRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center shadow-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reintentar
              </button>
              
              <button
                onClick={switchToFallback}
                className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center shadow-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Usar reproductor alternativo
              </button>
              
              <a 
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center shadow-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Abrir URL directa
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden shadow-lg">
            <MuxPlayer
              ref={playerRef}
              playbackId={playbackId}
              tokens={token ? { playback: token } : undefined}
              metadata={{
                video_title: 'Video del curso',
                viewer_user_id: 'usuario',
                video_id: videoId,
                course_id: courseId
              }}
              streamType="on-demand"
              style={{ height: '100%', width: '100%' }}
              className="aspect-video"
              thumbnailTime={0}
              autoPlay={false}
              muted={false}
              onError={handleError}
              onLoadedMetadata={handleVideoReady}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleVideoTimeUpdate}
              debug={true}
              defaultHiddenCaptions={true}
              playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
              themeProps={{
                keyColorInactive: "var(--accent)",
                keyColorActive: "var(--accent)",
                colorsDark: true
              }}
            />
          </div>
          
          {/* Notificación de video completado */}
          {showCompletionNotification && (
            <div className="absolute bottom-4 right-4 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in-up">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
              </svg>
              <span>¡Video completado!</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseViewer; 