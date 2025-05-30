import { connectToDatabase } from "@/lib/mongodb";
import mongoose from 'mongoose';
import User from "@/models/User";
import Course from "@/models/Course";
import Review from "@/models/Review";
import CourseCard from "@/components/CourseCard";
import { Suspense } from 'react';
import Link from "next/link";
import type { NextPage } from 'next';
import CategoryDropdown from './components/CategoryDropdown';

// Cambiar a ISR para mejor rendimiento
export const revalidate = 300; // Revalidar cada 5 minutos

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
  category: string;
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

interface CategoryCount {
  [key: string]: number;
}

interface PaginatedResult {
  courses: CourseType[];
  totalPages: number;
  currentPage: number;
  totalCourses: number;
}

const COURSES_PER_PAGE = 12; // 12 cursos por página para mejor rendimiento

// Función optimizada para obtener cursos con paginación
async function getCourses(categoria?: string, page: number = 1): Promise<PaginatedResult> {
  try {
    await connectToDatabase();
    
    // Crear consulta base
    let query = {};
    
    // Si hay una categoría específica, filtrar por ella
    if (categoria) {
      query = { category: categoria };
    }
    
    // Calcular skip para paginación
    const skip = (page - 1) * COURSES_PER_PAGE;
    
    // Obtener total de cursos para paginación
    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
    
    // Obtener cursos con paginación - optimización: solo campos necesarios
    const courses = await Course.find(query)
      .select('title description price category thumbnailUrl playbackId introPlaybackId videoId onSale discountPercentage discountedPrice createdAt updatedAt createdBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(COURSES_PER_PAGE)
      .populate('createdBy', 'name')
      .lean();
    
    // Obtener reseñas solo para los cursos de esta página
    const courseIds = courses.map(course => course._id);
    const allReviews = await Review.find({ courseId: { $in: courseIds } })
      .select('rating courseId') // Solo campos necesarios para calcular promedio
      .lean();
    
    // Agrupar las reseñas por courseId y calcular promedio
    const reviewsByCoursesId: Record<string, { average: number; count: number }> = {};
    
    // Procesar las reseñas de manera más eficiente
    allReviews.forEach(review => {
      const courseId = review.courseId.toString();
      if (!reviewsByCoursesId[courseId]) {
        reviewsByCoursesId[courseId] = { average: 0, count: 0 };
      }
      reviewsByCoursesId[courseId].average += review.rating;
      reviewsByCoursesId[courseId].count += 1;
    });
    
    // Calcular promedios
    Object.keys(reviewsByCoursesId).forEach(courseId => {
      const data = reviewsByCoursesId[courseId];
      data.average = data.average / data.count;
    });
    
    const processedCourses = courses.map((course: any) => {
      const courseId = course._id.toString();
      const courseReviews = reviewsByCoursesId[courseId] || { average: 0, count: 0 };
      
      return {
        _id: courseId,
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        category: course.category || '',
        thumbnailUrl: course.thumbnailUrl || '',
        playbackId: course.playbackId || '',
        introPlaybackId: course.introPlaybackId || '',
        videoId: course.videoId || '',
        onSale: course.onSale || false,
        discountPercentage: course.discountPercentage || 0,
        discountedPrice: course.discountedPrice || null,
        createdBy: {
          _id: course.createdBy && course.createdBy._id ? course.createdBy._id.toString() : '',
          name: course.createdBy?.name || ''
        },
        // Simplificar reviews a solo lo necesario
        reviews: Array(courseReviews.count).fill({}).map((_, index) => ({
          rating: courseReviews.average
        })),
        averageRating: courseReviews.average,
        reviewCount: courseReviews.count,
        createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
    
    return {
      courses: processedCourses,
      totalPages,
      currentPage: page,
      totalCourses
    };
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return {
      courses: [],
      totalPages: 0,
      currentPage: 1,
      totalCourses: 0
    };
  }
}

// Función para obtener contadores de categorías
async function getCategoryCounts(): Promise<CategoryCount> {
  try {
    await connectToDatabase();
    
    // Obtener conteo por categoría
    const categoryCounts = await Course.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    
    // Convertir a un objeto para fácil acceso
    const counts: CategoryCount = {};
    let totalCount = 0;
    
    categoryCounts.forEach((item) => {
      counts[item._id] = item.count;
      totalCount += item.count;
    });
    
    // Agregar el total
    counts['total'] = totalCount;
    
    return counts;
  } catch (error) {
    console.error('Error al obtener conteo por categorías:', error);
    return {};
  }
}

// Página principal con soporte para filtros
interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CoursesPage({ params, searchParams }: PageProps) {
  // En Next.js 15, params y searchParams son Promise
  // Podemos acceder a ellos de forma síncrona por compatibilidad o con await
  const searchParamsResolved = await searchParams;
  const categoria = typeof searchParamsResolved?.categoria === 'string' ? searchParamsResolved.categoria : undefined;
  const page = typeof searchParamsResolved?.page === 'string' ? parseInt(searchParamsResolved.page) : 1;
  
  const courses = await getCourses(categoria, page);
  const categoryCounts = await getCategoryCounts();
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
            {categoria ? `Formaciones de ${categoria}` : 'Toda nuestra oferta'}
          </h1>
          <p className="mt-4 text-xl text-[var(--neutral-300)]">
            Explora nuestra selección de contenido educativo de alta calidad
          </p>
        </div>
        
        <CategoryDropdown categoriaActual={categoria} categoryCounts={categoryCounts} />
        
        {/* Indicador de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[var(--neutral-300)]">
            {courses.totalCourses > 0 ? (
              <>
                <span className="font-medium">{courses.totalCourses}</span> {courses.totalCourses === 1 ? 'formación encontrada' : 'formaciones encontradas'}
                {categoria && <span> en <span className="text-[var(--accent)]">{categoria}</span></span>}
                {courses.totalPages > 1 && (
                  <span className="text-sm"> • Página {courses.currentPage} de {courses.totalPages}</span>
                )}
              </>
            ) : (
              'No se encontraron resultados'
            )}
          </p>
          
          {categoria && (
            <Link 
              href="/cursos" 
              className="text-[var(--accent)] hover:underline flex items-center transition-all duration-200"
            >
              <span>Ver todo</span>
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
        
        {courses.courses.length === 0 ? (
          <div className="text-center py-10 bg-[var(--neutral-900)] rounded-lg border border-[var(--border)] shadow-md">
            <svg className="w-16 h-16 mx-auto text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-lg text-[var(--neutral-300)]">
              {categoria 
                ? `No hay contenido disponible en la categoría "${categoria}" en este momento.`
                : 'No hay contenido disponible en este momento.'
              }
            </p>
            {categoria && (
              <div className="mt-6">
                <Link 
                  href="/cursos"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)] transition-colors"
                >
                  Ver todo el catálogo
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            
            {/* Paginación */}
            {courses.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  {/* Botón Anterior */}
                  {courses.currentPage > 1 ? (
                    <Link
                      href={`/cursos?${new URLSearchParams({ 
                        ...(categoria && { categoria }), 
                        page: String(courses.currentPage - 1) 
                      }).toString()}`}
                      className="px-3 py-2 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--neutral-300)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-md bg-[var(--neutral-800)] text-[var(--neutral-500)] cursor-not-allowed">
                      Anterior
                    </span>
                  )}
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, courses.totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, courses.currentPage - 2) + i;
                    if (pageNumber > courses.totalPages) return null;
                    
                    return (
                      <Link
                        key={pageNumber}
                        href={`/cursos?${new URLSearchParams({ 
                          ...(categoria && { categoria }), 
                          page: String(pageNumber) 
                        }).toString()}`}
                        className={`px-3 py-2 rounded-md border transition-colors ${
                          pageNumber === courses.currentPage
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--card)] border-[var(--border)] text-[var(--neutral-300)] hover:bg-[var(--accent)] hover:text-white'
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  })}
                  
                  {/* Botón Siguiente */}
                  {courses.currentPage < courses.totalPages ? (
                    <Link
                      href={`/cursos?${new URLSearchParams({ 
                        ...(categoria && { categoria }), 
                        page: String(courses.currentPage + 1) 
                      }).toString()}`}
                      className="px-3 py-2 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--neutral-300)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-md bg-[var(--neutral-800)] text-[var(--neutral-500)] cursor-not-allowed">
                      Siguiente
                    </span>
                  )}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 