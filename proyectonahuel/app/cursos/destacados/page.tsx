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
  courses: { _id: string; title: string; thumbnailUrl: string }[];
  imageUrl?: string;
}

// Componente Skeleton simple
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-600 ${className}`}></div>;
}

export default function PacksPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Reemplazar por fetch real a /api/packs cuando exista
    setTimeout(() => {
      setPacks([
        {
          _id: 'pack1',
          name: 'Pack Trading Pro',
          description: 'Aprende análisis técnico y fundamental con este pack de 3 cursos.',
          price: 19999,
          originalPrice: 35000,
          courses: [
            { _id: 'c1', title: 'Análisis Técnico', thumbnailUrl: 'https://placehold.co/80x80/4CAF50/FFFFFF.png?text=AT' },
            { _id: 'c2', title: 'Análisis Fundamental', thumbnailUrl: 'https://placehold.co/80x80/2196F3/FFFFFF.png?text=AF' },
            { _id: 'c3', title: 'Estrategias de Trading', thumbnailUrl: 'https://placehold.co/80x80/FF9800/FFFFFF.png?text=ET' },
          ],
          imageUrl: 'https://placehold.co/400x200/4CAF50/FFFFFF?text=Pack+Trading+Pro',
        },
        {
          _id: 'pack2',
          name: 'Pack Finanzas Personales',
          description: 'Domina tus finanzas y aprende a invertir.',
          price: 14999,
          originalPrice: 25000,
          courses: [
            { _id: 'c4', title: 'Finanzas Personales', thumbnailUrl: 'https://placehold.co/80x80/673AB7/FFFFFF.png?text=FP' },
            { _id: 'c5', title: 'Inversiones Básicas', thumbnailUrl: 'https://placehold.co/80x80/009688/FFFFFF.png?text=INV' },
          ],
          imageUrl: 'https://placehold.co/400x200/009688/FFFFFF?text=Pack+Finanzas',
        },
      ]);
      setLoading(false);
    }, 800);
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
                      <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded" />
                      <span className="text-xs text-white">{course.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <span className="text-2xl font-bold text-[#4CAF50]">${pack.price / 100}</span>
                  <span className="text-sm line-through text-[#B4B4C0]">${pack.originalPrice / 100}</span>
                </div>
                <button className="mt-4 px-6 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388e3c] transition-colors duration-200 font-semibold">
                  Comprar pack
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 