/**
 * Página de detalle de cursos - CAMBIOS REALIZADOS:
 * 1. Se eliminaron los botones de compra redundantes, dejando solo el BuyButton principal
 * 2. Se reposicionó el botón de compra a un lugar más destacado debajo del título y descripción
 * 3. Se mejoró la estética del botón para que sea coherente con el diseño del sitio
 * 4. El botón ahora es responsivo y se ve bien en dispositivos móviles y de escritorio
 */

import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/models/Course";
import Review from "@/models/Review";
import User from "@/models/User";
import CourseViewer from "@/components/CourseViewer";
import ReviewSection from "@/components/ReviewSection";
import EnrollSection from "@/components/EnrollSection";
import CertificateButton from "@/components/CertificateButton";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import BuyButton from '@/app/components/BuyButton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import CourseContentPagination from '@/components/CourseContentPagination';
import CourseProgress from '@/components/CourseProgress';

export const dynamic = 'force-dynamic';

type CourseParams = {
  id: string;
};

type PageProps<T = {}> = {
  params: Promise<T>;
};

// Definir interfaces para los datos
interface VideoType {
  _id: string;
  title: string;
  description: string;
  videoId: string;
  playbackId: string;
  order: number;
  duration?: number;
}

interface ExerciseType {
  _id: string;
  title: string;
  description: string;
  fileData: {
    data: string;
    contentType: string;
  };
  order: number;
}

interface ReviewType {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  hasThumbnailImage: boolean;
  playbackId?: string;
  videoId?: string;
  introPlaybackId?: string;
  introVideoId?: string;
  videos: VideoType[];
  exercises: ExerciseType[];
  createdBy: {
    _id: string;
    name: string;
  };
  reviews: ReviewType[];
  createdAt: string;
  updatedAt: string;
  onSale: boolean;
  discountPercentage: number;
  discountedPrice?: number;
  duration?: number;
  isFree: boolean;
}

async function getUserHasCourse(courseId: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return false;
    }
    
    await connectToDatabase();
    
    // Usar findOne en lugar de lean para obtener el documento completo
    const userDoc = await User.findOne({ email: session.user.email });
    
    if (!userDoc || !userDoc.courses) {
      return false;
    }
    
    // Convertir el array de ObjectId a strings para comparar
    return userDoc.courses.some((id: any) => 
      id && typeof id.toString === 'function' && id.toString() === courseId
    );
  } catch (error) {
    console.error('Error al verificar si el usuario tiene el curso:', error);
    return false;
  }
}

async function getCourse(id: string): Promise<CourseType | null> {
  try {
    await connectToDatabase();
    
    // Obtener el curso como documento completo
    const courseDoc = await Course.findById(id).populate('createdBy', 'name');
    
    if (!courseDoc) {
      return null;
    }
    
    // Obtener reseñas
    const reviewDocs = await Review.find({ courseId: id })
      .populate('userId', 'name image')
      .sort({ createdAt: -1 });
    
    // Crear objeto con propiedades seguras
    const course = {
      _id: courseDoc._id.toString(),
      title: courseDoc.title || '',
      description: courseDoc.description || '',
      price: courseDoc.price || 0,
      thumbnailUrl: courseDoc.thumbnailUrl || '',
      hasThumbnailImage: !!courseDoc.thumbnailImage?.data,
      playbackId: courseDoc.playbackId || '',
      videoId: courseDoc.videoId || '',
      introPlaybackId: courseDoc.introPlaybackId || '',
      introVideoId: courseDoc.introVideoId || '',
      createdBy: {
        _id: courseDoc.createdBy?._id ? courseDoc.createdBy._id.toString() : '',
        name: courseDoc.createdBy?.name || ''
      },
      createdAt: courseDoc.createdAt ? new Date(courseDoc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: courseDoc.updatedAt ? new Date(courseDoc.updatedAt).toISOString() : new Date().toISOString(),
      
      // Agregar videos adicionales
      videos: Array.isArray(courseDoc.videos) 
        ? courseDoc.videos.map((video: any) => ({
            _id: video._id.toString(),
            title: video.title || '',
            description: video.description || '',
            videoId: video.videoId || '',
            playbackId: video.playbackId || '',
            order: video.order || 0
          })).sort((a: any, b: any) => a.order - b.order)
        : [],
      
      // Agregar ejercicios
      exercises: Array.isArray(courseDoc.exercises)
        ? courseDoc.exercises.map((exercise: any) => ({
            _id: exercise._id.toString(),
            title: exercise.title || '',
            description: exercise.description || '',
            fileData: exercise.fileData 
              ? {
                  data: exercise.fileData._id?.toString() || '',
                  contentType: exercise.fileData.contentType || ''
                }
              : null,
            order: exercise.order || 0
          })).sort((a: any, b: any) => a.order - b.order)
        : [],
      
      reviews: reviewDocs.map(review => ({
        _id: review._id.toString(),
        rating: review.rating || 0,
        comment: review.comment || '',
        userId: {
          _id: review.userId?._id ? review.userId._id.toString() : '',
          name: review.userId?.name || '',
          image: review.userId?.image || ''
        },
        courseId: review.courseId.toString(),
        createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : new Date().toISOString()
      })),
      
      onSale: courseDoc.onSale || false,
      discountPercentage: courseDoc.discountPercentage || 0,
      discountedPrice: courseDoc.discountedPrice || 0,
      duration: courseDoc.duration || 0,
      isFree: courseDoc.isFree || false
    };
    
    return course;
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return null;
  }
}

export default async function CoursePage({ params }: PageProps<CourseParams>) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const course = await getCourse(courseId);
  const userHasCourse = await getUserHasCourse(courseId);
  
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center p-8 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg max-w-md">
          <svg className="w-16 h-16 mx-auto text-[var(--neutral-500)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-[var(--neutral-100)] mb-2">Curso no encontrado</h1>
          <p className="text-[var(--neutral-300)]">El curso que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }
  
  // Si es desarrollo y no tenemos claves de MUX, simplemente mostramos los videos
  // sin token de autenticación (modo de reproducción pública)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasMuxCredentials = !!process.env.MUX_SIGNING_KEY && !!process.env.MUX_SIGNING_KEY_ID;
  
  // Los videos siempre están en modo público, no necesitamos tokens JWT
  const useTokens = false; // Cambio: siempre usar modo público
  
  // Token para el video principal (vacío porque usamos modo público)
  const mainToken = '';
  
  // Tokens para videos adicionales (vacíos porque usamos modo público)
  const videoTokens: Record<string, string> = {};
  
  // Calcular la puntuación media para mostrar en el encabezado
  const averageRating = course.reviews && course.reviews.length > 0
    ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length
    : 0;
    
  // Formato de precio con Intl
  const formattedPrice = course.isFree ? 'Gratis' : new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(course.price);

  // Formato de precio con descuento
  const formattedDiscountedPrice = course.isFree ? null : (course.onSale && course.discountPercentage && course.discountPercentage > 0
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(course.discountedPrice || course.price - (course.price * (course.discountPercentage / 100)))
    : null);
  
  // Calcular duración total del curso
  const mainVideoDuration = course.duration || 0;
  const additionalVideosDuration = course.videos.reduce((acc, video) => acc + (video.duration || 0), 0);
  const exercisesDuration = (course.exercises?.length || 0) * 30;
  const totalDuration = mainVideoDuration + additionalVideosDuration + exercisesDuration;

  const studentsCount = await User.countDocuments({ courses: courseId });

  // Unificar videos y ejercicios en un solo array ordenado por 'order'
  const itemsOrdenados = [
    ...course.videos.map(v => ({ ...v, tipo: 'video' as const })),
    ...course.exercises.map(e => ({ ...e, tipo: 'ejercicio' as const }))
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-[var(--background)] min-h-screen pb-16">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--neutral-100)] mb-4 leading-tight">{course.title}</h1>
        <p className="text-lg md:text-xl text-[var(--neutral-300)] mb-6">{course.description.length > 240 ? `${course.description.substring(0, 240)}...` : course.description}</p>
      </div>
      <hr className="border-[var(--border)] my-8" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {/* Sección de video principal */}
            <div className="overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl mb-8">
              {userHasCourse ? (
                // Usuario tiene acceso al curso - usar CourseViewer con video principal
                (() => {
                  // CORRECCIÓN: Usuarios con acceso ven el VIDEO PRINCIPAL del curso
                  // Si hay playbackId (video principal), usarlo; si no, usar introPlaybackId como fallback
                  const mainPlaybackId = course.playbackId || course.introPlaybackId;
                  const mainVideoId = course.videoId || course.introVideoId;
                  
                  return mainPlaybackId ? (
                    <CourseViewer 
                      playbackId={mainPlaybackId}
                      videoId={mainVideoId || ''}
                      courseId={course._id}
                    />
                  ) : (
                    <div className="aspect-video bg-[var(--neutral-900)] flex items-center justify-center">
                      <p className="text-[var(--neutral-300)]">Video no disponible</p>
                    </div>
                  );
                })()
              ) : (
                // Usuario NO tiene acceso - mostrar preview (video de introducción)
                course.introPlaybackId ? (
                  <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden">
                    <MuxPlayer
                      playbackId={course.introPlaybackId}
                      streamType="on-demand"
                      style={{ height: '100%', width: '100%' }}
                      autoPlay={false}
                      muted={false}
                    />
                  </div>
                ) : course.playbackId ? (
                  // FALLBACK: si no hay introPlaybackId pero sí playbackId, usar ese
                  <div className="aspect-video bg-[var(--neutral-900)] rounded-md overflow-hidden">
                    <MuxPlayer
                      playbackId={course.playbackId}
                      streamType="on-demand"
                      style={{ height: '100%', width: '100%' }}
                      autoPlay={false}
                      muted={false}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-video w-full bg-[var(--neutral-900)]">
                      {course.hasThumbnailImage ? (
                        <img 
                          src={`/api/course-image?id=${course._id}`}
                          alt={course.title} 
                          className="w-full h-full object-cover opacity-70"
                        />
                      ) : course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title} 
                          className="w-full h-full object-cover opacity-70"
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                        <div className="text-center text-white p-6 max-w-lg">
                          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>
                          <p className="text-2xl font-bold mb-2 text-[var(--neutral-100)]">Vista previa no disponible</p>
                          <p className="text-[var(--neutral-300)] mb-6">Compra este curso para acceder al contenido completo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            <hr className="border-[var(--border)] my-8" />
            
            {/* Progreso del curso (solo si el usuario tiene acceso) */}
            <CourseProgress courseId={course._id} userHasCourse={userHasCourse} />
            
            {/* Descripción completa */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-4">Sobre esta formación</h2>
              <div className="prose prose-lg max-w-none text-[var(--neutral-300)] prose-headings:text-[var(--neutral-100)] prose-a:text-[var(--primary-light)]">
                <p>{course.description}</p>
              </div>
            </section>
            {/* Lecciones y ejercicios en orden */}
            {userHasCourse && itemsOrdenados.length > 0 && (
              <CourseContentPagination 
                items={itemsOrdenados}
                courseId={course._id}
                videoTokens={videoTokens}
                userHasCourse={userHasCourse}
                itemsPerPage={10}
              />
            )}
            {/* Reseñas */}
            <section>
              <hr className="border-[var(--border)] my-8" />
              <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-4">Opiniones de estudiantes</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <ReviewSection courseId={course._id} reviews={course.reviews} />
              </div>
            </section>
          </div>
          {/* Sidebar: bloque de acción y beneficios */}
          <aside className="lg:col-span-1">
            {/* Bloque de acción: botón, badges y estrellas */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl p-6 mb-8">
              <BuyButton 
                courseId={course._id} 
                userHasCourse={userHasCourse} 
                isFree={course.isFree}
                className="mx-auto w-full max-w-xs md:max-w-sm mb-6" 
                size="lg" 
              />
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <div className="px-4 py-1.5 bg-[var(--neutral-800)] text-[var(--neutral-300)] rounded-full text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {totalDuration > 0 ? `${totalDuration} minutos` : 'Duración variable'}
                </div>
                <div className="px-4 py-1.5 bg-[var(--neutral-800)] text-[var(--neutral-300)] rounded-full text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {studentsCount} {studentsCount === 1 ? 'estudiante' : 'estudiantes'}
                </div>
              </div>
              <div className="flex items-center justify-center space-x-1 text-amber-400 mb-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={index}
                    fill={index < Math.round(averageRating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    ></path>
                  </svg>
                ))}
                <span className="text-sm font-medium text-[var(--neutral-200)] ml-2">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            </div>
            {/* Bloque de beneficios */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Esta formación incluye</h2>
              <ul className="space-y-3 text-[var(--neutral-300)]">
                <li className="flex items-center text-[var(--neutral-300)]">
                  <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                  </svg>
                  {course.videos.length > 0 
                    ? `${course.videos.length + 1} lecciones en total`
                    : 'Lección principal completa'
                  }
                </li>
                {course.exercises.length > 0 && (
                  <li className="flex items-center text-[var(--neutral-300)]">
                    <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {course.exercises.length} {course.exercises.length === 1 ? 'ejercicio en PDF' : 'ejercicios en PDF'}
                  </li>
                )}
                <li className="flex items-center text-[var(--neutral-300)]">
                  <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Acceso de por vida
                </li>
                <li className="flex items-center text-[var(--neutral-300)]">
                  <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Certificado de finalización
                </li>
                <li className="flex items-center text-[var(--neutral-300)]">
                  <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Acceso on-demand
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
} 