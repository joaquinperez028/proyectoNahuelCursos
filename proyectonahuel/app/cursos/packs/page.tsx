'use client';

import { useState, useEffect } from 'react';
import CourseCard from '@/components/CourseCard';
import Head from 'next/head';

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

  return (
    <div className="py-14 bg-neutral-950 min-h-screen font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-100 mb-4 tracking-tight leading-tight" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Packs de cursos
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-neutral-300 font-normal" style={{ fontFamily: 'Roboto, sans-serif' }}>
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
              <div key={pack._id} className="bg-neutral-900 rounded-2xl shadow-lg p-8 flex flex-col transition-shadow duration-300 hover:shadow-2xl border border-neutral-800">
                {pack.imageUrl && (
                  <img src={pack.imageUrl} alt={pack.name} className="w-full h-44 object-cover rounded-lg mb-6 border border-neutral-800" />
                )}
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Roboto, sans-serif' }}>{pack.name}</h2>
                <p className="text-neutral-300 mb-4 text-base" style={{ fontFamily: 'Roboto, sans-serif' }}>{pack.description}</p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {pack.courses.map((course) => (
                    <div key={course._id} className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded" />
                      )}
                      <span className="text-xs text-white" style={{ fontFamily: 'Roboto, sans-serif' }}>{course.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-auto mb-6">
                  <span className="text-3xl font-bold text-[#4CAF50] tracking-tight" style={{ fontFamily: 'Roboto, sans-serif' }}>${pack.price / 100}</span>
                  <span className="text-base line-through text-neutral-500" style={{ fontFamily: 'Roboto, sans-serif' }}>${pack.originalPrice / 100}</span>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button
                    className="px-5 py-2 rounded-lg bg-[#4CAF50] text-white font-medium transition-all duration-200 hover:bg-[#388e3c] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/50 shadow-sm"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    Comprar pack
                  </button>
                  <button
                    className="px-5 py-2 rounded-lg border border-[#4CAF50] text-[#4CAF50] bg-transparent font-medium transition-all duration-200 hover:bg-[#4CAF50] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 shadow-sm"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
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
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              &times;
            </button>
            {selectedPack.imageUrl && (
              <img src={selectedPack.imageUrl} alt={selectedPack.name} className="w-full h-44 object-cover rounded-lg mb-6 border border-neutral-800" />
            )}
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Roboto, sans-serif' }}>{selectedPack.name}</h2>
            <p className="text-neutral-300 mb-6 text-base" style={{ fontFamily: 'Roboto, sans-serif' }}>{selectedPack.description}</p>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>Cursos incluidos</h3>
              <div className="flex flex-wrap gap-3">
                {selectedPack.courses.map((course) => (
                  <div key={course._id} className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700">
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded" />
                    )}
                    <span className="text-xs text-white" style={{ fontFamily: 'Roboto, sans-serif' }}>{course.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-bold text-[#4CAF50] tracking-tight" style={{ fontFamily: 'Roboto, sans-serif' }}>${selectedPack.price / 100}</span>
              <span className="text-base line-through text-neutral-500" style={{ fontFamily: 'Roboto, sans-serif' }}>${selectedPack.originalPrice / 100}</span>
            </div>
            <button className="w-full px-6 py-3 rounded-lg bg-[#4CAF50] text-white font-medium transition-all duration-200 hover:bg-[#388e3c] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/50 shadow-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Comprar pack
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 