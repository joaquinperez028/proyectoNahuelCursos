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
            {packs.map((pack) => (
              <div
                key={pack._id}
                className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg p-7 sm:p-8 gap-6 transition-shadow duration-300 hover:shadow-2xl font-sans"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {/* Imagen o fallback */}
                {pack.imageUrl ? (
                  <img
                    src={pack.imageUrl}
                    alt={pack.name}
                    className="w-full h-40 object-cover rounded-xl border border-neutral-200 mb-2"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-400 text-3xl mb-2">
                    <span className="font-bold">Sin imagen</span>
                  </div>
                )}
                {/* Título */}
                <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{pack.name}</h2>
                {/* Descripción */}
                <p className="text-sm text-neutral-400 mb-2">{pack.description}</p>
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pack.courses.map((course) => (
                    <span
                      key={course._id}
                      className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded-full font-medium border border-neutral-300"
                    >
                      {course.title}
                    </span>
                  ))}
                </div>
                {/* Precios */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-bold text-green-500">${pack.price / 100}</span>
                  <span className="text-base line-through text-neutral-400">${pack.originalPrice / 100}</span>
                </div>
                {/* Botones */}
                <div className="flex gap-3 mt-auto">
                  <button
                    className="flex-1 px-4 py-2 rounded-full bg-green-500 text-white font-semibold transition-all duration-200 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 shadow-sm text-sm disabled:opacity-60"
                    onClick={() => handleBuyPack(pack._id)}
                    disabled={buyingPackId === pack._id}
                  >
                    {buyingPackId === pack._id ? 'Procesando...' : 'Comprar pack'}
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-full border border-green-500 text-green-500 bg-transparent font-semibold transition-all duration-200 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400/30 shadow-sm text-sm"
                    onClick={() => setSelectedPack(pack)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-all duration-300">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl p-10 max-w-lg w-full relative animate-fadeIn border border-neutral-800">
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-3xl transition-colors duration-200"
              onClick={() => setSelectedPack(null)}
              aria-label="Cerrar"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              &times;
            </button>
            {selectedPack.imageUrl ? (
              <img src={selectedPack.imageUrl} alt={selectedPack.name} className="w-full h-44 object-cover rounded-lg mb-6 border border-neutral-800" />
            ) : (
              <div className="w-full h-44 flex items-center justify-center bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-400 text-2xl mb-6">
                <span className="font-bold">Sin imagen</span>
              </div>
            )}
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedPack.name}</h2>
            <p className="text-neutral-300 mb-6 text-base" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedPack.description}</p>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Cursos incluidos</h3>
              <div className="flex flex-wrap gap-3">
                {selectedPack.courses.map((course) => (
                  <span
                    key={course._id}
                    className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded-full font-medium border border-neutral-300"
                  >
                    {course.title}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-bold text-green-500 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>${selectedPack.price / 100}</span>
              <span className="text-base line-through text-neutral-400" style={{ fontFamily: 'Inter, sans-serif' }}>${selectedPack.originalPrice / 100}</span>
            </div>
            <button
              className="w-full px-6 py-3 rounded-full bg-green-500 text-white font-semibold transition-all duration-200 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 shadow-sm text-sm"
              onClick={() => selectedPack && handleBuyPack(selectedPack._id)}
              disabled={buyingPackId === selectedPack?._id}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {buyingPackId === selectedPack?._id ? 'Procesando...' : 'Comprar pack'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 