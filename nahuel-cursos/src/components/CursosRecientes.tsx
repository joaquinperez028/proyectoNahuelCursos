'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaArrowRight } from 'react-icons/fa';
import ValoracionEstrellas from './ValoracionEstrellas';

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  videoPreview: string;
  fechaCreacion: string;
  calificacionPromedio?: number;
  totalValoraciones?: number;
}

export default function CursosRecientes() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [esReciente, setEsReciente] = useState(false);
  
  useEffect(() => {
    const obtenerCursosRecientes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cursos/recientes');
        setCursos(response.data.cursos);
        setEsReciente(response.data.esReciente);
      } catch (err) {
        console.error('Error al obtener cursos recientes:', err);
        setError('No se pudieron cargar los cursos recientes');
      } finally {
        setLoading(false);
      }
    };
    
    obtenerCursosRecientes();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg">
        {error}
      </div>
    );
  }
  
  if (cursos.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            {esReciente ? 'Últimos cursos añadidos' : 'Nuestro curso más reciente'}
          </h2>
          <Link 
            href="/cursos" 
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todos
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cursos.map((curso) => (
            <Link href={`/cursos/${curso._id}`} key={curso._id} className="block">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="w-full h-48 bg-blue-100">
                  <iframe 
                    src={curso.videoPreview} 
                    className="w-full h-full object-cover"
                    title={curso.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{curso.titulo}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{curso.descripcion}</p>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-bold">${curso.precio.toFixed(2)}</span>
                      {curso.calificacionPromedio !== undefined && (
                        <ValoracionEstrellas 
                          calificacion={curso.calificacionPromedio} 
                          totalValoraciones={curso.totalValoraciones} 
                          tamano="sm" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 