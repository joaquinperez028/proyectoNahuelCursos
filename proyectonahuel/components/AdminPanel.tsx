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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <button
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