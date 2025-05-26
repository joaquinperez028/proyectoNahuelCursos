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
    onSale?: boolean;
    discountPercentage?: number;
    discountedPrice?: number;
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

  // Formateamos el precio
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(course.price);

  // Formateamos el precio con descuento si está en oferta
  const formattedDiscountedPrice = course.onSale && course.discountPercentage && course.discountPercentage > 0
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(course.discountedPrice || course.price - (course.price * (course.discountPercentage / 100)))
    : null;

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
    <div 
      className="card-transition bg-[var(--card)] rounded-xl overflow-hidden flex flex-col h-full border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
    >
      <div 
        className="relative aspect-video w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Etiqueta de precio */}
        <div className="absolute top-0 right-0 z-10 m-4">
          {course.onSale && formattedDiscountedPrice ? (
            <div className="flex flex-col items-end">
              <div className="bg-red-500 text-white py-1 px-3 rounded-full text-xs font-medium shadow-lg mb-1">
                {course.discountPercentage}% OFF
              </div>
              <div className="flex items-center">
                <span className="text-xs line-through text-[var(--neutral-300)] mr-2">
                  {formattedPrice}
                </span>
                <div className="bg-[var(--accent)] text-[var(--neutral-100)] py-1 px-3 rounded-full text-sm font-medium shadow-lg">
                  {formattedDiscountedPrice}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--accent)] text-[var(--neutral-100)] py-1 px-3 rounded-full text-sm font-medium shadow-lg">
              {formattedPrice}
            </div>
          )}
        </div>

        {/* Siempre mostrar la imagen de fondo */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            style={{ opacity: shouldPlayVideo ? 0 : 1 }}
          />
        ) : (
          <Image
            src={`/api/course-image?id=${course._id}`}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            style={{ opacity: shouldPlayVideo ? 0 : 1 }}
            onError={(e) => {
              // Si hay error al cargar la imagen, mostrar un placeholder
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevenir bucle infinito
              target.src = '/images/placeholder.png'; // Usar la imagen PNG de respaldo
            }}
          />
        )}

        {/* Gradiente sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--neutral-900)] via-transparent to-transparent opacity-70"></div>
        
        {/* Mostrar el video de introducción solo cuando se hace hover */}
        {course.introPlaybackId && shouldPlayVideo && (
          <div className="absolute inset-0 w-full h-full">
            <MuxPlayer 
              playbackId={course.introPlaybackId} 
              title={course.title}
              autoPlay={true}
            />
          </div>
        )}
        
        {/* Botón de reproducción, solo visible cuando no se está reproduciendo el video */}
        {course.introPlaybackId && !shouldPlayVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[var(--accent)] bg-opacity-80 rounded-full p-3 hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4l12 6-12 6z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow">
        <h3 className="text-lg font-semibold text-[var(--neutral-100)] mb-2 line-clamp-1">
          <Link href={`/cursos/${course._id}`} className="hover:text-[var(--accent)] transition-colors">
            {course.title}
          </Link>
        </h3>
        
        <p className="text-[var(--neutral-300)] mb-4 line-clamp-2 text-sm">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star} 
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-[var(--neutral-600)]'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            ))}
            <span className="text-xs text-[var(--neutral-400)] ml-1">
              {averageRating ? `${averageRating.toFixed(1)} (${course.reviews.length})` : 'Sin valoraciones'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-[var(--neutral-400)] mb-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--neutral-100)] mr-2 text-xs">
              {course.createdBy?.name?.charAt(0) || 'I'}
            </div>
            <span>{course.createdBy?.name || 'Instructor.'}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <Link
          href={`/cursos/${course._id}`}
          className="block w-full bg-[var(--primary)] text-[var(--neutral-100)] text-center py-2.5 rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium relative overflow-hidden group"
        >
          <span className="relative z-10">Ver detalles</span>
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>
        
        {isAdmin && (
          <div className="mt-2 flex space-x-2">
            <Link
              href={`/admin/cursos/editar/${course._id}`}
              className="block flex-1 bg-[var(--card-hovered)] text-[var(--neutral-300)] text-center py-2 rounded-md hover:bg-[var(--neutral-700)] hover:text-[var(--neutral-100)] transition-colors text-sm font-medium border border-[var(--border)]"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Editar
              </div>
            </Link>
            <Link
              href={`/admin/cursos/eliminar/${course._id}`}
              className="block flex-1 bg-[rgba(220,38,38,0.1)] text-red-500 text-center py-2 rounded-md hover:bg-[rgba(220,38,38,0.2)] transition-colors text-sm font-medium border border-red-500/30"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Eliminar
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard; 