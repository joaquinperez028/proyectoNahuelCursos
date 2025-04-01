'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaPlay, FaLock, FaSpinner, FaShoppingCart } from 'react-icons/fa';
import VideoPlayer from '@/components/VideoPlayer';

interface CursoProps {
  params: {
    id: string;
  };
}

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  video?: string;
  videoPreview: string;
  fechaCreacion: string;
  categorias: string[];
}

export default function DetalleCurso({ params }: CursoProps) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingCompra, setLoadingCompra] = useState(false);
  const [tieneAcceso, setTieneAcceso] = useState(false);

  useEffect(() => {
    const obtenerCurso = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/cursos/${id}`);
        setCurso(response.data);
        setTieneAcceso(!!response.data.video);
      } catch (err) {
        console.error('Error al obtener curso:', err);
        setError('Ocurrió un error al cargar el curso. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    obtenerCurso();
  }, [id]);

  const handleComprarCurso = async () => {
    if (status === 'unauthenticated') {
      // Redirigir al login si el usuario no está autenticado
      router.push(`/auth/login?redirect=/cursos/${id}`);
      return;
    }
    
    try {
      setLoadingCompra(true);
      const response = await axios.post('/api/cursos/comprar', { cursoId: id });
      
      if (response.status === 200) {
        // Refrescar la página para mostrar el contenido completo del curso
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Error al comprar curso:', err);
      alert(err.response?.data?.error || 'Error al procesar la compra del curso');
    } finally {
      setLoadingCompra(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
          {error || 'No se pudo encontrar el curso solicitado'}
        </div>
        <button
          onClick={() => router.push('/cursos')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Volver a cursos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{curso.titulo}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {curso.categorias.map((categoria, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
              {categoria}
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contenido Principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              {tieneAcceso ? (
                <VideoPlayer src={curso.video!} controls={true} autoPlay={false} />
              ) : (
                <div className="relative">
                  <VideoPlayer src={curso.videoPreview} controls={true} autoPlay={false} />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center">
                      <FaLock className="text-white text-5xl mx-auto mb-4" />
                      <p className="text-white text-xl font-bold">Contenido Premium</p>
                      <p className="text-white mb-4">Adquiere este curso para acceder al contenido completo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Descripción del curso</h2>
              <p className="text-gray-700 whitespace-pre-line mb-6">{curso.descripcion}</p>
              
              {!tieneAcceso && (
                <div className="md:hidden mt-6">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-4">
                    <div className="font-bold text-xl mb-1">${curso.precio.toFixed(2)}</div>
                    <p className="text-sm mb-4">Acceso de por vida</p>
                    <button
                      onClick={handleComprarCurso}
                      disabled={loadingCompra}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center"
                    >
                      {loadingCompra ? (
                        <FaSpinner className="animate-spin mr-2" />
                      ) : (
                        <FaShoppingCart className="mr-2" />
                      )}
                      {loadingCompra ? 'Procesando...' : 'Comprar curso'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {!tieneAcceso ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-8">
              <div className="p-6">
                <div className="font-bold text-3xl text-gray-900 mb-2">${curso.precio.toFixed(2)}</div>
                <p className="text-gray-600 mb-6">Acceso de por vida al contenido del curso</p>
                <button
                  onClick={handleComprarCurso}
                  disabled={loadingCompra}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center"
                >
                  {loadingCompra ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaShoppingCart className="mr-2" />
                  )}
                  {loadingCompra ? 'Procesando...' : 'Comprar curso'}
                </button>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Este curso incluye:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <FaPlay className="text-blue-600 mt-1 mr-2" />
                      <span>Video curso completo</span>
                    </li>
                    <li className="flex items-start">
                      <FaPlay className="text-blue-600 mt-1 mr-2" />
                      <span>Acceso desde cualquier dispositivo</span>
                    </li>
                    <li className="flex items-start">
                      <FaPlay className="text-blue-600 mt-1 mr-2" />
                      <span>Actualizaciones gratuitas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl shadow-md overflow-hidden p-6">
              <div className="text-center">
                <div className="text-green-600 text-4xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">¡Ya tienes acceso!</h3>
                <p className="text-green-700 mb-0">
                  Disfruta del contenido completo del curso.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 