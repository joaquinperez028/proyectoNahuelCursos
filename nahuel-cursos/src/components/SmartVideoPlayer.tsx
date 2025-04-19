'use client';

import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import FragmentedVideoPlayer from './FragmentedVideoPlayer';

interface SmartVideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  stopPropagation?: boolean;
  fallbackToYoutube?: boolean;
  aspectRatio?: string;
  style?: React.CSSProperties;
}

/**
 * Componente inteligente que decide qué reproductor usar según el tipo de video
 * - Para videos fragmentados, usa FragmentedVideoPlayer
 * - Para otros videos, usa el VideoPlayer estándar
 */
export default function SmartVideoPlayer(props: SmartVideoPlayerProps) {
  const [isFragmented, setIsFragmented] = useState(false);
  const [fragmentedVideoId, setFragmentedVideoId] = useState<string | null>(null);
  
  // Detectar si el video es fragmentado
  useEffect(() => {
    const detectFragmentedVideo = () => {
      // Patrones específicos para videos fragmentados
      const isUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(props.src);
      
      const isFragmentsEndpoint = props.src.includes('/api/videos/fragmentados/');
      const isKnownFragmentedVideo = props.src.includes('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74');
      
      // Si es un video fragmentado, extraer el ID
      if (isFragmentsEndpoint || isKnownFragmentedVideo || isUUID) {
        setIsFragmented(true);
        
        // Extraer el ID del video fragmentado
        if (isFragmentsEndpoint) {
          const id = props.src.split('/api/videos/fragmentados/')[1]?.split('?')[0];
          setFragmentedVideoId(id || null);
        } else if (isKnownFragmentedVideo) {
          setFragmentedVideoId('e434907b-1bd5-4fbc-b7d9-d4e1e03b0c74');
        } else if (isUUID) {
          const match = props.src.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          setFragmentedVideoId(match ? match[1] : null);
        }
      } else {
        setIsFragmented(false);
        setFragmentedVideoId(null);
      }
    };
    
    detectFragmentedVideo();
  }, [props.src]);
  
  // Si es un video fragmentado y tenemos un ID, usar el reproductor especializado
  if (isFragmented && fragmentedVideoId) {
    return (
      <FragmentedVideoPlayer
        videoId={fragmentedVideoId}
        className={props.className}
        autoPlay={props.autoPlay}
        controls={props.controls}
        loop={props.loop}
        muted={props.muted}
        aspectRatio={props.aspectRatio}
        style={props.style}
      />
    );
  }
  
  // Para todos los demás videos, usar el reproductor estándar
  return <VideoPlayer {...props} />;
} 