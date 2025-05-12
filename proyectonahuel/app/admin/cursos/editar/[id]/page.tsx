'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface PageProps<T = {}> {
  params: Promise<T>;
}

interface EditCourseParams {
  id: string;
}

export default function EditCoursePage({ params }: PageProps<EditCourseParams>) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [id, setId] = useState<string>('');
  
  // Estado para los campos del formulario
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  
  // Estado para el manejo de la UI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Resolver el parámetro ID
  useEffect(() => {
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

  // Comprobar autenticación y permisos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (session?.user?.role !== 'admin' && status === 'authenticated') {
      router.push('/');
    }
  }, [session, status, router]);

  // Cargar datos del curso cuando id esté disponible
  useEffect(() => {
    if (!id) return;
    
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el curso');
        }
        
        const course = await response.json();
        
        // Cargar datos en el formulario
        setTitle(course.title || '');
        setDescription(course.description || '');
        setPrice(course.price || 0);
        
      } catch (error) {
        setError('Error al cargar el curso');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [id]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    // Validación básica
    if (!title.trim()) {
      setError('El título del curso es obligatorio');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const courseData = {
        title,
        description,
        price
      };
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el curso');
      }
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/admin/cursos');
        router.refresh();
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Error al actualizar el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar curso</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">Curso actualizado correctamente. Redirigiendo...</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título del curso
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Programación con JavaScript avanzado"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe de qué trata el curso..."
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Precio (USD)
            </label>
            <input
              type="number"
              id="price"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Precio del curso"
            />
            <p className="mt-1 text-sm text-gray-500">Establecer a 0 para cursos gratuitos</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/cursos"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 