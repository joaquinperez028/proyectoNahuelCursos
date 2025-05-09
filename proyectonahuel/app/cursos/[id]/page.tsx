import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Review from "@/models/Review";
import User from "@/models/User";
import { createMuxPlaybackToken } from "@/lib/mux";
import CourseViewer from "@/components/CourseViewer";
import ReviewSection from "@/components/ReviewSection";
import EnrollSection from "@/components/EnrollSection";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = 'force-dynamic';

type CourseParams = {
  id: string;
};

type PageProps = {
  params: Promise<CourseParams>;
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
  videos: VideoType[];
  exercises: ExerciseType[];
  createdBy: {
    _id: string;
    name: string;
  };
  reviews: ReviewType[];
  createdAt: string;
  updatedAt: string;
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
      }))
    };
    
    return course;
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return null;
  }
}

export default async function CoursePage({ params }: PageProps) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const course = await getCourse(courseId);
  const userHasCourse = await getUserHasCourse(courseId);
  
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso no encontrado</h1>
          <p className="text-gray-600">El curso que buscas no existe o ha sido eliminado.</p>
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
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contenido principal - 2/3 del ancho */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              {course.title}
            </h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-sm text-gray-600">Por {course.createdBy.name}</div>
            </div>
            
            {/* Vista previa o reproductor completo según si el usuario ha comprado */}
            <div className="mb-8 overflow-hidden rounded-lg shadow-lg">
              {userHasCourse && course.playbackId && mainToken ? (
                <CourseViewer playbackId={course.playbackId} token={mainToken} />
              ) : (
                <div className="relative">
                  <div className="aspect-video w-full bg-black">
                    {course.hasThumbnailImage ? (
                      <img 
                        src={`/api/course-image?id=${course._id}`}
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white p-4">
                        <p className="text-xl font-bold mb-2">Vista previa no disponible</p>
                        <p>Compra este curso para acceder al contenido completo</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="prose prose-lg max-w-none mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción del curso</h2>
              <p className="text-gray-700">{course.description}</p>
            </div>
            
            {/* Listado de videos adicionales */}
            {course.videos.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Videos del curso</h2>
                <div className="space-y-4">
                  {course.videos.map((video) => (
                    <div key={video._id} className="border rounded-lg overflow-hidden bg-white">
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                        {video.description && (
                          <p className="text-gray-700 mt-1">{video.description}</p>
                        )}
                      </div>
                      
                      {userHasCourse && video.playbackId && videoTokens[video.playbackId] ? (
                        <div className="border-t">
                          <CourseViewer 
                            playbackId={video.playbackId} 
                            token={videoTokens[video.playbackId]} 
                          />
                        </div>
                      ) : (
                        <div className="border-t p-4 bg-gray-50">
                          <p className="text-gray-500 text-sm">
                            <svg className="inline-block h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Este video estará disponible cuando compres el curso
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Listado de ejercicios */}
            {course.exercises.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ejercicios del curso</h2>
                <div className="space-y-4">
                  {course.exercises.map((exercise) => (
                    <div key={exercise._id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                          {exercise.description && (
                            <p className="text-gray-700 mt-1">{exercise.description}</p>
                          )}
                        </div>
                        
                        {userHasCourse && (
                          <a 
                            href={`/api/course-exercise?id=${exercise._id}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar PDF
                          </a>
                        )}
                      </div>
                      
                      {!userHasCourse && (
                        <div className="mt-3 text-gray-500 text-sm">
                          <svg className="inline-block h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reseñas del curso</h2>
              <ReviewSection courseId={course._id} reviews={course.reviews} />
            </div>
          </div>
          
          {/* Sidebar - 1/3 del ancho */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="text-3xl font-bold text-gray-900 mb-4">
                ${course.price.toFixed(2)}
              </div>
              
              <EnrollSection 
                courseId={course._id} 
                price={course.price} 
                userHasCourse={userHasCourse} 
              />
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Este curso incluye:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {course.videos.length > 0 
                      ? `${course.videos.length + 1} videos en total`
                      : 'Video principal del curso'
                    }
                  </li>
                  {course.exercises.length > 0 && (
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {course.exercises.length} {course.exercises.length === 1 ? 'ejercicio en PDF' : 'ejercicios en PDF'}
                    </li>
                  )}
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acceso de por vida
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Certificado de finalización
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 