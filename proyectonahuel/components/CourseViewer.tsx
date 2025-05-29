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
  const playerRef = useRef<any>(null);
  const progressSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Cargar progreso inicial cuando el componente se monta
    loadInitialProgress();
  }, [courseId, videoId]);

  // Función para cargar el progreso inicial del video
  const loadInitialProgress = async () => {
    console.log('📥 Cargando progreso inicial para:', { courseId, videoId });
    
    try {
      const response = await fetch(`/api/progress/video?courseId=${courseId}&videoId=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Progreso inicial recibido:', data);
        
        if (data.success && data.progress) {
          setLastPosition(data.progress.lastPosition || 0);
          setProgress(data.progress.watchedSeconds || 0);
          console.log('✅ Progreso inicial establecido:', {
            lastPosition: data.progress.lastPosition,
            watchedSeconds: data.progress.watchedSeconds
          });
        }
      } else {
        console.warn('⚠️ No se pudo cargar progreso inicial:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar progreso inicial:', error);
    }
  };

  // Función para actualizar el progreso en el servidor
  const updateProgress = async (currentTime: number, videoDuration: number, completed: boolean = false) => {
    console.log('🔄 Actualizando progreso:', {
      courseId,
      videoId,
      currentTime,
      videoDuration,
      completed
    });
    
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
      console.log('📊 Respuesta del servidor:', response.status, data);
      
      if (!response.ok) {
        console.error('❌ Error al actualizar progreso:', data);
      } else {
        console.log('✅ Progreso actualizado exitosamente:', data);
        
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
    if (progressSaveTimeout.current) {
      clearTimeout(progressSaveTimeout.current);
    }

    progressSaveTimeout.current = setTimeout(() => {
      updateProgress(currentTime, videoDuration);
    }, 2000); // Guardar cada 2 segundos
  };

  // Manejar eventos del reproductor MUX
  const handleLoadedMetadata = () => {
    const player = playerRef.current;
    console.log('📹 Video metadata cargado');
    
    if (player && lastPosition > 0) {
      // Restaurar la posición anterior si existe
      player.currentTime = lastPosition;
      console.log('⏩ Restaurando posición anterior:', lastPosition);
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

      // Solo imprimir log cada 10 segundos para no saturar
      if (Math.floor(currentTime) % 10 === 0) {
        console.log('⏱️ Progreso del video:', {
          currentTime: Math.floor(currentTime),
          duration: Math.floor(videoDuration),
          percentage: Math.round((currentTime / videoDuration) * 100)
        });
      }

      // Guardar progreso cada cierto tiempo
      if (videoDuration > 0) {
        saveProgressWithDebounce(currentTime, videoDuration);
      }
    }
  };

  const handleEnded = () => {
    const player = playerRef.current;
    console.log('🎬 Video terminado');
    
    if (player) {
      const videoDuration = player.duration;
      console.log('✅ Marcando video como completado:', videoDuration);
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

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

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
      
      {/* Barra de progreso */}
      {duration > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[var(--neutral-400)]">
            <span>Progreso del video</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-[var(--neutral-800)] rounded-full h-2">
            <div 
              className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-[var(--neutral-500)]">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
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