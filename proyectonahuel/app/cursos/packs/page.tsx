'use client';

import { useState, useEffect } from 'react';
import CourseCard from '@/components/CourseCard';

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
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
            Packs de cursos
          </h1>
          <p className="mt-4 text-xl text-[var(--neutral-300)]">
            Seleccioná un pack y obtené varios cursos a precio promocional
          </p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="flex flex-col space-y-3">
                <Skeleton className="h-52 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--neutral-300)]">No hay packs disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packs.map((pack) => (
              <div key={pack._id} className="bg-[#23233a] rounded-lg shadow-lg p-6 flex flex-col">
                {pack.imageUrl && (
                  <img src={pack.imageUrl} alt={pack.name} className="w-full h-40 object-cover rounded-md mb-4" />
                )}
                <h2 className="text-xl font-bold text-white mb-2">{pack.name}</h2>
                <p className="text-[#B4B4C0] mb-2">{pack.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pack.courses.map((course) => (
                    <div key={course._id} className="flex items-center gap-2 bg-[#2A2A3C] px-2 py-1 rounded">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded" />
                      )}
                      <span className="text-xs text-white">{course.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <span className="text-2xl font-bold text-[#4CAF50]">${pack.price / 100}</span>
                  <span className="text-sm line-through text-[#B4B4C0]">${pack.originalPrice / 100}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388e3c] transition-colors duration-200 font-semibold"
                  >
                    Comprar pack
                  </button>
                  <button
                    className="px-4 py-2 bg-[#23233a] border border-[#4CAF50] text-[#4CAF50] rounded-md hover:bg-[#2e7d32] hover:text-white transition-colors duration-200 font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#23233a] rounded-lg shadow-xl p-8 max-w-lg w-full relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
              onClick={() => setSelectedPack(null)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            {selectedPack.imageUrl && (
              <img src={selectedPack.imageUrl} alt={selectedPack.name} className="w-full h-40 object-cover rounded-md mb-4" />
            )}
            <h2 className="text-2xl font-bold text-white mb-2">{selectedPack.name}</h2>
            <p className="text-[#B4B4C0] mb-4">{selectedPack.description}</p>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Cursos incluidos</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPack.courses.map((course) => (
                  <div key={course._id} className="flex items-center gap-2 bg-[#2A2A3C] px-2 py-1 rounded">
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded" />
                    )}
                    <span className="text-xs text-white">{course.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-[#4CAF50]">${selectedPack.price / 100}</span>
              <span className="text-sm line-through text-[#B4B4C0]">${selectedPack.originalPrice / 100}</span>
            </div>
            <button className="w-full px-6 py-3 bg-[#4CAF50] text-white rounded-md hover:bg-[#388e3c] transition-colors duration-200 font-semibold">
              Comprar pack
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 