'use client';
import { useEffect, useState } from 'react';

export function EstadoVideoMux({ uploadId, onReady }: { uploadId: string, onReady?: (playbackId: string) => void }) {
  const [estado, setEstado] = useState('procesando');
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadId) return;

    const interval = setInterval(async () => {
      const res = await fetch('/api/mux/upload-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });
      const data = await res.json();

      if (data.status === 'ready' && data.playbackId) {
        setPlaybackId(data.playbackId);
        setEstado('listo');
        clearInterval(interval);
        if (onReady) onReady(data.playbackId);
      } else {
        setEstado(data.status);
      }
    }, 5000); // consulta cada 5 segundos

    return () => clearInterval(interval);
  }, [uploadId, onReady]);

  if (playbackId) {
    return (
      <div>
        <p className="text-green-700">¡Video listo para ver!</p>
        <video
          controls
          width={500}
          src={`https://stream.mux.com/${playbackId}.m3u8`}
        />
      </div>
    );
  }

  return <p>Estado del video: {estado}</p>;
}