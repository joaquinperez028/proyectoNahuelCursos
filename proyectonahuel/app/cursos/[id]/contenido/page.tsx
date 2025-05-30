import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import CourseViewer from "@/components/CourseViewer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { notFound, redirect } from 'next/navigation';
import CourseContentPagination from '@/components/CourseContentPagination';
import CourseProgress from '@/components/CourseProgress';
import Link from 'next/link';

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
    
    const userDoc = await User.findOne({ email: session.user.email });
    
    if (!userDoc || !userDoc.courses) {
      return false;
    }
    
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
    
    const courseDoc = await Course.findById(id).populate('createdBy', 'name');
    
    if (!courseDoc) {
      return null;
    }
    
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
      
      videos: Array.isArray(courseDoc.videos) 
        ? courseDoc.videos.map((video: any) => ({
            _id: video._id.toString(),
            title: video.title || '',
            description: video.description || '',
            videoId: video.videoId || '',
            playbackId: video.playbackId || '',
            order: video.order || 0,
            duration: video.duration || 0
          })).sort((a: any, b: any) => a.order - b.order)
        : [],
      
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

export default async function CourseContentPage({ params }: PageProps<CourseParams>) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const course = await getCourse(courseId);
  const userHasCourse = await getUserHasCourse(courseId);
  
  // Si el curso no existe
  if (!course) {
    notFound();
  }
  
  // Si el usuario no tiene acceso al curso, redirigir a la página de detalle
  if (!userHasCourse) {
    redirect(`/cursos/${courseId}`);
  }
  
  // Los videos siempre están en modo público
  const videoTokens: Record<string, string> = {};
  
  // Unificar videos y ejercicios en un solo array ordenado por 'order'
  const itemsOrdenados = [
    ...course.videos.map(v => ({ ...v, tipo: 'video' as const })),
    ...course.exercises.map(e => ({ ...e, tipo: 'ejercicio' as const }))
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-[var(--background)] min-h-screen">
      {/* Header de la página de contenido */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/cursos/${courseId}`}
                className="p-2 rounded-lg bg-[var(--neutral-800)] hover:bg-[var(--neutral-700)] text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[var(--neutral-100)]">{course.title}</h1>
                <p className="text-[var(--neutral-400)] text-sm">Contenido del curso</p>
              </div>
            </div>
            
            {/* Progreso en header */}
            <div className="hidden md:flex items-center space-x-4">
              <CourseProgress courseId={course._id} userHasCourse={userHasCourse} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video principal - ocupa 3 columnas */}
          <div className="lg:col-span-3">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden mb-8">
              {(() => {
                // Usar el video principal del curso
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
              })()}
            </div>

            {/* Descripción del curso */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-[var(--neutral-100)] mb-4">Sobre esta formación</h2>
              <div className="prose prose-lg max-w-none text-[var(--neutral-300)] prose-headings:text-[var(--neutral-100)] prose-a:text-[var(--primary-light)]">
                <p>{course.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar con lista de contenido - ocupa 1 columna */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl p-6 sticky top-4">
              <h3 className="text-lg font-bold text-[var(--neutral-100)] mb-4">Contenido del curso</h3>
              
              {/* Progreso móvil */}
              <div className="md:hidden mb-6">
                <CourseProgress courseId={course._id} userHasCourse={userHasCourse} />
              </div>

              {/* Lista de contenido */}
              {itemsOrdenados.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {itemsOrdenados.map((item, index) => (
                    <div key={item._id} className="p-3 bg-[var(--neutral-800)] rounded-lg hover:bg-[var(--neutral-700)] transition-colors cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {item.tipo === 'video' ? (
                            <svg className="w-5 h-5 text-[var(--accent)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-[var(--accent)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[var(--neutral-100)] truncate">
                            {index + 1}. {item.title}
                          </h4>
                          <p className="text-xs text-[var(--neutral-400)] mt-1">
                            {item.tipo === 'video' ? 'Video' : 'Ejercicio PDF'}
                            {item.tipo === 'video' && 'duration' in item && item.duration && 
                              ` • ${item.duration} min`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--neutral-400)] text-sm">No hay contenido adicional disponible.</p>
              )}
            </div>
          </div>
        </div>

        {/* Contenido paginado en la parte inferior */}
        {itemsOrdenados.length > 0 && (
          <div className="mt-12">
            <CourseContentPagination 
              items={itemsOrdenados}
              courseId={course._id}
              videoTokens={videoTokens}
              userHasCourse={userHasCourse}
              itemsPerPage={10}
            />
          </div>
        )}
      </div>
    </div>
  );
} 