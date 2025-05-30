'use client';

import { useState, useEffect } from 'react';
import CourseCard from '@/components/CourseCard';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  playbackId: string;
  createdBy: {
    _id: string;
    name: string;
  };
  featured: boolean;
  reviews: any[];
  introPlaybackId?: string;
}

interface PackType {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  courses: { _id: string; title: string; thumbnailUrl?: string }[];
  imageUrl?: string;
  imageData?: {
    data: string;
    contentType: string;
  };
  active: boolean;
}

interface EligibilityInfo {
  isEligible: boolean;
  ownedCourses: { _id: string; title: string }[];
  message: string;
}

// Componente Skeleton simple
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-600 ${className}`}></div>;
}

// Función helper para obtener la URL de la imagen
const getPackImageSrc = (pack: PackType): string | undefined => {
  if (pack.imageData && pack.imageData.data) {
    return `data:${pack.imageData.contentType};base64,${pack.imageData.data}`;
  }
  return pack.imageUrl || undefined;
};

export default function PacksPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [eligibilityMap, setEligibilityMap] = useState<{ [key: string]: EligibilityInfo }>({});
  const [checkingEligibility, setCheckingEligibility] = useState<{ [key: string]: boolean }>({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { data: session } = useSession();
  const router = useRouter();

  const showToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await fetch('/api/packs');
        if (!res.ok) throw new Error('Error al cargar packs');
        const data = await res.json();
        setPacks(data);
      } catch (err) {
        setPacks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPacks();
  }, []);

  // Verificar elegibilidad cuando el usuario está autenticado
  useEffect(() => {
    if (session && packs.length > 0) {
      checkPacksEligibility();
    }
  }, [session, packs]);

  const checkPacksEligibility = async () => {
    const newEligibilityMap: { [key: string]: EligibilityInfo } = {};
    const newCheckingEligibility: { [key: string]: boolean } = {};

    for (const pack of packs) {
      if (pack.active) {
        newCheckingEligibility[pack._id] = true;
        try {
          const res = await fetch(`/api/packs/check-eligibility?packId=${pack._id}`);
          if (res.ok) {
            const eligibilityData = await res.json();
            newEligibilityMap[pack._id] = eligibilityData;
          }
        } catch (err) {
          console.error(`Error al verificar elegibilidad del pack ${pack._id}:`, err);
        } finally {
          newCheckingEligibility[pack._id] = false;
        }
      }
    }
    
    setEligibilityMap(newEligibilityMap);
    setCheckingEligibility(newCheckingEligibility);
  };

  const handleShowPaymentModal = (packId: string) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    const eligibility = eligibilityMap[packId];
    if (eligibility && !eligibility.isEligible) {
      // Mostrar notificación en lugar de alerta
      showToast('No podés comprar un pack de cursos si ya poseés uno de los cursos incluidos.');
      return;
    }

    setShowPaymentModal(packId);
  };

  const handleBuyPack = async (packId: string) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Verificar elegibilidad antes de proceder con la compra
    const eligibility = eligibilityMap[packId];
    if (eligibility && !eligibility.isEligible) {
      showToast('No podés comprar un pack de cursos si ya poseés uno de los cursos incluidos.');
      setShowPaymentModal(null);
      return;
    }

    setBuyingPackId(packId);
    try {
      const res = await fetch('/api/mercadopago/create-pack-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) throw new Error('Error al iniciar compra');
      const data = await res.json();
      window.location.href = data.init_point;
    } catch (err) {
      showToast('No se pudo procesar la compra. Intenta nuevamente.');
    } finally {
      setBuyingPackId(null);
    }
  };

  const isPackDisabled = (packId: string) => {
    if (!session) return false;
    const eligibility = eligibilityMap[packId];
    return eligibility && !eligibility.isEligible;
  };

  const getPackStatusMessage = (packId: string) => {
    if (!session) return null;
    const eligibility = eligibilityMap[packId];
    if (eligibility && !eligibility.isEligible) {
      return 'Ya poseés uno de los cursos incluidos en este pack';
    }
    return null;
  };

  return (
    <div className="py-14 bg-neutral-950 min-h-screen font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-100 mb-4 tracking-tight leading-tight font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
            Packs de cursos
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-neutral-300 font-normal font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
            Seleccioná un pack y obtené varios cursos a precio promocional
          </p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="flex flex-col space-y-4">
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-12 w-1/3" />
              </div>
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-neutral-400">No hay packs disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packs.filter(pack => pack.active).map((pack) => {
              const isDisabled = isPackDisabled(pack._id);
              const statusMessage = getPackStatusMessage(pack._id);
              
              return (
                <div
                  key={pack._id}
                  className={`group flex flex-col bg-neutral-900 border rounded-2xl shadow-lg overflow-hidden transition-all duration-300 font-sans ${
                    isDisabled 
                      ? 'border-red-500/50 opacity-75' 
                      : 'border-neutral-800 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/20 hover:-translate-y-1'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {/* Imagen con overlay al hover */}
                  <div className="relative overflow-hidden">
                    {getPackImageSrc(pack) ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-50 z-10"></div>
                        <img
                          src={getPackImageSrc(pack)}
                          alt={pack.name}
                          className={`w-full h-48 object-cover transition-transform duration-500 ${
                            !isDisabled ? 'group-hover:scale-110' : ''
                          }`}
                        />
                      </>
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-neutral-800 text-neutral-400 text-3xl">
                        <span className="font-bold">Sin imagen</span>
                      </div>
                    )}
                    {/* Badge de descuento */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold z-20 transform transition-transform duration-300 ${
                      isDisabled 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white group-hover:scale-110'
                    }`}>
                      {isDisabled 
                        ? 'NO DISPONIBLE' 
                        : `${Math.round((1 - pack.price / pack.originalPrice) * 100)}% OFF`
                      }
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 flex flex-col gap-4 flex-grow">
                    {/* Título con línea decorativa */}
                    <div className="relative">
                      <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                        isDisabled 
                          ? 'text-neutral-400' 
                          : 'text-white group-hover:text-green-400'
                      }`}>{pack.name}</h2>
                      <div className={`h-0.5 w-16 transform origin-left transition-all duration-300 ${
                        isDisabled 
                          ? 'bg-red-500' 
                          : 'bg-green-500 group-hover:w-full'
                      }`}></div>
                    </div>

                    {/* Mensaje de estado si no es elegible */}
                    {statusMessage && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                        <p className="text-red-400 text-sm font-medium">⚠️ {statusMessage}</p>
                      </div>
                    )}

                    {/* Descripción */}
                    <p className="text-sm text-neutral-400 flex-grow">{pack.description}</p>

                    {/* Cursos incluidos con iconos e hipervínculos */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-neutral-300 mb-2">Cursos incluidos:</h3>
                      <div className="flex flex-wrap gap-2">
                        {pack.courses.map((course) => (
                          <a
                            key={course._id}
                            href={`/cursos/${course._id}`}
                            className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg font-medium border border-neutral-700 transition-all duration-300 hover:border-green-500/50 hover:bg-neutral-800/50 hover:text-green-400"
                          >
                            {course.title}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Precios con animación */}
                    <div className="flex items-center gap-3 my-4">
                      <span className={`text-2xl font-bold transition-all duration-300 ${
                        isDisabled 
                          ? 'text-neutral-500' 
                          : 'text-green-500 group-hover:scale-110'
                      }`}>${pack.price / 100}</span>
                      <span className="text-base line-through text-neutral-500">${pack.originalPrice / 100}</span>
                    </div>

                    {/* Botones con nueva organización */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleShowPaymentModal(pack._id)}
                        disabled={isDisabled}
                        className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 transform flex items-center justify-center gap-2 ${
                          isDisabled
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed opacity-60'
                            : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 focus:ring-green-400/50 hover:-translate-y-0.5'
                        }`}
                      >
                        <span>{isDisabled ? 'No disponible' : 'Comprar pack'}</span>
                      </button>
                      
                      <button
                        className="w-full px-4 py-3 rounded-xl border border-neutral-700 text-neutral-300 bg-transparent font-semibold transition-all duration-300 hover:border-green-500 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 transform hover:-translate-y-0.5"
                        onClick={() => setSelectedPack(pack)}
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de métodos de pago */}
      {showPaymentModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPaymentModal(null);
          }}
        >
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Elige tu método de pago</h3>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleBuyPack(showPaymentModal);
                    setShowPaymentModal(null);
                  }}
                  disabled={buyingPackId === showPaymentModal}
                  className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {buyingPackId === showPaymentModal ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    <span>Pagar con Mercado Pago</span>
                  )}
                </button>

                <a
                  href={`/compra/transferencia/${showPaymentModal}`}
                  className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors flex items-center gap-3"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowPaymentModal(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Pagar por transferencia
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles existente */}
      {selectedPack && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-all duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPack(null);
          }}
        >
          <div className="bg-neutral-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fadeIn border border-neutral-800 transform transition-all duration-300 hover:border-green-500/20">
            <button
              className="absolute -top-4 -right-4 w-8 h-8 bg-neutral-800 text-neutral-400 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300"
              onClick={() => setSelectedPack(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            
            <div className="relative overflow-hidden rounded-xl mb-6">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-50 z-10"></div>
              {getPackImageSrc(selectedPack) ? (
                <img 
                  src={getPackImageSrc(selectedPack)} 
                  alt={selectedPack.name} 
                  className="w-full h-56 object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center bg-neutral-800 text-neutral-400 text-2xl">
                  <span className="font-bold">Sin imagen</span>
                </div>
              )}
              {/* Badge de descuento */}
              {!isPackDisabled(selectedPack._id) ? (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                  {Math.round((1 - selectedPack.price / selectedPack.originalPrice) * 100)}% OFF
                </div>
              ) : (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                  NO DISPONIBLE
                </div>
              )}
            </div>

            <div className="relative mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{selectedPack.name}</h2>
              <div className="h-0.5 w-16 bg-green-500 transition-all duration-300 hover:w-32"></div>
            </div>

            {/* Mensaje de estado si no es elegible */}
            {getPackStatusMessage(selectedPack._id) && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-red-400 font-medium">Pack no disponible para compra</p>
                    <p className="text-red-300 text-sm">{getPackStatusMessage(selectedPack._id)}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-neutral-300 mb-6 text-base leading-relaxed">{selectedPack.description}</p>

            {/* Modal: Cursos incluidos con hipervínculos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Cursos incluidos</h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedPack.courses.map((course) => (
                  <a
                    key={course._id}
                    href={`/cursos/${course._id}`}
                    className="px-3 py-2 bg-neutral-800 text-neutral-300 text-sm rounded-lg font-medium border border-neutral-700 transition-all duration-300 hover:border-green-500/50 hover:bg-neutral-800/50 hover:text-green-400"
                  >
                    {course.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-bold text-green-500">${selectedPack.price / 100}</span>
              <span className="text-xl line-through text-neutral-500">${selectedPack.originalPrice / 100}</span>
              <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                Ahorrás ${(selectedPack.originalPrice - selectedPack.price) / 100}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  handleShowPaymentModal(selectedPack._id);
                  setSelectedPack(null);
                }}
                disabled={isPackDisabled(selectedPack._id)}
                className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 transform flex items-center justify-center gap-2 ${
                  isPackDisabled(selectedPack._id)
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed opacity-60'
                    : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 focus:ring-green-400/50 hover:-translate-y-0.5'
                }`}
              >
                <span>{isPackDisabled(selectedPack._id) ? 'No disponible para compra' : 'Comprar pack'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificación Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg border border-red-500 animate-slideIn">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm">{notificationMessage}</p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 