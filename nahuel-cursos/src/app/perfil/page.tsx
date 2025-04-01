'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaPlay, FaSpinner, FaUser, FaEnvelope } from 'react-icons/fa';

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  videoPreview: string;
}

export default function Perfil() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [cursosComprados, setCursosComprados] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      obtenerCursosComprados();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/perfil');
    }
  }, [status, router]);

  const obtenerCursosComprados = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/usuario/cursos');
      setCursosComprados(response.data.cursos);
      setError('');
    } catch (err) {
      console.error('Error al obtener cursos comprados:', err);
      setError('Ocurrió un error al cargar tus cursos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  // No renderizar el contenido hasta estar autenticado
  if (status === 'unauthenticated') {
    return null; // Se redirigirá en el useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-lg text-gray-600">
          Bienvenido a tu área personal
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Información del perfil */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FaUser className="text-blue-600 text-4xl" />
              </div>
              <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
              <div className="flex items-center mt-2 text-gray-600">
                <FaEnvelope className="mr-2" />
                <span>{session?.user?.email}</span>
              </div>
            </div>
            
            {session?.user?.role === 'admin' && (
              <div className="mt-4 border-t pt-4">
                <Link 
                  href="/admin" 
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Panel de Administración
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mis cursos */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Mis Cursos</h2>
              
              {error && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}
              
              {cursosComprados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-6">Aún no has comprado ningún curso</p>
                  <Link 
                    href="/cursos" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Explorar cursos
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cursosComprados.map((curso) => (
                    <div 
                      key={curso._id} 
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img 
                          src={curso.videoPreview} 
                          alt={curso.titulo}
                          className="object-cover w-full h-48"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{curso.titulo}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {curso.descripcion}
                        </p>
                        <Link 
                          href={`/cursos/${curso._id}`}
                          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FaPlay className="mr-2" /> Ver curso
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 