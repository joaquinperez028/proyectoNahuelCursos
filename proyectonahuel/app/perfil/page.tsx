'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useProfileData } from '@/hooks/useProfileData';
import CourseProgressCard from '@/components/CourseProgressCard';
import CertificateCard from '@/components/CertificateCard';

// Lazy loading para componentes pesados
import { lazy, Suspense } from 'react';
const PurchaseHistory = lazy(() => import('@/components/PurchaseHistory'));
const UserStats = lazy(() => import('@/components/UserStats'));
const AdminPanel = lazy(() => import('@/components/AdminPanel'));

// Tipo para los datos de progreso de curso
type CourseProgress = {
  id: string;
  title: string;
  progress: number;
  startDate: string;
  lastUpdate: string;
  thumbnailUrl?: string;
};

// Tipo para certificados
type Certificate = {
  id: string;
  courseTitle: string;
  issueDate: string;
  certificateUrl?: string;
};

// Tipo para compras
type Purchase = {
  id: string;
  courseTitle: string;
  date: string;
  paymentMethod: string;
  amount: number;
  invoiceUrl?: string;
};

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const { data: profileData, loading, error, isFromCache, clearCacheAndReload } = useProfileData();
  const [activeTab, setActiveTab] = useState('informacion');
  const [muxStatus, setMuxStatus] = useState({
    loading: false,
    result: null as any,
    error: null as string | null
  });

  // Memoizar stats para evitar recálculos
  const memoizedStats = useMemo(() => {
    if (!profileData) return { totalCourses: 0, completedCourses: 0, certificatesEarned: 0, totalHoursLearned: 0 };
    return profileData.stats;
  }, [profileData?.stats]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handleDownloadCertificate = (certificateId: string) => {
    const certificate = profileData?.certificates.find(cert => cert.id === certificateId);
    if (certificate?.certificateUrl) {
      window.open(certificate.certificateUrl, '_blank');
    } else {
      alert('Error: No se pudo encontrar la URL del certificado.');
    }
  };

  const verificarMux = async () => {
    setMuxStatus({ loading: true, result: null, error: null });
    try {
      const response = await fetch('/api/mux-test');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al verificar MUX');
      setMuxStatus({ loading: false, result: data, error: null });
    } catch (error) {
      setMuxStatus({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // Estados de carga
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1E1E2F]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="text-white mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1E1E2F]">
        <div className="text-center">
          <p className="text-white text-xl">Debes iniciar sesión para ver tu perfil</p>
          <a href="/login" className="mt-4 px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200 inline-block">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1E1E2F]">
        <div className="text-center">
          <p className="text-red-400 text-xl">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Skeleton while loading (only if no cached data)
  if (loading) {
    return (
      <div className="py-10 min-h-screen bg-[#1E1E2F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-pulse">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-[#3A3A4C] rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-[#3A3A4C] rounded mb-4 w-1/3"></div>
                <div className="h-4 bg-[#3A3A4C] rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-[#3A3A4C] rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="py-10 min-h-screen bg-[#1E1E2F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        {/* Header del perfil */}
        <div className="bg-[#2A2A3C] rounded-t-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#3A3A4C] flex-shrink-0 transform transition-transform duration-300 hover:scale-105">
              {profileData.user.image ? (
                <Image
                  src={profileData.user.image}
                  alt={profileData.user.name || 'Usuario'}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 768px) 96px, 128px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#B4B4C0] text-4xl">
                  {profileData.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white animate-in slide-in-from-left duration-500">{profileData.user.name}</h1>
              <p className="text-[#B4B4C0] mb-2 animate-in slide-in-from-left duration-500 delay-100">{profileData.user.email}</p>
              
              <div className="flex flex-wrap gap-4 mt-3 animate-in slide-in-from-left duration-500 delay-200">
                <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  profileData.user.role === 'admin' 
                    ? 'bg-yellow-500 bg-opacity-20 text-yellow-300 hover:bg-opacity-30 border border-yellow-500 border-opacity-30' 
                    : 'bg-blue-500 bg-opacity-20 text-blue-400 hover:bg-opacity-30'
                }`}>
                  {profileData.user.role === 'admin' ? '👑 Administrador' : '🎓 Estudiante'}
                </span>
                
                <div className="flex items-center text-sm text-[#B4B4C0] hover:text-white transition-colors duration-200">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Registro: {formatDate(profileData.user.registrationDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="mt-6">
          <Suspense fallback={<div className="bg-[#2A2A3C] rounded-lg p-6 animate-pulse h-32"></div>}>
            <UserStats 
              totalCourses={memoizedStats.totalCourses}
              completedCourses={memoizedStats.completedCourses}
              certificatesEarned={memoizedStats.certificatesEarned}
            />
          </Suspense>
        </div>
        
        {/* Tabs súper rápidos */}
        <div className="mt-8 border-b border-[#3A3A4C]">
          <nav className="flex -mb-px">
            {[
              { id: 'informacion', label: 'Información Personal', icon: '👤' },
              { id: 'cursos', label: 'Cursos Activos', icon: '📚' },
              { id: 'certificados', label: 'Certificados', icon: '🏆' },
              { id: 'compras', label: 'Historial de Compras', icon: '🛒' },
              ...(profileData.user.role === 'admin' ? [{ id: 'admin', label: 'Panel Admin', icon: '⚙️' }] : [])
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#4CAF50] text-white bg-[#4CAF50] bg-opacity-20 hover:bg-opacity-30'
                    : 'text-[#B4B4C0] hover:text-white border-b-2 border-transparent hover:border-[#8A8A9A] hover:scale-105 transform'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Contenido de tabs con transiciones súper rápidas */}
        <div className="py-6">
          <div className="animate-in slide-in-from-bottom duration-200">
            {activeTab === 'informacion' && (
              <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom duration-300">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-2">👤</span>
                  Información Personal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre', value: profileData.user.name },
                    { label: 'Email', value: profileData.user.email },
                    { label: 'Rol', value: profileData.user.role === 'admin' ? 'Administrador' : 'Estudiante' },
                    { label: 'Fecha de registro', value: formatDate(profileData.user.registrationDate) }
                  ].map((field, index) => (
                    <div key={field.label} className="animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                      <label className="block text-sm font-medium text-[#B4B4C0] mb-1">{field.label}</label>
                      <input 
                        value={field.value} 
                        readOnly 
                        className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white transition-all duration-200 hover:border-[#4CAF50] focus:border-[#4CAF50] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cursos' && (
              <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom duration-300">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-2">📚</span>
                  Cursos Activos ({profileData.activeCourses.length})
                </h2>
                <div className="space-y-4">
                  {profileData.activeCourses.length > 0 ? (
                    profileData.activeCourses.map((course, index) => (
                      <div 
                        key={course.id} 
                        className="animate-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CourseProgressCard {...course} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 animate-in fade-in duration-500">
                      <div className="w-20 h-20 mx-auto mb-4 bg-[#3A3A4C] rounded-full flex items-center justify-center text-4xl">
                        📚
                      </div>
                      <p className="text-[#B4B4C0] text-lg">No tienes cursos activos</p>
                      <a href="/cursos" className="mt-4 px-6 py-3 bg-[#4CAF50] text-white rounded-md inline-block transition-all duration-200 hover:bg-[#45a049] hover:scale-105 transform">
                        🚀 Explorar Cursos
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'certificados' && (
              <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom duration-300">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-2">🏆</span>
                  Certificados ({profileData.certificates.length})
                </h2>
                <div className="space-y-4">
                  {profileData.certificates.length > 0 ? (
                    profileData.certificates.map((cert, index) => (
                      <div 
                        key={cert.id} 
                        className="animate-in slide-in-from-right duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CertificateCard 
                          {...cert} 
                          onDownload={handleDownloadCertificate} 
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 animate-in fade-in duration-500">
                      <div className="w-20 h-20 mx-auto mb-4 bg-[#3A3A4C] rounded-full flex items-center justify-center text-4xl">
                        🏆
                      </div>
                      <p className="text-[#B4B4C0]">Aún no has obtenido certificados</p>
                      <p className="text-[#8A8A9A] text-sm mt-1">Completa tus cursos para desbloquear certificados</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'compras' && (
              <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom duration-300">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-2">🛒</span>
                  Historial de Compras
                </h2>
                <Suspense fallback={
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-[#3A3A4C] h-20 rounded-lg"></div>
                    ))}
                  </div>
                }>
                  <PurchaseHistory purchases={profileData.purchases} />
                </Suspense>
              </div>
            )}

            {activeTab === 'admin' && profileData.user.role === 'admin' && (
              <div className="animate-in fade-in slide-in-from-bottom duration-300">
                <Suspense fallback={
                  <div className="bg-[#2A2A3C] rounded-lg p-6 animate-pulse">
                    <div className="h-8 bg-[#3A3A4C] rounded mb-6 w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-[#3A3A4C] rounded"></div>
                      ))}
                    </div>
                  </div>
                }>
                  <AdminPanel
                    {...profileData.adminStats}
                    onCheckMuxConnection={verificarMux}
                    isMuxLoading={muxStatus.loading}
                    muxStatus={muxStatus}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 