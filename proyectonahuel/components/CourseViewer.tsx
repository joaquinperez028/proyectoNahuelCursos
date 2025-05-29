'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface CourseViewerProps {
  playbackId: string;
  videoId: string;
  courseId: string;
  token?: string;
}

const CourseViewer = ({ playbackId, videoId, courseId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--neutral-300)]">Cargando reproductor...</p>
        </div>
      </div>
    );
  }

  if (!playbackId) {
    return (
      <div className="aspect-video bg-[var(--neutral-900)] w-full flex items-center justify-center">
        <p className="text-[var(--neutral-300)]">Video no disponible</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        style={{ height: '100%', width: '100%' }}
        autoPlay={false}
        muted={false}
      />
    </div>
  );
};

export default CourseViewer; 