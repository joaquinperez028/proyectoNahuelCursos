'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface CourseViewerProps {
  playbackId: string;
  token?: string;
}

const CourseViewer = ({ playbackId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useToken, setUseToken] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-200 w-full flex items-center justify-center">
        <p className="text-gray-500">Cargando reproductor...</p>
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
  
  // Cambiar entre modos con token/sin token
  const toggleTokenMode = () => {
    setUseToken(!useToken);
    setError(null);
  };
  
  // URL directa para pruebas
  const directUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  return (
    <div className="w-full">
      {error ? (
        <div className="aspect-video bg-gray-100 w-full flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            {debugInfo && (
              <code className="block bg-gray-800 text-white text-xs p-2 rounded mb-3 max-w-full overflow-auto">
                {debugInfo}
              </code>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button 
                onClick={() => setError(null)} 
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
              
              <button 
                onClick={toggleTokenMode} 
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Intentar {useToken ? 'sin token' : 'con token'}
              </button>
              
              <a 
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 text-center"
              >
                Abrir URL directa
              </a>
            </div>
          </div>
        </div>
      ) : (
        <MuxPlayer
          playbackId={playbackId}
          tokens={useToken && token ? { playback: token } : undefined}
          metadata={{
            video_title: 'Video del curso',
            viewer_user_id: 'usuario',
          }}
          streamType="on-demand"
          style={{ height: '100%', maxWidth: '100%' }}
          className="aspect-video"
          thumbnailTime={0}
          autoPlay={false}
          muted={false}
          onError={handleError}
          debug={true}
        />
      )}
    </div>
  );
};

export default CourseViewer; 