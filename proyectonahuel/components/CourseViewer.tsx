'use client';

import { useEffect, useState, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface CourseViewerProps {
  playbackId: string;
  videoId: string;
  courseId: string;
  token?: string;
}

const CourseViewer = ({ playbackId, videoId, courseId, token }: CourseViewerProps) => {
  const [isClient, setIsClient] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastPosition, setLastPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const playerRef = useRef<any>(null);
  const progressSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Cargar progreso inicial cuando el componente se monta
    loadInitialProgress();
  }, [courseId, videoId]);

  // Función para cargar el progreso inicial del video
  const loadInitialProgress = async () => {
    try {
      const response = await fetch(`/api/progress/video?courseId=${courseId}&videoId=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.progress) {
          setLastPosition(data.progress.lastPosition || 0);
          setProgress(data.progress.watchedSeconds || 0);
          setIsCompleted(data.progress.completed || false);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar progreso inicial:', error);
    }
  };

  // Función para actualizar el progreso en el servidor
  const updateProgress = async (currentTime: number, videoDuration: number, completed: boolean = false) => {
    try {
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          videoId,
          position: currentTime,
          watchedSeconds: currentTime,
          completed,
          duration: videoDuration
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Actualizar estado local si se marca como completado
        if (completed) {
          setIsCompleted(true);
        }
        
        // Emitir evento personalizado para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
          detail: { courseId, videoId, progress: data.progress }
        }));
      }
    } catch (error) {
      console.error('❌ Error de red al actualizar progreso:', error);
    }
  };

  // Función para guardar progreso con debouncing
  const saveProgressWithDebounce = (currentTime: number, videoDuration: number) => {
    // No actualizar progreso si el video ya está completado
    if (isCompleted) {
      return;
    }
    
    if (progressSaveTimeout.current) {
      clearTimeout(progressSaveTimeout.current);
    }

    progressSaveTimeout.current = setTimeout(() => {
      // No sobrescribir si el video ya está completado
      // Solo actualizar la posición si no está marcado como terminado
      const isNearEnd = currentTime >= videoDuration - 5; // Últimos 5 segundos
      if (!isNearEnd) {
        updateProgress(currentTime, videoDuration, false);
      }
    }, 2000); // Guardar cada 2 segundos
  };

  // Manejar eventos del reproductor MUX
  const handleLoadedMetadata = () => {
    const player = playerRef.current;
    
    if (player && lastPosition > 0) {
      // Restaurar la posición anterior si existe
      player.currentTime = lastPosition;
    }
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (player) {
      const currentTime = player.currentTime;
      const videoDuration = player.duration;
      
      setProgress(currentTime);
      setDuration(videoDuration);
      setLastPosition(currentTime);

      // Guardar progreso cada cierto tiempo
      if (videoDuration > 0) {
        saveProgressWithDebounce(currentTime, videoDuration);
      }
    }
  };

  const handleEnded = () => {
    const player = playerRef.current;
    
    if (player && !isCompleted) {
      const videoDuration = player.duration;
      
      // Marcar como completado localmente primero
      setIsCompleted(true);
      
      // Limpiar cualquier timeout pendiente para evitar conflictos
      if (progressSaveTimeout.current) {
        clearTimeout(progressSaveTimeout.current);
        progressSaveTimeout.current = null;
      }
      
      // Marcar como completado cuando termine el video
      updateProgress(videoDuration, videoDuration, true);
    }
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (progressSaveTimeout.current) {
        clearTimeout(progressSaveTimeout.current);
      }
    };
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
    <div className="space-y-3">
      <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden">
        <MuxPlayer
          ref={playerRef}
          playbackId={playbackId}
          streamType="on-demand"
          style={{ height: '100%', width: '100%' }}
          autoPlay={false}
          muted={false}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
};

// Función helper para formatear tiempo
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default CourseViewer; 