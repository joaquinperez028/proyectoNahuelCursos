'use client';

import { useState, useEffect } from 'react';
import CourseCard from '@/components/CourseCard';

interface CourseType {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  playbackId: string;
  createdBy: {
    _id: string;
    name: string;
  };
  featured: boolean;
  reviews: any[];
  introPlaybackId?: string;
}

// Componente Skeleton simple
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-600 ${className}`}></div>;
}

export default function FeaturedCoursesPage() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const response = await fetch('/api/courses/featured');
        if (!response.ok) {
          throw new Error('Error al cargar los cursos destacados');
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
            Cursos destacados
          </h1>
          <p className="mt-4 text-xl text-[var(--neutral-300)]">
            Nuestra selección especial de los mejores cursos
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex flex-col space-y-3">
                <Skeleton className="h-52 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-[var(--neutral-300)]">No hay cursos destacados disponibles en este momento.</p>
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