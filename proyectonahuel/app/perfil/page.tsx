'use client';

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import CourseProgressCard from '@/components/CourseProgressCard';
import CertificateCard from '@/components/CertificateCard';

// Lazy loading para componentes pesados
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
  const [activeTab, setActiveTab] = useState('informacion');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  // Estado para almacenar los datos del perfil
  const [profileData, setProfileData] = useState<{
    activeCourses: CourseProgress[];
    certificates: Certificate[];
    purchases: Purchase[];
    stats: {
      totalCourses: number;
      completedCourses: number;
      certificatesEarned: number;
      totalHoursLearned: number;
    };
    adminStats: {
      totalUsers: number;
      totalCourses: number;
      totalSales: number;
      monthlySales: number;
    };
    lastLogin: string;
    registrationDate: string;
  }>({
    activeCourses: [],
    certificates: [],
    purchases: [],
    stats: {
      totalCourses: 0,
      completedCourses: 0,
      certificatesEarned: 0,
      totalHoursLearned: 0,
    },
    adminStats: {
      totalUsers: 0,
      totalCourses: 0,
      totalSales: 0,
      monthlySales: 0,
    },
    lastLogin: '',
    registrationDate: '',
  });

  const [muxStatus, setMuxStatus] = useState<{
    loading: boolean;
    result: any | null;
    error: string | null;
  }>({
    loading: false,
    result: null,
    error: null
  });

  // Memoizar datos computados para evitar recálculos
  const memoizedStats = useMemo(() => ({
    totalCourses: profileData.activeCourses.length,
    completedCourses: profileData.certificates.length,
    certificatesEarned: profileData.certificates.length,
    totalHoursLearned: Math.round(
      profileData.activeCourses.reduce((acc, course) => acc + (course.progress / 100) * 20, 0)
    )
  }), [profileData.activeCourses, profileData.certificates]);

  // Cargar datos del perfil
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfileData();
    }
  }, [status]);

  // Función optimizada para cargar datos del perfil con llamadas paralelas
  const fetchProfileData = useCallback(async () => {
    if (dataLoaded) return; // Evitar múltiples cargas
    
    setLoading(true);
    try {
      // Hacer todas las llamadas API en paralelo
      const [
        coursesResponse,
        statsResponse,
        userInfoResponse
      ] = await Promise.allSettled([
        fetch('/api/users/courses'),
        fetch('/api/stats'),
        fetch('/api/users/profile')
      ]);
      
      // Procesar cursos del usuario
      let userCourses = [];
      if (coursesResponse.status === 'fulfilled' && coursesResponse.value.ok) {
        const coursesData = await coursesResponse.value.json();
        userCourses = coursesData.courses || [];
      }
      
      // Procesar progreso de cursos en paralelo (solo si hay cursos)
      const activeCourses: CourseProgress[] = [];
      const certificates: Certificate[] = [];
      
      if (userCourses.length > 0) {
        const progressPromises = userCourses.map(async (course: any) => {
          try {
            const progressResponse = await fetch(`/api/progress/check?courseId=${course._id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              return { course, progress: progressData.progress };
            }
          } catch (error) {
            console.error(`Error al cargar progreso del curso ${course._id}:`, error);
          }
          return { course, progress: null };
        });
        
        const progressResults = await Promise.allSettled(progressPromises);
        
        progressResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const { course, progress } = result.value;
            
            activeCourses.push({
              id: course._id,
              title: course.title,
              progress: progress?.totalProgress || 0,
              startDate: course.createdAt,
              lastUpdate: progress?.updatedAt || course.updatedAt,
              thumbnailUrl: course.thumbnailUrl
            });
            
            if (progress?.certificateIssued && progress?.certificateUrl) {
              certificates.push({
                id: progress.certificateId || course._id,
                courseTitle: course.title,
                issueDate: progress.completedAt || course.updatedAt,
                certificateUrl: progress.certificateUrl
              });
            }
          }
        });
      }
      
      // Procesar estadísticas globales
      let statsData = { students: 0, courses: 0 };
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        statsData = await statsResponse.value.json();
      }
      
      // Procesar información del usuario
      let registrationDate = new Date().toISOString();
      let lastLogin = new Date().toISOString();
      
      if (userInfoResponse.status === 'fulfilled' && userInfoResponse.value.ok) {
        const userInfo = await userInfoResponse.value.json();
        registrationDate = userInfo.createdAt || registrationDate;
        lastLogin = userInfo.lastLogin || lastLogin;
      }
      
      // Cargar datos pesados de forma lazy (compras y estadísticas admin)
      const purchases: Purchase[] = [];
      let adminStats = {
        totalUsers: 0,
        totalCourses: 0,
        totalSales: 0,
        monthlySales: 0
      };
      
      // Solo cargar compras y estadísticas admin si es necesario
      if (activeTab === 'compras') {
        loadPurchases(purchases, userCourses);
      }
      
      if (session?.user?.role === 'admin' && activeTab === 'admin') {
        loadAdminStats(adminStats, statsData);
      }
      
      // Actualizar estado con datos básicos inmediatamente
      setProfileData({
        activeCourses,
        certificates,
        purchases,
        stats: {
          totalCourses: userCourses.length,
          completedCourses: certificates.length,
          certificatesEarned: certificates.length,
          totalHoursLearned: Math.round(activeCourses.reduce(
            (acc, course) => acc + (course.progress / 100) * 20, 0
          ))
        },
        adminStats,
        lastLogin,
        registrationDate
      });
      
      setDataLoaded(true);
      
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
      // Usar datos de fallback mínimos
      setProfileData(prev => ({
        ...prev,
        activeCourses: [],
        certificates: [],
        purchases: [],
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          certificatesEarned: 0,
          totalHoursLearned: 0,
        },
        lastLogin: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
      }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded]);

  // Función para cargar compras de forma lazy
  const loadPurchases = async (purchases: Purchase[], userCourses: any[]) => {
    try {
      const purchasesResponse = await fetch('/api/users/purchases');
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        purchasesData.purchases.forEach((purchase: any) => {
          purchases.push({
            id: purchase._id || purchase.id,
            courseTitle: purchase.courseTitle || purchase.course?.title || 'Curso',
            date: purchase.date,
            paymentMethod: purchase.paymentMethod || 'No especificado',
            amount: purchase.amount || purchase.price || 0,
            invoiceUrl: purchase.invoiceUrl
          });
        });
      }
    } catch (error) {
      console.error('Error al cargar compras:', error);
      // Fallback usando cursos como compras
      userCourses.forEach((course: any) => {
        purchases.push({
          id: course._id,
          courseTitle: course.title,
          date: course.createdAt,
          paymentMethod: 'Compra en plataforma',
          amount: course.price || 0
        });
      });
    }
  };

  // Función para cargar estadísticas admin de forma lazy
  const loadAdminStats = async (adminStats: any, statsData: any) => {
    if (session?.user?.role === 'admin') {
      try {
        const adminStatsResponse = await fetch('/api/admin/stats');
        if (adminStatsResponse.ok) {
          const adminStatsData = await adminStatsResponse.json();
          Object.assign(adminStats, {
            totalUsers: adminStatsData.users || statsData.students || 0,
            totalCourses: adminStatsData.courses || statsData.courses || 0,
            totalSales: adminStatsData.totalSales || 0,
            monthlySales: adminStatsData.monthlySales || 0
          });
        }
      } catch (error) {
        console.error('Error al cargar estadísticas de admin:', error);
        Object.assign(adminStats, {
          totalUsers: statsData.students || 0,
          totalCourses: statsData.courses || 0,
          totalSales: 0,
          monthlySales: 0
        });
      }
    }
  };

  // Cargar datos adicionales cuando cambie de tab
  useEffect(() => {
    if (status === 'authenticated' && profileData.activeCourses.length > 0) {
      if (activeTab === 'compras' && profileData.purchases.length === 0) {
        loadPurchases(profileData.purchases, []);
      }
      if (activeTab === 'admin' && session?.user?.role === 'admin') {
        loadAdminStats(profileData.adminStats, {});
      }
    }
  }, [activeTab, status]);

  // Función para verificar la conexión con MUX
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

  // Función para descargar un certificado
  const handleDownloadCertificate = (certificateId: string) => {
    // Buscar el certificado por ID
    const certificate = profileData.certificates.find(cert => cert.id === certificateId);
    if (certificate?.certificateUrl) {
      // Abrir directamente la URL del certificado
        window.open(certificate.certificateUrl, '_blank');
      } else {
      console.error('Certificado no encontrado o URL no disponible');
      alert('Error: No se pudo encontrar la URL del certificado. Por favor, contacta al soporte.');
    }
  };

  // Función para formatear fechas
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1E1E2F]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="text-white mt-4">Cargando perfil...</p>
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

  // Skeleton loader component
  const SkeletonLoader = ({ rows = 3 }: { rows?: number }) => (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-[#3A3A4C] h-4 rounded mb-2"></div>
      ))}
    </div>
  );

  return (
    <div className="py-10 min-h-screen bg-[#1E1E2F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#2A2A3C] rounded-t-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar y datos básicos */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#3A3A4C] flex-shrink-0">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Usuario'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 96px, 128px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#B4B4C0] text-4xl">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{session?.user?.name || 'Usuario'}</h1>
              <p className="text-[#B4B4C0] mb-2">{session?.user?.email || 'email@ejemplo.com'}</p>
              
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session?.user?.role === 'admin' ? 'bg-green-500 bg-opacity-20 text-white-400' : 'bg-blue-500 bg-opacity-20 text-blue-400'
                  }`}>
                    {session?.user?.role === 'admin' ? 'Administrador' : 'Estudiante'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-[#B4B4C0]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  : {formatDate(profileData.registrationDate)}
                </div>
                
                <div className="flex items-center text-sm text-[#B4B4C0]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Último acceso: {formatDate(profileData.lastLogin)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estadísticas del usuario */}
        <div className="mt-6">
          <Suspense fallback={
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-[#3A3A4C] rounded mb-2"></div>
                    <div className="h-4 bg-[#3A3A4C] rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <UserStats 
              totalCourses={memoizedStats.totalCourses}
              completedCourses={memoizedStats.completedCourses}
              certificatesEarned={memoizedStats.certificatesEarned}
            />
          </Suspense>
        </div>
        
        {/* Navegación por pestañas */}
        <div className="mt-8 border-b border-[#3A3A4C]">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('informacion')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'informacion'
                  ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                  : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('cursos')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'cursos'
                  ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                  : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
              }`}
            >
              Cursos Activos
            </button>
            <button
              onClick={() => setActiveTab('certificados')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'certificados'
                  ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                  : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
              }`}
            >
              Certificados
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'compras'
                  ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                  : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
              }`}
            >
              Historial de Compras
            </button>
            {session?.user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'admin'
                    ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                    : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
                }`}
              >
                Panel de Administrador
              </button>
            )}
          </nav>
        </div>
        
        {/* Contenido de las pestañas */}
        <div className="py-6">
          {/* Información Personal */}
          {activeTab === 'informacion' && (
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Información Personal</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#B4B4C0] mb-1">Nombre completo</label>
                    <input 
                      type="text" 
                      value={session?.user?.name || ''} 
                      readOnly 
                      className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#B4B4C0] mb-1">Email</label>
                    <input 
                      type="email" 
                      value={session?.user?.email || ''} 
                      readOnly 
                      className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#B4B4C0] mb-1">Rol</label>
                    <input 
                      type="text" 
                      value={session?.user?.role === 'admin' ? 'Administrador' : 'Estudiante'} 
                      readOnly 
                      className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#B4B4C0] mb-1">Fecha de registro</label>
                    <input 
                      type="text" 
                      value={formatDate(profileData.registrationDate)} 
                      readOnly 
                      className="w-full p-3 bg-[#1E1E2F] border border-[#3A3A4C] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Cursos Activos */}
          {activeTab === 'cursos' && (
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Cursos Activos</h2>
              
              <div className="space-y-4">
                {loading && !dataLoaded ? (
                  // Skeleton loader para cursos
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#3A3A4C] p-4 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-[#4A4A5C] rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-[#4A4A5C] rounded mb-2"></div>
                          <div className="h-3 bg-[#4A4A5C] rounded mb-2 w-3/4"></div>
                          <div className="h-2 bg-[#4A4A5C] rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : profileData.activeCourses.length > 0 ? (
                  profileData.activeCourses.map(course => (
                    <CourseProgressCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      progress={course.progress}
                      startDate={course.startDate}
                      lastUpdate={course.lastUpdate}
                      thumbnailUrl={course.thumbnailUrl}
                    />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#3A3A4C] rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#B4B4C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-[#B4B4C0] text-lg">No tienes cursos activos actualmente.</p>
                    <p className="text-[#8A8A9A] text-sm mt-1">¡Comienza tu aprendizaje explorando nuestros cursos!</p>
                    <a href="/cursos" className="mt-4 px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200 inline-block">
                      Explorar Cursos
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Certificados */}
          {activeTab === 'certificados' && (
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Certificados Obtenidos</h2>
              
              <div className="space-y-4">
                {profileData.certificates.length > 0 ? (
                  profileData.certificates.map(certificate => (
                    <CertificateCard
                      key={certificate.id}
                      id={certificate.id}
                      courseTitle={certificate.courseTitle}
                      issueDate={certificate.issueDate}
                      certificateUrl={certificate.certificateUrl}
                      onDownload={handleDownloadCertificate}
                    />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-[#B4B4C0]">Aún no has obtenido ningún certificado.</p>
                    <p className="text-[#8A8A9A] mt-2">Completa tus cursos para obtener certificados.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Historial de Compras */}
          {activeTab === 'compras' && (
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Historial de Compras</h2>
              
              <Suspense fallback={<div>Cargando...</div>}>
                <PurchaseHistory purchases={profileData.purchases} />
              </Suspense>
            </div>
          )}
          
          {/* Panel de Administrador */}
          {activeTab === 'admin' && session?.user?.role === 'admin' && (
            <Suspense fallback={<div>Cargando...</div>}>
              <AdminPanel
                totalUsers={profileData.adminStats.totalUsers}
                totalCourses={profileData.adminStats.totalCourses}
                totalSales={profileData.adminStats.totalSales}
                monthlySales={profileData.adminStats.monthlySales}
                onCheckMuxConnection={verificarMux}
                isMuxLoading={muxStatus.loading}
                muxStatus={muxStatus}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
} 