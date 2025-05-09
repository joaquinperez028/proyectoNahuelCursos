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
    setError('Error al cargar el video. Intente de nuevo más tarde.');
  };

  return (
    <div className="w-full">
      {error ? (
        <div className="aspect-video bg-gray-200 w-full flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <MuxPlayer
          playbackId={playbackId}
          tokens={token ? { playback: token } : undefined}
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
        />
      )}
    </div>
  );
};

export default CourseViewer; 