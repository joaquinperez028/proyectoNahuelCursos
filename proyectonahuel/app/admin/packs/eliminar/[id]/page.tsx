"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Pack {
  _id: string;
  name: string;
  description: string;
  courses: { _id: string; title: string }[];
}

export default function DeletePackPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pack, setPack] = useState<Pack | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener el ID del pack de la URL
  const getPackId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    }
    return null;
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    const packId = getPackId();
    if (!packId) {
      setError('ID del pack no encontrado');
      setIsLoading(false);
      return;
    }
    
    const fetchPack = async () => {
      try {
        const response = await fetch(`/api/packs/${packId}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el pack');
        }
        
        const data = await response.json();
        setPack(data);
      } catch (error) {
        setError('Error al cargar el pack');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPack();
  }, [router, session]);

  const handleDelete = async () => {
    const packId = getPackId();
    if (!packId) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/packs/${packId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el pack');
      }
      
      router.push('/admin/packs');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el pack');
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

  if (error || !pack) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se pudo cargar el pack'}</p>
          <div className="mt-4">
            <Link href="/admin/packs" className="text-blue-600 hover:underline">
              Volver al listado de packs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Eliminar Pack: {pack.name}
          </h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Detalles del pack:</h3>
            <p className="text-gray-600 mb-4">{pack.description}</p>
            
            <h4 className="text-md font-semibold text-gray-700 mb-2">Cursos incluidos:</h4>
            <ul className="list-disc list-inside text-gray-600 mb-4">
              {pack.courses.map(course => (
                <li key={course._id}>{course.title}</li>
              ))}
            </ul>
            
            <div className="space-y-2">
              <p className="text-gray-700">¿Estás seguro de que deseas eliminar este pack?</p>
              <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/packs"
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
                'Eliminar pack'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 