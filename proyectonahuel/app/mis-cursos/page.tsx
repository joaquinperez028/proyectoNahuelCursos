import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CourseCard from "@/components/CourseCard";

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
  };
  reviews: any[];
  createdAt: string;
  updatedAt: string;
}

async function getUserCourses(): Promise<CourseType[] | null> {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return null;
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return null;
    }
    
    const courses = await Course.find({
      _id: { $in: user.courses }
    }).populate('createdBy', 'name').lean();
    
    return courses.map((course: any) => ({
      ...course,
      _id: course._id ? course._id.toString() : '',
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      thumbnailUrl: course.thumbnailUrl || '',
      playbackId: course.playbackId || '',
      videoId: course.videoId || '',
      createdBy: {
        ...course.createdBy,
        _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
        name: course.createdBy?.name || ''
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
  const userCourses = await getUserCourses();
  
  if (userCourses === null) {
    redirect('/login');
  }
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Mis cursos
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Accede a los cursos que has comprado
          </p>
        </div>
        
        {userCourses.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No has comprado ningún curso todavía.</p>
            <a 
              href="/cursos" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Explorar cursos disponibles
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 