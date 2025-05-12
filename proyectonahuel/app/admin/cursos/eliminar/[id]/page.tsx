'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface PageProps<T = {}> {
  params: Promise<T>;
}

interface CourseParams {
  id: string;
}

export default function DeleteCoursePage({ params }: PageProps<CourseParams>) {
  const router = useRouter();
  const { data: session } = useSession();
  const [id, setId] = useState<string>('');
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener el ID del curso desde los parámetros (que ahora son una promesa)
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);
      } catch (err) {
        setError('Error al cargar los parámetros');
        setIsLoading(false);
      }
    };
    
    loadParams();
  }, [params]);

  useEffect(() => {
    // Redirige si no hay sesión o el usuario no es admin
    if (!session) {
      return;
    }
    
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (!id) {
      return; // Esperar a que el ID esté disponible
    }
    
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el curso');
        }
        
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        setError('Error al cargar el curso');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [id, router, session]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el curso');
      }
      
      // Redirigir al listado de cursos después de eliminar
      router.push('/admin/cursos');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el curso');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se pudo cargar el curso'}</p>
          <div className="mt-4">
            <Link href="/admin/cursos" className="text-blue-600 hover:underline">
              Volver al listado de cursos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Eliminar curso</h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Advertencia</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Esta acción no se puede deshacer. Se eliminará permanentemente el curso <strong>{course.title}</strong> y todos sus recursos asociados.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-2 line-clamp-2">{course.description}</p>
              <p className="text-sm text-gray-500">Precio: ${course.price}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-700">¿Estás seguro de que deseas eliminar este curso?</p>
              <p className="text-sm text-red-600">Los estudiantes perderán acceso a este contenido.</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/cursos"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </>
              ) : (
                'Eliminar curso'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 