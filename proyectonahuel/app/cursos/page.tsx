import { connectDB } from "@/lib/mongodb";
import mongoose from 'mongoose';
import User from "@/models/User";
import Course from "@/models/Course";
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

async function getCourses(): Promise<CourseType[]> {
  try {
    await connectDB();
    console.log('Modelos registrados:', Object.keys(mongoose.models).join(', '));
    const courses = await Course.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name').lean();
    
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
    console.error('Error al obtener cursos:', error);
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Todos los cursos
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Explora nuestra selección de cursos de alta calidad
          </p>
        </div>
        
        {courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">No hay cursos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 