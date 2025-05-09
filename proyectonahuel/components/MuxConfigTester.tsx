'use client';

import { useState } from 'react';

export default function MuxConfigTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testConfig = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/mux-test', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: '¡Conexión exitosa a Mux!',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: 'Error al conectar con Mux',
          details: data
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al realizar la prueba',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Comprobar configuración de Mux</h2>
      
      <button
        onClick={testConfig}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Comprobando...' : 'Verificar conexión a Mux'}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          
          {result.details && (
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium">Ver detalles</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Si hay problemas con la reproducción de videos:</p>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Verifica que las credenciales de Mux estén configuradas correctamente en tu archivo .env.local</li>
          <li>Asegúrate de que el PlaybackID sea válido y que el video exista en tu cuenta de Mux</li>
          <li>Si usas tokens de reproducción, valida que la clave de firma sea correcta</li>
          <li>Prueba con el reproductor alternativo que usa la URL directa (HLS)</li>
        </ol>
      </div>
    </div>
  );
} 