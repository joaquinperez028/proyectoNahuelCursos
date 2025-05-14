import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Review from "@/models/Review";
import User from "@/models/User";
import { createMuxPlaybackToken } from "@/lib/mux";
import CourseViewer from "@/components/CourseViewer";
import ReviewSection from "@/components/ReviewSection";
import EnrollSection from "@/components/EnrollSection";
import CertificateButton from "@/components/CertificateButton";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Image from "next/image";
import ScrollToEnrollButton from '@/components/ScrollToEnrollButton';
import MuxPlayer from "@/app/components/MuxPlayer";
import BuyButton from '@/app/components/BuyButton';

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
}

async function getUserHasCourse(courseId: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return false;
    }
    
    await connectDB();
    
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
    await connectDB();
    
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
      discountedPrice: courseDoc.discountedPrice || 0
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
  
  // Generar tokens para cada video si el usuario ha comprado el curso y estamos en producción o tenemos credenciales
  const useTokens = userHasCourse && (!isDevelopment || hasMuxCredentials);
  
  // Token para el video principal
  const mainToken = useTokens && course.playbackId
    ? createMuxPlaybackToken(course.playbackId)
    : '';
  
  // Tokens para videos adicionales
  const videoTokens = useTokens 
    ? course.videos.reduce((tokens: Record<string, string>, video) => {
        if (video.playbackId) {
          tokens[video.playbackId] = createMuxPlaybackToken(video.playbackId);
        }
        return tokens;
      }, {})
    : {};
  
  // Calcular la puntuación media para mostrar en el encabezado
  const averageRating = course.reviews && course.reviews.length > 0
    ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length
    : 0;
    
  // Formato de precio con Intl
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(course.price);

  // Formato de precio con descuento
  const formattedDiscountedPrice = course.onSale && course.discountPercentage && course.discountPercentage > 0
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(course.discountedPrice || course.price - (course.price * (course.discountPercentage / 100)))
    : null;
  
  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] pb-16">
      {/* Hero Section con gradiente y efecto de superposición */}
      <div className="relative overflow-hidden bg-[var(--neutral-900)] mb-8">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)] blur-[150px]"></div>
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)] blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="md:max-w-3xl">
              <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl md:text-5xl mb-4">
                {course.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                <div className="flex items-center text-[var(--neutral-300)]">
                  <div className="flex items-center mr-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--neutral-100)] text-sm">
                      {course.createdBy.name.charAt(0)}
                    </div>
                  </div>
                  <span>Por {course.createdBy.name}</span>
                </div>
                
                {averageRating > 0 && (
                  <div className="flex items-center text-[var(--neutral-300)]">
                    <div className="flex items-center space-x-1 mr-1">
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
                    </div>
                    <span>
                      {averageRating.toFixed(1)} ({course.reviews.length} {course.reviews.length === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </div>
                )}
                
                <div className="text-[var(--neutral-300)] flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>
                    {course.videos.length + 1} {course.videos.length + 1 === 1 ? 'video' : 'videos'}
                  </span>
                </div>
                
                <div className="text-[var(--neutral-300)] flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>Actualizado {new Date(course.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <p className="text-[var(--neutral-200)] text-lg max-w-3xl">
                {course.description.length > 180 
                  ? `${course.description.substring(0, 180)}...` 
                  : course.description}
              </p>
            </div>
            
            <div className="w-full md:w-auto">
              <div className="flex flex-col items-end">
                {course.onSale && formattedDiscountedPrice ? (
                  <>
                    <div className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm font-medium mb-2">
                      {course.discountPercentage}% DESCUENTO
                    </div>
                    <div className="flex items-center mb-4">
                      <span className="text-[var(--neutral-300)] line-through mr-3 text-lg">
                        {formattedPrice}
                      </span>
                      <div className="bg-[var(--primary)] text-[var(--neutral-100)] px-6 py-3 rounded-lg inline-flex items-center text-xl font-bold shadow-lg shadow-[var(--primary)]/20">
                        {formattedDiscountedPrice}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-[var(--primary)] text-[var(--neutral-100)] px-6 py-3 rounded-lg inline-flex items-center text-xl font-bold shadow-lg shadow-[var(--primary)]/20 mb-4">
                    {formattedPrice}
                  </div>
                )}
                
                <BuyButton 
                  courseId={course._id} 
                  userHasCourse={userHasCourse}
                  className="w-full md:w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal - 2/3 del ancho */}
          <div className="lg:col-span-2 space-y-10">
            {/* Reproductor de video o vista previa */}
            <div className="overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl">
              {userHasCourse && course.playbackId ? (
                <CourseViewer 
                  playbackId={course.playbackId}
                  videoId={course.videoId || ''}
                  courseId={course._id}
                  token={mainToken} 
                />
              ) : course.introPlaybackId ? (
                <div className="relative">
                  <div className="aspect-video w-full bg-[var(--neutral-900)]">
                    <MuxPlayer
                      playbackId={course.introPlaybackId}
                      title={`Introducción a ${course.title}`}
                      autoPlay={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent pointer-events-none">
                      <div className="flex justify-between items-center">
                        <div className="text-white pointer-events-none">
                          <p className="font-medium">Video de introducción</p>
                        </div>
                        <div className="pointer-events-auto">
                          <ScrollToEnrollButton className="py-2 px-4 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
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
                        <ScrollToEnrollButton />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Certificado de finalización (solo para usuarios inscritos) */}
            {userHasCourse && (
              <CertificateButton courseId={course._id} />
            )}
            
            {/* Descripción completa del curso */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Descripción del curso
              </h2>
              <div className="prose prose-lg max-w-none text-[var(--neutral-300)] prose-headings:text-[var(--neutral-100)] prose-a:text-[var(--primary-light)]">
                <p>{course.description}</p>
              </div>
            </div>
            
            {/* Listado de videos adicionales */}
            {userHasCourse && course.videos && course.videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Lecciones adicionales
                </h2>
                <div className="space-y-4">
                  {course.videos.map((video, index) => (
                    <div key={video._id} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] transition-all duration-300 hover:border-[var(--primary)] hover:shadow-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-dark)] text-[var(--neutral-100)] flex items-center justify-center font-medium mr-3 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--neutral-100)]">{video.title}</h3>
                            {video.description && (
                              <p className="text-[var(--neutral-400)] mt-1 text-sm">{video.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <CourseViewer 
                          playbackId={video.playbackId || ''} 
                          videoId={video.videoId || ''}
                          courseId={course._id}
                          token={videoTokens[video.playbackId] || ''} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Listado de ejercicios */}
            {course.exercises.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  Ejercicios del curso
                </h2>
                <div className="space-y-4">
                  {course.exercises.map((exercise, index) => (
                    <div key={exercise._id} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] transition-all duration-300 hover:border-[var(--secondary)] hover:shadow-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-[var(--secondary-dark)] text-[var(--neutral-100)] flex items-center justify-center font-medium mr-3 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--neutral-100)]">{exercise.title}</h3>
                            {exercise.description && (
                              <p className="text-[var(--neutral-400)] mt-1 text-sm">{exercise.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {userHasCourse && (
                          <a 
                            href={`/api/course-exercise?id=${exercise._id}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-[var(--neutral-100)] bg-[var(--secondary)] hover:bg-[var(--secondary-dark)] transition-colors duration-300 shadow-sm"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar PDF
                          </a>
                        )}
                      </div>
                      
                      {!userHasCourse && (
                        <div className="mt-3 text-[var(--neutral-500)] text-sm flex items-center">
                          <svg className="h-4 w-4 text-[var(--accent)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Este material estará disponible cuando compres el curso
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sección de reseñas */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                Reseñas del curso
              </h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <ReviewSection courseId={course._id} reviews={course.reviews} />
              </div>
            </div>
          </div>
          
          {/* Sidebar - 1/3 del ancho */}
          <div className="lg:col-span-1">
            <div id="enroll-section" className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  {course.onSale && formattedDiscountedPrice ? (
                    <div>
                      <div className="text-3xl font-bold text-[var(--accent)]">
                        {formattedDiscountedPrice}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-[var(--neutral-300)] line-through mr-2">
                          {formattedPrice}
                        </span>
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                          {course.discountPercentage}% OFF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-[var(--accent)]">
                      {formattedPrice}
                    </div>
                  )}
                </div>
                {userHasCourse && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    Inscrito
                  </span>
                )}
              </div>
              
              <div className="mb-6">
                <EnrollSection 
                  courseId={course._id} 
                  price={course.price} 
                  userHasCourse={userHasCourse}
                  onSale={course.onSale}
                  discountPercentage={course.discountPercentage}
                  discountedPrice={course.discountedPrice}
                />
              </div>
              
              <div className="mt-6 border-t border-[var(--border)] pt-6">
                <h3 className="text-lg font-semibold text-[var(--neutral-100)] mb-4">Este curso incluye:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-[var(--neutral-300)]">
                    <svg className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {course.videos.length > 0 
                      ? `${course.videos.length + 1} videos en total`
                      : 'Video principal del curso'
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
                    Acceso en la nube
                  </li>
                </ul>
              </div>
              
              <div className="mt-6 border-t border-[var(--border)] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--neutral-100)]">Compartir este curso</h3>
                </div>
                <div className="flex space-x-3">
                  <button className="p-2 rounded-full bg-[var(--neutral-800)] hover:bg-[var(--primary-dark)] text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </button>
                  <button className="p-2 rounded-full bg-[var(--neutral-800)] hover:bg-blue-700 text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full bg-[var(--neutral-800)] hover:bg-red-600 text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full bg-[var(--neutral-800)] hover:bg-green-600 text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7.253 18.494l.724.423A7.953 7.953 0 0012 19a8 8 0 10-8-8 7.95 7.95 0 00.797 3.463l.46.831-1.45 5.2 5.446-1.447zm1.45-5.809a.3.3 0 01-.286-.286c-.242-.642-.39-1.35-.442-2.065a6.955 6.955 0 01.23-2.174.3.3 0 01.286-.286h1.37a.3.3 0 01.286.286 6.96 6.96 0 01-.23 2.174.3.3 0 01-.286.286h-1.37zm5.348-3.773a.3.3 0 01-.286.287h-3.984a.3.3 0 01-.286-.287v-1.37a.3.3 0 01.286-.286h3.984a.3.3 0 01.286.286v1.37z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 