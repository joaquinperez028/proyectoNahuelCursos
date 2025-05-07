'use client';
import { useEffect, useState } from 'react';

export function EstadoVideoMux({ uploadId, onReady }: { uploadId: string, onReady?: (playbackId: string) => void }) {
  const [estado, setEstado] = useState('procesando');
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadId) return;

    let intervalId: NodeJS.Timeout;
    let intentos = 0;
    const MAX_INTENTOS = 30; // Aproximadamente 2.5 minutos (30 * 5s)

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/mux/upload-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al consultar estado');
        }
        
        const data = await res.json();
        setDebugInfo(JSON.stringify(data, null, 2));
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (data.status === 'ready' && data.playbackId) {
          setPlaybackId(data.playbackId);
          setEstado('listo');
          clearInterval(intervalId);
          if (onReady) onReady(data.playbackId);
        } else {
          setEstado(data.status || 'procesando');
        }
        
        // Reiniciar contador de intentos si hay respuesta positiva
        intentos = 0;
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al consultar estado');
        intentos++;
        
        if (intentos >= MAX_INTENTOS) {
          clearInterval(intervalId);
          setEstado('error');
          setErrorMsg(`Se agotó el tiempo de espera después de ${MAX_INTENTOS} intentos. Por favor, verifica tus credenciales de Mux o inténtalo de nuevo.`);
        }
      }
    };

    // Llamar inmediatamente la primera vez
    checkStatus();
    // Luego continuar con el intervalo
    intervalId = setInterval(checkStatus, 5000);

    return () => clearInterval(intervalId);
  }, [uploadId, onReady]);

  // Mostrar información de depuración en desarrollo
  const showDebug = process.env.NODE_ENV === 'development';

  if (errorMsg) {
    return (
      <div className="p-3 bg-red-100 text-red-800 rounded">
        <p className="font-medium mb-1">Error al procesar el video:</p>
        <p>{errorMsg}</p>
        {showDebug && debugInfo && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">Información de depuración</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (playbackId) {
    return (
      <div>
        <p className="text-green-700 font-medium mb-2">✓ ¡Video listo para ver!</p>
        <video
          controls
          width={500}
          className="w-full rounded shadow-sm mb-2"
          src={`https://stream.mux.com/${playbackId}.m3u8`}
        />
        {showDebug && (
          <p className="text-xs text-gray-500 mt-1">PlaybackID: {playbackId}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Procesando video: <span className="font-medium">{estado}</span></p>
      </div>
      <p className="text-sm text-gray-600 mt-1">Esto puede tomar varios minutos dependiendo del tamaño del video.</p>
      
      {showDebug && debugInfo && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Información de depuración</summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </details>
      )}
    </div>
  );
}