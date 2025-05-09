'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface CourseViewerProps {
  playbackId: string;
  token: string;
}

const CourseViewer = ({ playbackId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);

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

  return (
    <div className="w-full">
      <MuxPlayer
        playbackId={playbackId}
        tokens={{ playback: token }}
        metadata={{
          video_title: 'Video del curso',
          viewer_user_id: 'usuario',
        }}
        streamType="on-demand"
        style={{ height: '100%', maxWidth: '100%' }}
        className="aspect-video"
        thumbnailTime={0}
      />
    </div>
  );
};

export default CourseViewer; 