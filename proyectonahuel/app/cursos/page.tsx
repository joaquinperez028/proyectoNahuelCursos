import { connectDB } from "@/lib/mongodb";
import mongoose from 'mongoose';
import User from "@/models/User";
import Course from "@/models/Course";
import Review from "@/models/Review";
import CourseCard from "@/components/CourseCard";
import { Suspense } from 'react';
import Link from "next/link";
import type { NextPage } from 'next';

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

// Función para obtener la categoría de la URL
async function getCourses(categoria?: string): Promise<CourseType[]> {
  try {
    await connectDB();
    console.log('Modelos registrados:', Object.keys(mongoose.models).join(', '));
    
    // Crear consulta base
    let query = {};
    
    // Si hay una categoría específica, filtrar por ella
    if (categoria) {
      query = { category: categoria };
    }
    
    // Obtener cursos con el creador
    const courses = await Course.find(query)
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
        category: course.category || '',
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

// Función para obtener contadores de categorías
async function getCategoryCounts(): Promise<CategoryCount> {
  try {
    await connectDB();
    
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

// Componente para el filtro de categorías
function CategoryFilter({ categoriaActual, categoryCounts }: { categoriaActual?: string, categoryCounts: CategoryCount }) {
  const categorias = [
    'Análisis Técnico',
    'Análisis Fundamental',
    'Estrategias de Trading',
    'Finanzas Personales'
  ];
  
  return (
    <div className="mb-8 bg-[var(--neutral-900)] p-6 rounded-lg shadow-lg border border-[var(--border)]">
      <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-4">Filtrar por categoría</h3>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cursos"
          className={`px-4 py-2 rounded-full text-sm flex items-center transition-all duration-300 ${
            !categoriaActual
              ? 'bg-[var(--accent)] text-white shadow-md transform scale-105'
              : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] hover:bg-[var(--neutral-700)] hover:shadow-md hover:scale-105'
          }`}
        >
          <span>Todos</span>
          {categoryCounts['total'] !== undefined && (
            <span className="ml-2 bg-black bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
              {categoryCounts['total']}
            </span>
          )}
        </Link>
        
        {categorias.map((categoria) => (
          <Link
            key={categoria}
            href={`/cursos?categoria=${encodeURIComponent(categoria)}`}
            className={`px-4 py-2 rounded-full text-sm flex items-center transition-all duration-300 ${
              categoriaActual === categoria
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105'
                : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] hover:bg-[var(--neutral-700)] hover:shadow-md hover:scale-105'
            }`}
          >
            <span>{categoria}</span>
            {categoryCounts[categoria] !== undefined && (
              <span className={`ml-2 ${
                categoriaActual === categoria 
                  ? 'bg-black bg-opacity-20' 
                  : 'bg-[var(--neutral-700)]'
              } px-1.5 py-0.5 rounded-full text-xs`}>
                {categoryCounts[categoria]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Página principal con soporte para filtros
interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CoursesPage({ params, searchParams }: PageProps) {
  // En Next.js 15 podemos seguir accediendo de forma síncrona por compatibilidad,
  // pero en futuras versiones será una promesa
  const categoria = typeof searchParams?.categoria === 'string' ? searchParams.categoria : undefined;
  const courses = await getCourses(categoria);
  const categoryCounts = await getCategoryCounts();
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
            {categoria ? `Cursos de ${categoria}` : 'Todos los cursos'}
          </h1>
          <p className="mt-4 text-xl text-[var(--neutral-300)]">
            Explora nuestra selección de cursos de alta calidad
          </p>
        </div>
        
        <CategoryFilter categoriaActual={categoria} categoryCounts={categoryCounts} />
        
        {/* Indicador de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[var(--neutral-300)]">
            {courses.length > 0 ? (
              <>
                <span className="font-medium">{courses.length}</span> {courses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
                {categoria && <span> en <span className="text-[var(--accent)]">{categoria}</span></span>}
              </>
            ) : (
              'No se encontraron cursos'
            )}
          </p>
          
          {categoria && (
            <Link 
              href="/cursos" 
              className="text-[var(--accent)] hover:underline flex items-center transition-all duration-200"
            >
              <span>Ver todos los cursos</span>
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
        
        {courses.length === 0 ? (
          <div className="text-center py-10 bg-[var(--neutral-900)] rounded-lg border border-[var(--border)] shadow-md">
            <svg className="w-16 h-16 mx-auto text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-lg text-[var(--neutral-300)]">
              {categoria 
                ? `No hay cursos disponibles en la categoría "${categoria}" en este momento.`
                : 'No hay cursos disponibles en este momento.'
              }
            </p>
            {categoria && (
              <div className="mt-6">
                <Link 
                  href="/cursos"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)] transition-colors"
                >
                  Ver todos los cursos
                </Link>
              </div>
            )}
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