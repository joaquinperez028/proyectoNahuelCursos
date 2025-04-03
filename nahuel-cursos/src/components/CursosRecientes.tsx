'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaArrowRight, FaPlayCircle, FaVideo } from 'react-icons/fa';
import ValoracionEstrellas from './ValoracionEstrellas';
import Image from 'next/image';

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

// Componente para la vista previa de video con manejo de errores
function VideoPreview({ url, titulo }: { url: string; titulo: string }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Función para validar URL de video (YouTube, Vimeo, etc.)
  const esURLVideoValida = (url: string): boolean => {
    const patronesURL = [
      /^https?:\/\/(www\.)?youtube\.com\/embed\//,
      /^https?:\/\/player\.vimeo\.com\/video\//,
      /^https?:\/\/(www\.)?dailymotion\.com\/embed\/video\//
    ];
    
    return patronesURL.some(patron => patron.test(url));
  };
  
  // Si la URL no es válida, mostrar un placeholder
  if (!url || !esURLVideoValida(url)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-100">
        <div className="text-center">
          <FaVideo className="text-4xl text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-blue-700">Vista previa no disponible</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
          <FaSpinner className="animate-spin text-2xl text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
          <div className="text-center">
            <FaPlayCircle className="text-4xl text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-700">Clic para reproducir</p>
          </div>
        </div>
      )}
      
      <iframe 
        src={url}
        className="w-full h-full absolute inset-0"
        title={titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        style={{ opacity: loading || error ? 0 : 1 }}
      />
    </>
  );
}

export default function CursosRecientes() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [esReciente, setEsReciente] = useState(false);
  const haReintentado = useRef(false);
  
  // Función para obtener los cursos con reintentos
  const obtenerCursosRecientes = async (esReintento = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cursos/recientes');
      setCursos(response.data.cursos);
      setEsReciente(response.data.esReciente);
      setError('');
    } catch (err) {
      console.error('Error al obtener cursos recientes:', err);
      
      // Si no hay cursos, podemos intentar sembrar datos de ejemplo (solo si eres admin)
      if (!haReintentado.current && esReintento) {
        haReintentado.current = true;
        try {
          // Intentar sembrar datos (solo funcionará si el usuario es admin)
          await axios.get('/api/seed');
          // Esperar un momento y reintentar obtener cursos
          setTimeout(() => obtenerCursosRecientes(), 1500);
          return;
        } catch (seedError) {
          console.error('Error al intentar sembrar datos:', seedError);
        }
      }
      
      setError('No se pudieron cargar los cursos recientes');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    obtenerCursosRecientes();
  }, []);
  
  // Botón para reintentar con siembra de datos (solo visible para administradores)
  const handleRetry = () => {
    obtenerCursosRecientes(true);
  };
  
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
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reintentar carga
        </button>
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
                <div className="w-full h-48 bg-blue-100 relative">
                  <VideoPreview url={curso.videoPreview} titulo={curso.titulo} />
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