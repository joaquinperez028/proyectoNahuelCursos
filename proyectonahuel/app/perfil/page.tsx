'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [muxStatus, setMuxStatus] = useState<{
    loading: boolean;
    result: any | null;
    error: string | null;
  }>({
    loading: false,
    result: null,
    error: null
  });

  const verificarMux = async () => {
    setMuxStatus({
      loading: true,
      result: null,
      error: null
    });

    try {
      const response = await fetch('/api/mux-test');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar MUX');
      }
      
      setMuxStatus({
        loading: false,
        result: data,
        error: null
      });
    } catch (error) {
      setMuxStatus({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex justify-center items-center">Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Debes iniciar sesión para ver tu perfil.</div>;
  }

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Perfil de Usuario</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Información Personal</h2>
            <div className="border-t border-gray-200 pt-3">
              <p className="mb-2"><span className="font-medium">Nombre:</span> {session?.user?.name || 'No disponible'}</p>
              <p className="mb-2"><span className="font-medium">Email:</span> {session?.user?.email || 'No disponible'}</p>
              <p className="mb-2">
                <span className="font-medium">Rol:</span> 
                <span className={session?.user?.role === 'admin' ? 'text-green-600 font-semibold' : ''}> 
                  {session?.user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </p>
            </div>
          </div>
          
          {session?.user?.role === 'admin' && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Herramientas de Administrador</h2>
              
              <div className="mt-4">
                <button
                  onClick={verificarMux}
                  disabled={muxStatus.loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {muxStatus.loading ? 'Verificando...' : 'Verificar conexión con MUX'}
                </button>
                
                {muxStatus.error && (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
                    <p className="text-red-700">Error: {muxStatus.error}</p>
                  </div>
                )}
                
                {muxStatus.result && (
                  <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500">
                    <h3 className="font-semibold text-green-800 mb-2">¡Conexión exitosa!</h3>
                    <p className="mb-2">Total de assets en MUX: {muxStatus.result.totalAssets}</p>
                    
                    {muxStatus.result.assets.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-800 mt-3 mb-2">Assets recientes:</h4>
                        <ul className="pl-5 list-disc">
                          {muxStatus.result.assets.map((asset: any) => (
                            <li key={asset.id} className="mb-1">
                              <span className="font-medium">ID:</span> {asset.id}{' '}
                              <span className="font-medium ml-2">Estado:</span> {asset.status}{' '}
                              <span className="font-medium ml-2">Creado:</span> {new Date(asset.createdAt).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 