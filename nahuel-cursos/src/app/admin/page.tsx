'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

interface Curso {
  _id: string;
  titulo: string;
  precio: number;
  fechaCreacion: string;
}

export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el usuario es administrador
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        // Redirigir si no es administrador
        router.push('/');
      } else {
        obtenerCursos();
      }
    } else if (status === 'unauthenticated') {
      // Redirigir al login si no está autenticado
      router.push('/auth/login?redirect=/admin');
    }
  }, [status, session, router]);

  const obtenerCursos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cursos?pagina=1&porPagina=100');
      setCursos(response.data.cursos);
      setError('');
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setError('Ocurrió un error al cargar los cursos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarCurso = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setEliminando(id);
      await axios.delete(`/api/cursos/${id}`);
      setCursos(cursos.filter(curso => curso._id !== id));
    } catch (err: any) {
      console.error('Error al eliminar curso:', err);
      alert(err.response?.data?.error || 'Error al eliminar el curso');
    } finally {
      setEliminando(null);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  // No renderizar el contenido hasta estar seguro que es admin
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null; // Se redirigirá en el useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <Link 
          href="/admin/cursos/nuevo" 
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus className="mr-2" /> Nuevo Curso
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Cursos</h2>
          
          {cursos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay cursos disponibles. ¡Crea tu primer curso!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cursos.map((curso) => (
                    <tr key={curso._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {curso.titulo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${curso.precio.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(curso.fechaCreacion).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <Link
                            href={`/admin/cursos/${curso._id}/editar`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="text-lg" />
                          </Link>
                          <button
                            onClick={() => eliminarCurso(curso._id)}
                            disabled={eliminando === curso._id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {eliminando === curso._id ? (
                              <FaSpinner className="animate-spin text-lg" />
                            ) : (
                              <FaTrash className="text-lg" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 