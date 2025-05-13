import { connectDB } from "@/lib/mongodb";
import mongoose from 'mongoose';
import User from "@/models/User";
import Course from "@/models/Course";
import Review from "@/models/Review";
import CourseCard from "@/components/CourseCard";

export const dynamic = 'force-dynamic';

interface ReviewType {
  _id: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  userId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    image?: string;
  };
  courseId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  playbackId: string;
  introPlaybackId?: string;
  videoId: string;
  createdBy: {
    _id: string;
    name: string;
  };
  reviews: any[];
  createdAt: string;
  updatedAt: string;
  onSale?: boolean;
  discountPercentage?: number;
  discountedPrice?: number;
}

async function getCourses(): Promise<CourseType[]> {
  try {
    await connectDB();
    console.log('Modelos registrados:', Object.keys(mongoose.models).join(', '));
    
    // Obtener cursos con el creador
    const courses = await Course.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();
    
    // Obtener todas las reseñas para los cursos encontrados
    const courseIds = courses.map(course => course._id);
    const allReviews = await Review.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name image')
      .lean();
    
    // Agrupar las reseñas por courseId para facilitar el mapeo
    const reviewsByCoursesId: Record<string, any[]> = {};
    
    // Procesar las reseñas y agruparlas por ID de curso
    allReviews.forEach(review => {
      const courseId = review.courseId.toString();
      if (!reviewsByCoursesId[courseId]) {
        reviewsByCoursesId[courseId] = [];
      }
      reviewsByCoursesId[courseId].push(review);
    });
    
    return courses.map((course: any) => {
      const courseId = course._id.toString();
      const courseReviews = reviewsByCoursesId[courseId] || [];
      
      return {
        ...course,
        _id: courseId,
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        thumbnailUrl: course.thumbnailUrl || '',
        playbackId: course.playbackId || '',
        introPlaybackId: course.introPlaybackId || '',
        videoId: course.videoId || '',
        onSale: course.onSale || false,
        discountPercentage: course.discountPercentage || 0,
        discountedPrice: course.discountedPrice || null,
        createdBy: {
          ...course.createdBy,
          _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
          name: course.createdBy?.name || ''
        },
        reviews: courseReviews.map((review: any) => ({
          _id: review._id.toString(),
          rating: review.rating || 0,
          comment: review.comment || '',
          userId: {
            _id: review.userId?._id ? review.userId._id.toString() : '',
            name: review.userId?.name || '',
            image: review.userId?.image || ''
          },
          createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString()
        })),
        createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
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
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
            Todos los cursos
          </h1>
          <p className="mt-4 text-xl text-[var(--neutral-300)]">
            Explora nuestra selección de cursos de alta calidad
          </p>
        </div>
        
        {courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--neutral-300)]">No hay cursos disponibles en este momento.</p>
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