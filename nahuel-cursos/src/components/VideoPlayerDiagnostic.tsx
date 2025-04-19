'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSync, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface VideoPlayerDiagnosticProps {
  videoId: string;
}

/**
 * Componente de diagnóstico para resolver problemas con videos
 * Permite identificar y solucionar problemas con la reproducción de videos
 */
export default function VideoPlayerDiagnostic({ videoId }: VideoPlayerDiagnosticProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/diagnose/video?id=${videoId}`);
      setDiagnosticInfo(response.data);
    } catch (err: any) {
      console.error('Error en diagnóstico:', err);
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      runDiagnostic();
    }
  }, [videoId]);

  // Si no hay ID de video, no mostrar nada
  if (!videoId) return null;

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md p-3 text-sm mb-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <FaInfoCircle className="mr-2 text-blue-500" />
          Diagnóstico de Video
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          {expanded ? 'Ocultar detalles' : 'Mostrar detalles'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center text-gray-600">
              <FaSync className="animate-spin mr-2" /> 
              Analizando video...
            </div>
          ) : error ? (
            <div className="text-red-600 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              {error}
            </div>
          ) : diagnosticInfo ? (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-gray-500">ID de Video:</div>
                <div className="font-mono text-xs bg-gray-200 p-1 rounded overflow-x-auto">
                  {diagnosticInfo.id}
                </div>
              </div>

              {Object.entries(diagnosticInfo.results).map(([collection, data]: [string, any]) => (
                <div key={collection} className="mb-3">
                  <h4 className="font-semibold">{collection}:</h4>
                  {data ? (
                    <pre className="bg-gray-800 text-white p-2 rounded text-xs overflow-x-auto mt-1">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-red-500 text-xs">No encontrado</p>
                  )}
                </div>
              ))}

              <div className="mt-2">
                <button
                  onClick={runDiagnostic}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                >
                  Actualizar diagnóstico
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No hay información disponible</p>
          )}
        </div>
      )}
    </div>
  );
} 