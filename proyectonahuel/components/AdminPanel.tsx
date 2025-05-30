import { useState } from 'react';
import Link from 'next/link';

type AdminPanelProps = {
  totalUsers: number;
  totalCourses: number;
  totalSales: number;
  monthlySales: number;
  onCheckMuxConnection: () => Promise<void>;
  isMuxLoading: boolean;
  muxStatus: any;
};

export default function AdminPanel({
  totalUsers,
  totalCourses,
  totalSales,
  monthlySales,
  onCheckMuxConnection,
  isMuxLoading,
  muxStatus
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('resumen');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="bg-[#2A2A3C] rounded-lg shadow-lg overflow-hidden">
      <div className="border-b border-[#3A3A4C]">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'resumen'
                ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('herramientas')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'herramientas'
                ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
            }`}
          >
            Herramientas
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'resumen' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#1E1E2F] p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-500 bg-opacity-20 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#B4B4C0]">Usuarios Totales</p>
                    <h3 className="text-2xl font-bold text-white">{totalUsers}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E1E2F] p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-500 bg-opacity-20 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#B4B4C0]">Cursos Totales</p>
                    <h3 className="text-2xl font-bold text-white">{totalCourses}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E1E2F] p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-500 bg-opacity-20 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#B4B4C0]">Ventas Totales</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(totalSales)}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E1E2F] p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H5v2h14V4zM6 19v2h12v-2H6zm8-12V5h-4v2H6l1 1v9l1 1h8l1-1V8l1-1h-4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#B4B4C0]">Ventas del Mes</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(monthlySales)}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/admin/cursos/nuevo"
                  className="flex items-center justify-center px-4 py-3 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo Curso
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="flex items-center justify-center px-4 py-3 bg-[#007bff] hover:bg-[#0069d9] text-white rounded-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Gestionar Usuarios
                </Link>
                <Link
                  href="/admin/packs"
                  className="flex items-center justify-center px-4 py-3 bg-[#ff9800] hover:bg-[#f57c00] text-white rounded-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
                  </svg>
                  Gestionar Packs
                </Link>
                <Link
                  href="/admin/reportes"
                  className="flex items-center justify-center px-4 py-3 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white rounded-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ver Reportes
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'herramientas' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Herramientas de Video</h3>
                <div className="space-y-3">
                  {/* <button
                    onClick={onCheckMuxConnection}
                    disabled={isMuxLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#007bff] hover:bg-[#0069d9] text-white rounded-md transition-colors duration-200 disabled:bg-blue-400"
                  >
                    {isMuxLoading ? (
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    Verificar Conexión con MUX
                  </button>
                  
                  <Link
                    href="/admin/actualizar-playback"
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualizar IDs de Videos
                  </Link> */}
                  <Link
                    href="/admin/herramientas-mux"
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Borrar videos de MUX
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Herramientas de Contenido</h3>
                <div className="space-y-3">
                  <Link
                    href="/admin/cursos"
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Gestionar Cursos
                  </Link>
                  
                  <Link
                    href="/admin/transferencias"
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#007bff] hover:bg-[#0069d9] text-white rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Gestionar Transferencias
                  </Link>
                  
                  <Link
                    href="/admin/reviews"
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#ff9800] hover:bg-[#f57c00] text-white rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Moderar Reseñas
                  </Link>
                </div>
              </div>
            </div>
            
            {muxStatus?.error && (
              <div className="mt-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-md">
                <p className="text-red-700">Error: {muxStatus.error}</p>
              </div>
            )}
            
            {muxStatus?.result && (
              <div className="mt-6 p-4 bg-green-100 border-l-4 border-green-500 rounded-md">
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
        )}
      </div>
    </div>
  );
} 