'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import MuxPlayer from '@/app/components/MuxPlayer';

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    playbackId: string;
    introPlaybackId?: string;
    createdBy: {
      _id: string;
      name: string;
    };
    reviews: any[];
  };
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [isHovered, setIsHovered] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calcular la puntuación media si hay reseñas
  const averageRating = course.reviews && course.reviews.length > 0
    ? course.reviews.reduce((acc, review: any) => acc + review.rating, 0) / course.reviews.length
    : 0;

  // Gestionar reproducción del video con delay al hacer hover
  useEffect(() => {
    if (isHovered) {
      timerRef.current = setTimeout(() => {
        setShouldPlayVideo(true);
      }, 300); // Reducir de 800ms a 300ms para una respuesta más rápida
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShouldPlayVideo(false);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isHovered]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      <div 
        className="relative aspect-video w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mostrar el video de introducción si existe y está en hover */}
        {course.introPlaybackId && shouldPlayVideo ? (
          <div className="w-full h-full">
            <MuxPlayer 
              playbackId={course.introPlaybackId} 
              title={course.title}
              autoPlay={true}
            />
          </div>
        ) : course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
            <span className="text-gray-500">Sin imagen</span>
          </div>
        )}
        
        {/* Botón de reproducción */}
        {course.introPlaybackId && !shouldPlayVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600 bg-opacity-80 rounded-full p-3 hover:bg-opacity-90 transition-opacity">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4l12 6-12 6z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          <Link href={`/cursos/${course._id}`} className="hover:text-blue-600 transition-colors">
            {course.title}
          </Link>
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-1">★</span>
            <span className="text-sm text-gray-700">{averageRating ? averageRating.toFixed(1) : 'Sin valoraciones'}</span>
          </div>
          
          <span className="font-medium text-lg text-gray-900">${course.price.toFixed(2)}</span>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          Por {course.createdBy?.name || 'Instructor'}
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <Link
          href={`/cursos/${course._id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Ver detalles
        </Link>
        
        {isAdmin && (
          <div className="mt-2 flex space-x-2">
            <Link
              href={`/admin/cursos/editar/${course._id}`}
              className="block flex-1 bg-gray-200 text-gray-800 text-center py-2 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Editar
            </Link>
            <Link
              href={`/admin/cursos/eliminar/${course._id}`}
              className="block flex-1 bg-red-100 text-red-700 text-center py-2 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              Eliminar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard; 