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
      image?: string;
    };
    reviews: any[];
    averageRating?: number;
    reviewCount?: number;
    onSale?: boolean;
    discountPercentage?: number;
    discountedPrice?: number;
    isFree?: boolean;
  };
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [isHovered, setIsHovered] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Usar el promedio pre-calculado o calcularlo si no está disponible
  const averageRating = course.averageRating || 
    (course.reviews && course.reviews.length > 0
      ? course.reviews.reduce((acc, review: any) => acc + review.rating, 0) / course.reviews.length
      : 0);
  
  const reviewCount = course.reviewCount || course.reviews?.length || 0;

  // Formateamos el precio
  const formattedPrice = course.isFree ? 'Gratis' : new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(course.price);

  // Formateamos el precio con descuento si está en oferta
  const formattedDiscountedPrice = course.isFree ? null : (course.onSale && course.discountPercentage && course.discountPercentage > 0
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(course.discountedPrice || course.price - (course.price * (course.discountPercentage / 100)))
    : null);

  // Gestionar reproducción del video con delay al hacer hover
  useEffect(() => {
    if (isHovered && imageLoaded) {
      timerRef.current = setTimeout(() => {
        setShouldPlayVideo(true);
      }, 500); // Delay de 500ms
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
  }, [isHovered, imageLoaded]);

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

        {/* Imagen con lazy loading optimizado */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            style={{ opacity: shouldPlayVideo ? 0 : 1 }}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <Image
            src={`/api/course-image?id=${course._id}`}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            style={{ opacity: shouldPlayVideo ? 0 : 1 }}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Si hay error al cargar la imagen, mostrar un placeholder
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevenir bucle infinito
              target.src = '/images/placeholder.png'; // Usar la imagen PNG de respaldo
              setImageLoaded(true);
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        )}

        {/* Gradiente sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--neutral-900)] via-transparent to-transparent opacity-70"></div>
        
        {/* Mostrar el video de introducción solo cuando se hace hover y la imagen está cargada */}
        {course.introPlaybackId && shouldPlayVideo && imageLoaded && (
          <div className="absolute inset-0 w-full h-full">
            <MuxPlayer 
              playbackId={course.introPlaybackId} 
              title={course.title}
              autoPlay={true}
            />
          </div>
        )}
        
        {/* Botón de reproducción, solo visible cuando no se está reproduciendo el video */}
        {course.introPlaybackId && !shouldPlayVideo && imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[var(--accent)] bg-opacity-80 rounded-full p-3 hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4l12 6-12 6z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Skeleton loader mientras carga la imagen */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[var(--neutral-800)] animate-pulse"></div>
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
              {averageRating ? `${averageRating.toFixed(1)} (${reviewCount})` : 'Sin valoraciones'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-[var(--neutral-400)] mb-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--neutral-100)] mr-2 text-xs overflow-hidden">
              {course.createdBy?.image ? (
                <Image
                  src={course.createdBy.image}
                  alt={course.createdBy.name || 'Instructor'}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                course.createdBy?.name?.charAt(0) || 'I'
              )}
            </div>
            <span>{course.createdBy?.name || 'Instructor.'}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-0">
        <Link 
          href={`/cursos/${course._id}`}
          className="w-full flex items-center justify-center px-4 py-2 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
};

export default CourseCard; 