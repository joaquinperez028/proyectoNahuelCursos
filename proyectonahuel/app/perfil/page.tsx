'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import CourseProgressCard from '@/components/CourseProgressCard';
import CertificateCard from '@/components/CertificateCard';
import PurchaseHistory from '@/components/PurchaseHistory';
import UserStats from '@/components/UserStats';
import AdminPanel from '@/components/AdminPanel';

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

  // Cargar datos del perfil
  useEffect(() => {
    if (status === 'authenticated') {
      // Aquí iría la llamada a la API para cargar los datos reales
      // Por ahora usamos datos de ejemplo
      fetchProfileData();
    }
  }, [status]);

  // Función para cargar datos del perfil (simulada)
  const fetchProfileData = async () => {
    // Simular una carga de datos de la API
    setTimeout(() => {
      // Datos de ejemplo para la demostración
      setProfileData({
        activeCourses: [
          {
            id: 'curso1',
            title: 'Desarrollo Web Fullstack',
            progress: 75,
            startDate: '2023-08-15',
            lastUpdate: '2023-09-28',
            thumbnailUrl: 'https://placehold.co/80x80/4CAF50/FFFFFF.png?text=Web',
          },
          {
            id: 'curso2',
            title: 'Diseño UX/UI Avanzado',
            progress: 45,
            startDate: '2023-09-05',
            lastUpdate: '2023-09-30',
            thumbnailUrl: 'https://placehold.co/80x80/2196F3/FFFFFF.png?text=UX',
          },
          {
            id: 'curso3',
            title: 'Marketing Digital',
            progress: 22,
            startDate: '2023-09-20',
            lastUpdate: '2023-09-25',
            thumbnailUrl: 'https://placehold.co/80x80/FF9800/FFFFFF.png?text=MKT',
          },
        ],
        certificates: [
          {
            id: 'cert1',
            courseTitle: 'Programación Python',
            issueDate: '2023-07-10',
            certificateUrl: '/certificados/python.pdf',
          },
          {
            id: 'cert2',
            courseTitle: 'Desarrollo de Aplicaciones Móviles',
            issueDate: '2023-05-20',
            certificateUrl: '/certificados/mobile.pdf',
          },
        ],
        purchases: [
          {
            id: 'compra1',
            courseTitle: 'Desarrollo Web Fullstack',
            date: '2023-08-15',
            paymentMethod: 'MercadoPago',
            amount: 24999,
            invoiceUrl: '/facturas/factura1.pdf',
          },
          {
            id: 'compra2',
            courseTitle: 'Diseño UX/UI Avanzado',
            date: '2023-09-05',
            paymentMethod: 'PayPal',
            amount: 18999,
            invoiceUrl: '/facturas/factura2.pdf',
          },
          {
            id: 'compra3',
            courseTitle: 'Marketing Digital',
            date: '2023-09-20',
            paymentMethod: 'Transferencia',
            amount: 15999,
          },
          {
            id: 'compra4',
            courseTitle: 'Programación Python',
            date: '2023-05-10',
            paymentMethod: 'MercadoPago',
            amount: 22999,
            invoiceUrl: '/facturas/factura4.pdf',
          },
          {
            id: 'compra5',
            courseTitle: 'Desarrollo de Aplicaciones Móviles',
            date: '2023-03-25',
            paymentMethod: 'PayPal',
            amount: 27999,
            invoiceUrl: '/facturas/factura5.pdf',
          },
        ],
        stats: {
          totalCourses: 5,
          completedCourses: 2,
          certificatesEarned: 2,
          totalHoursLearned: 78,
        },
        adminStats: {
          totalUsers: 325,
          totalCourses: 42,
          totalSales: 2850000,
          monthlySales: 350000,
        },
        lastLogin: '2023-10-01T15:30:00Z',
        registrationDate: '2023-01-15T10:20:00Z',
      });
    }, 1000);
  };

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
    // Aquí iría la lógica real para descargar el certificado
    console.log(`Descargando certificado ${certificateId}`);
    
    // Ejemplo de redirección a un PDF
    const certificate = profileData.certificates.find(cert => cert.id === certificateId);
    if (certificate?.certificateUrl) {
      window.open(certificate.certificateUrl, '_blank');
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4CAF50]"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-[#2A2A3C] p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h2>
          <p className="text-[#B4B4C0] mb-6">Debes iniciar sesión para ver tu perfil.</p>
          <button 
            onClick={() => window.location.href = '/api/auth/signin'}
            className="px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

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
              <button className="absolute bottom-0 right-0 bg-[#007bff] p-2 rounded-full hover:bg-[#0069d9] transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{session?.user?.name || 'Usuario'}</h1>
              <p className="text-[#B4B4C0] mb-2">{session?.user?.email || 'email@ejemplo.com'}</p>
              
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session?.user?.role === 'admin' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-blue-500 bg-opacity-20 text-blue-400'
                  }`}>
                    {session?.user?.role === 'admin' ? 'Administrador' : 'Estudiante'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-[#B4B4C0]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Miembro desde: {formatDate(profileData.registrationDate)}
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
          <UserStats 
            totalCourses={profileData.stats.totalCourses}
            completedCourses={profileData.stats.completedCourses}
            certificatesEarned={profileData.stats.certificatesEarned}
            totalHoursLearned={profileData.stats.totalHoursLearned}
          />
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
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'configuracion'
                  ? 'border-b-2 border-[#4CAF50] text-[#4CAF50]'
                  : 'text-[#B4B4C0] hover:text-white hover:border-[#8A8A9A] border-b-2 border-transparent'
              }`}
            >
              Configuración
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
                {profileData.activeCourses.length > 0 ? (
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
                    <p className="text-[#B4B4C0]">No tienes cursos activos actualmente.</p>
                    <button className="mt-4 px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-200">
                      Explorar Cursos
                    </button>
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
              
              <PurchaseHistory purchases={profileData.purchases} />
            </div>
          )}
          
          {/* Configuración */}
          {activeTab === 'configuracion' && (
            <div className="bg-[#2A2A3C] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Configuración de Cuenta</h2>
              
              <div className="space-y-6">
                {/* Preferencias de notificaciones */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Preferencias de Notificaciones</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="notify-updates"
                        type="checkbox"
                        className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-[#3A3A4C] rounded"
                        defaultChecked
                      />
                      <label htmlFor="notify-updates" className="ml-2 block text-sm text-[#B4B4C0]">
                        Actualizaciones de cursos y nuevo contenido
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="notify-promos"
                        type="checkbox"
                        className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-[#3A3A4C] rounded"
                        defaultChecked
                      />
                      <label htmlFor="notify-promos" className="ml-2 block text-sm text-[#B4B4C0]">
                        Promociones y descuentos
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="notify-news"
                        type="checkbox"
                        className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-[#3A3A4C] rounded"
                      />
                      <label htmlFor="notify-news" className="ml-2 block text-sm text-[#B4B4C0]">
                        Novedades y blog
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Cambio de contraseña */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Cambiar Contraseña</h3>
                  <p className="text-sm text-[#B4B4C0] mb-4">
                    Para cambiar tu contraseña, primero cierra la sesión y luego utiliza la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.
                  </p>
                </div>
                
                {/* Eliminar cuenta */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Eliminar Cuenta</h3>
                  <p className="text-sm text-[#B4B4C0] mb-4">
                    Al eliminar tu cuenta, perderás acceso a todos tus cursos y certificados. Esta acción no puede deshacerse.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                    Solicitar Eliminación de Cuenta
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Panel de Administrador */}
          {activeTab === 'admin' && session?.user?.role === 'admin' && (
            <AdminPanel
              totalUsers={profileData.adminStats.totalUsers}
              totalCourses={profileData.adminStats.totalCourses}
              totalSales={profileData.adminStats.totalSales}
              monthlySales={profileData.adminStats.monthlySales}
              onCheckMuxConnection={verificarMux}
              isMuxLoading={muxStatus.loading}
              muxStatus={muxStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
} 