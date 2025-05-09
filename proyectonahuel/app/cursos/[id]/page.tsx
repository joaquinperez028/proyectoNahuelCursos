import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Review from "@/models/Review";
import User from "@/models/User";
import { createMuxPlaybackToken } from "@/lib/mux";
import CourseViewer from "@/components/CourseViewer";
import ReviewSection from "@/components/ReviewSection";
import EnrollSection from "@/components/EnrollSection";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

type CourseParams = {
  id: string;
};

type PageProps = {
  params: Promise<CourseParams>;
};

async function getUserHasCourse(courseId: string) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return false;
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return false;
    }
    
    return user.courses.some((id: any) => id.toString() === courseId);
  } catch (error) {
    console.error('Error al verificar si el usuario tiene el curso:', error);
    return false;
  }
}

async function getCourse(id: string) {
  try {
    await connectDB();
    const course = await Course.findById(id).populate('createdBy', 'name').lean();
    
    if (!course) {
      return null;
    }
    
    const reviews = await Review.find({ courseId: id })
      .populate('userId', 'name image')
      .sort({ createdAt: -1 })
      .lean();
    
    return {
      ...course,
      _id: course._id.toString(),
      createdBy: {
        ...course.createdBy,
        _id: course.createdBy._id.toString(),
      },
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      reviews: reviews.map((review: any) => ({
        ...review,
        _id: review._id.toString(),
        userId: {
          ...review.userId,
          _id: review.userId._id.toString(),
        },
        courseId: review.courseId.toString(),
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      })),
    };
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
  const token = userHasCourse ? createMuxPlaybackToken(course.playbackId) : null;
  
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
              {userHasCourse ? (
                <CourseViewer playbackId={course.playbackId} token={token as string} />
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