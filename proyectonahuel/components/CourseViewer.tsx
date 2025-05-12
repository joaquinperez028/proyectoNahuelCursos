'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import FallbackVideoPlayer from './FallbackVideoPlayer';

interface CourseViewerProps {
  playbackId: string;
  token?: string;
}

const CourseViewer = ({ playbackId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useToken, setUseToken] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Limpiar error al cambiar el playbackId
    setError(null);
    setAttempts(0);
    setUseFallback(false);
  }, [playbackId]);

  // Reintentar automáticamente una vez si hay error
  useEffect(() => {
    if (error && attempts < 1) {
      const timer = setTimeout(() => {
        setError(null);
        setAttempts(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error, attempts]);

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
  
  // Manejo de errores
  const handleError = (event: any) => {
    console.error('Error en el reproductor MUX:', event);
    const errorDetails = event.detail?.sourceError?.message || 'Error desconocido';
    setDebugInfo(`PlaybackID: ${playbackId} | Error: ${errorDetails}`);
    setError('Error al cargar el video. Intente con opciones alternativas.');
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
    <div className="w-full">
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
            
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button 
                onClick={() => setError(null)} 
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center shadow-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reintentar
              </button>
              
              <button 
                onClick={switchToFallback} 
                className="px-4 py-2 bg-[var(--secondary)] text-white text-sm rounded-lg hover:bg-[var(--secondary-dark)] transition-colors flex items-center shadow-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Usar reproductor alternativo
              </button>
              
              <a 
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors flex items-center shadow-md"
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
        <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden shadow-lg">
          <MuxPlayer
            playbackId={playbackId}
            tokens={undefined}
            metadata={{
              video_title: 'Video del curso',
              viewer_user_id: 'usuario',
            }}
            streamType="on-demand"
            style={{ height: '100%', width: '100%' }}
            className="aspect-video"
            thumbnailTime={0}
            autoPlay={false}
            muted={false}
            onError={handleError}
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
      )}
    </div>
  );
};

export default CourseViewer; 