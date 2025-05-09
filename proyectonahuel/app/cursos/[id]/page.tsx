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
interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  playbackId?: string;
  videoId?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  reviews: ReviewType[];
  createdAt: string;
  updatedAt: string;
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
      playbackId: courseDoc.playbackId || '',
      videoId: courseDoc.videoId || '',
      createdBy: {
        _id: courseDoc.createdBy?._id ? courseDoc.createdBy._id.toString() : '',
        name: courseDoc.createdBy?.name || ''
      },
      createdAt: courseDoc.createdAt ? new Date(courseDoc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: courseDoc.updatedAt ? new Date(courseDoc.updatedAt).toISOString() : new Date().toISOString(),
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
  
  // Generar token para reproducción segura si el usuario ha comprado el curso
  const token = userHasCourse && course.playbackId ? createMuxPlaybackToken(course.playbackId as string) : null;
  
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
              {userHasCourse && course.playbackId && token ? (
                <CourseViewer playbackId={course.playbackId} token={token} />
              ) : (
                <div className="relative">
                  <div className="aspect-video w-full bg-black">
                    {course.thumbnailUrl && (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
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
                    Acceso completo al video
                  </li>
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