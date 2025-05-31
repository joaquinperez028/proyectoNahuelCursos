import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = 'force-dynamic';

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  playbackId: string;
  videoId: string;
  createdBy: {
    _id: string;
    name: string;
    image: string;
  };
  reviews: any[];
  createdAt: string;
  updatedAt: string;
}

async function getUserCourses(): Promise<CourseType[] | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }
    
    await connectToDatabase();
    
    const userDoc = await User.findOne({ email: session.user.email });
    
    if (!userDoc) {
      return null;
    }
    
    const courseIds = userDoc.courses || [];
    
    const courses = await Course.find({
      _id: { $in: courseIds }
    }).populate('createdBy', 'name image').lean();
    
    return courses.map((course: any) => ({
      _id: course._id ? course._id.toString() : '',
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      thumbnailUrl: course.thumbnailUrl || '',
      playbackId: course.playbackId || '',
      videoId: course.videoId || '',
      createdBy: {
        _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
        name: course.createdBy?.name || '',
        image: course.createdBy?.image || ''
      },
      reviews: course.reviews || [],
      createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error al obtener los cursos del usuario:', error);
    return [];
  }
}

export default async function MisCursosPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  try {
    await connectToDatabase();
    const userCourses = await getUserCourses();
    
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
              Mis cursos
            </h1>
            <p className="mt-4 text-xl text-[var(--neutral-300)]">
              Accede a los cursos que has comprado
            </p>
          </div>
          
          {userCourses?.length === 0 ? (
            <div className="text-center py-10 bg-[var(--card)] rounded-lg">
              <p className="text-[var(--neutral-300)] mb-4">No has comprado ningún curso todavía.</p>
              <a 
                href="/cursos" 
                className="inline-block bg-[var(--primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-dark)] transition-colors"
              >
                Explorar cursos disponibles
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {userCourses?.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error al obtener los cursos del usuario:', error);
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
              Error al obtener los cursos
            </h1>
            <p className="mt-4 text-xl text-[var(--neutral-300)]">
              Por favor, intenta más tarde.
            </p>
          </div>
          
          <div className="text-center py-10 bg-[var(--card)] rounded-lg">
            <a 
              href="/login" 
              className="inline-block bg-[var(--primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-dark)] transition-colors"
            >
              Volver a iniciar sesión
            </a>
          </div>
        </div>
      </div>
    );
  }
} 