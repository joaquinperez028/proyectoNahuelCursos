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
  active: boolean;
}

// Componente Skeleton simple
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-600 ${className}`}></div>;
}

export default function PacksPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

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

  const handleBuyPack = async (packId: string) => {
    if (!session) {
      router.push('/api/auth/signin');
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
      alert('No se pudo procesar la compra. Intenta nuevamente.');
    } finally {
      setBuyingPackId(null);
    }
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
            {packs.filter(pack => pack.active).map((pack) => (
              <div
                key={pack._id}
                className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/20 hover:-translate-y-1 font-sans"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {/* Imagen con overlay al hover */}
                <div className="relative overflow-hidden">
                  {pack.imageUrl ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-50 z-10"></div>
                      <img
                        src={pack.imageUrl}
                        alt={pack.name}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-neutral-800 text-neutral-400 text-3xl">
                      <span className="font-bold">Sin imagen</span>
                    </div>
                  )}
                  {/* Badge de descuento */}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20 transform transition-transform duration-300 group-hover:scale-110">
                    {Math.round((1 - pack.price / pack.originalPrice) * 100)}% OFF
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 flex flex-col gap-4 flex-grow">
                  {/* Título con línea decorativa */}
                  <div className="relative">
                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">{pack.name}</h2>
                    <div className="h-0.5 w-16 bg-green-500 transform origin-left transition-all duration-300 group-hover:w-full"></div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-neutral-400 flex-grow">{pack.description}</p>

                  {/* Cursos incluidos con iconos */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-300 mb-2">Cursos incluidos:</h3>
                    <div className="flex flex-wrap gap-2">
                      {pack.courses.map((course) => (
                        <span
                          key={course._id}
                          className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg font-medium border border-neutral-700 transition-all duration-300 hover:border-green-500/50 hover:bg-neutral-800/50"
                        >
                          {course.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Precios con animación */}
                  <div className="flex items-center gap-3 my-4">
                    <span className="text-2xl font-bold text-green-500 transition-all duration-300 group-hover:scale-110">${pack.price / 100}</span>
                    <span className="text-base line-through text-neutral-500">${pack.originalPrice / 100}</span>
                  </div>

                  {/* Botones con mejores animaciones */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="col-span-2 px-4 py-3 rounded-xl bg-green-500 text-white font-semibold transition-all duration-300 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-60 transform hover:-translate-y-0.5"
                      onClick={() => handleBuyPack(pack._id)}
                      disabled={buyingPackId === pack._id}
                    >
                      {buyingPackId === pack._id ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </span>
                      ) : (
                        'Comprar pack'
                      )}
                    </button>
                    <a
                      href={`/compra/transferencia/${pack._id}`}
                      className="px-4 py-3 rounded-xl border-2 border-neutral-700 text-neutral-300 bg-transparent font-semibold transition-all duration-300 hover:border-green-500 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 text-center transform hover:-translate-y-0.5"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Transferencia
                    </a>
                    <button
                      className="px-4 py-3 rounded-xl border-2 border-green-500/50 text-green-400 bg-transparent font-semibold transition-all duration-300 hover:bg-green-500/10 focus:outline-none focus:ring-2 focus:ring-green-400/30 transform hover:-translate-y-0.5"
                      onClick={() => setSelectedPack(pack)}
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal mejorado */}
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
              {selectedPack.imageUrl ? (
                <img 
                  src={selectedPack.imageUrl} 
                  alt={selectedPack.name} 
                  className="w-full h-56 object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center bg-neutral-800 text-neutral-400 text-2xl">
                  <span className="font-bold">Sin imagen</span>
                </div>
              )}
              {/* Badge de descuento */}
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                {Math.round((1 - selectedPack.price / selectedPack.originalPrice) * 100)}% OFF
              </div>
            </div>

            <div className="relative mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{selectedPack.name}</h2>
              <div className="h-0.5 w-16 bg-green-500 transition-all duration-300 hover:w-32"></div>
            </div>

            <p className="text-neutral-300 mb-6 text-base leading-relaxed">{selectedPack.description}</p>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Cursos incluidos</h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedPack.courses.map((course) => (
                  <span
                    key={course._id}
                    className="px-3 py-2 bg-neutral-800 text-neutral-300 text-sm rounded-lg font-medium border border-neutral-700 transition-all duration-300 hover:border-green-500/50 hover:bg-neutral-800/50"
                  >
                    {course.title}
                  </span>
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

            <div className="grid grid-cols-2 gap-4">
              <button
                className="col-span-2 px-6 py-4 rounded-xl bg-green-500 text-white font-semibold transition-all duration-300 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-60 transform hover:-translate-y-0.5"
                onClick={() => selectedPack && handleBuyPack(selectedPack._id)}
                disabled={buyingPackId === selectedPack?._id}
              >
                {buyingPackId === selectedPack?._id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  'Comprar pack'
                )}
              </button>
              <a
                href={`/compra/transferencia/${selectedPack._id}`}
                className="px-4 py-3 rounded-xl border-2 border-neutral-700 text-neutral-300 bg-transparent font-semibold transition-all duration-300 hover:border-green-500 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 text-center transform hover:-translate-y-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pagar por transferencia
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 