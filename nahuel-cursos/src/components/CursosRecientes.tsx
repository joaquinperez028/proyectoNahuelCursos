'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaArrowRight, FaPlayCircle, FaVideo, FaSyncAlt } from 'react-icons/fa';
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

// Componente optimizado para la vista previa de video con mejor manejo de errores
function VideoPreview({ url, titulo, className = '' }: { url: string; titulo: string; className?: string }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [retry, setRetry] = useState(0);
  
  // Función para validar URL de video (YouTube, Vimeo, etc.)
  const esURLVideoValida = (url: string): boolean => {
    if (!url) return false;
    
    const patronesURL = [
      /^https?:\/\/(www\.)?youtube\.com\/embed\//,
      /^https?:\/\/player\.vimeo\.com\/video\//,
      /^https?:\/\/(www\.)?dailymotion\.com\/embed\/video\//
    ];
    
    return patronesURL.some(patron => patron.test(url));
  };
  
  // Reintentar cargar el video
  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetry(prev => prev + 1);
    
    // Recargar el iframe
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
    }
  };
  
  // Si la URL no es válida, mostrar un placeholder
  if (!url || !esURLVideoValida(url)) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-blue-100 ${className}`}>
        <div className="text-center p-2">
          <FaVideo className="text-4xl text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-blue-700">Vista previa no disponible</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 z-10">
          <FaSpinner className="animate-spin text-2xl text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 z-10">
          <div className="text-center">
            <FaPlayCircle className="text-4xl text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-700 mb-2">Error al cargar el video</p>
            <button 
              onClick={handleRetry}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full flex items-center mx-auto"
            >
              <FaSyncAlt className="mr-1" size={10} /> Reintentar
            </button>
          </div>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        key={`video-${retry}`}
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
    </div>
  );
}

export default function CursosRecientes() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [esReciente, setEsReciente] = useState(false);
  const haReintentado = useRef(false);
  const [generandoDatos, setGenerandoDatos] = useState(false);
  const [intentosDeConexion, setIntentosDeConexion] = useState(0);
  const intentosMaximos = 3;
  
  // Función para obtener los cursos con reintentos
  const obtenerCursosRecientes = async (esReintento = false) => {
    try {
      setLoading(true);
      setError('');
      setErrorDetail('');
      
      console.log('Solicitando cursos recientes a la API...');
      const response = await axios.get('/api/cursos/recientes');
      console.log('Respuesta recibida:', response.data);
      
      setCursos(response.data.cursos);
      setEsReciente(response.data.esReciente);
    } catch (err: any) {
      console.error('Error al obtener cursos recientes:', err);
      setIntentosDeConexion(prev => prev + 1);
      
      // Extraer el mensaje de error detallado si está disponible
      let mensajeError = 'No se pudieron cargar los cursos recientes';
      let detalleError = '';
      
      if (err.response?.data?.error) {
        mensajeError = err.response.data.error;
        detalleError = err.response.data.detalle || '';
      } else if (err.message) {
        detalleError = err.message;
      }
      
      setError(mensajeError);
      setErrorDetail(detalleError);
      
      // Si no hay cursos y es un reintento, podemos intentar sembrar datos de ejemplo
      if (!haReintentado.current && esReintento) {
        haReintentado.current = true;
        try {
          // Intentar sembrar datos
          setGenerandoDatos(true);
          console.log('Intentando generar datos de ejemplo...');
          
          // Agregar un parámetro de cache-busting para evitar problemas de caché
          const timestamp = new Date().getTime();
          const respuestaSeed = await axios.get(`/api/seed-public?t=${timestamp}`);
          
          console.log('Respuesta de generación de datos:', respuestaSeed.data);
          
          // Esperar un momento y reintentar obtener cursos
          console.log('Esperando para reintentar obtener cursos...');
          setTimeout(async () => {
            try {
              // Intentar verificar si los datos fueron creados
              const healthCheck = await axios.get('/api/health');
              console.log('Servicio disponible:', healthCheck.data);
              
              // Reintentar obtener cursos
              obtenerCursosRecientes();
            } catch (error) {
              console.error('Error en la verificación posterior:', error);
              obtenerCursosRecientes(); // Intentar de todos modos
            }
          }, 3000); // Aumentado a 3 segundos
          
          return;
        } catch (seedError: any) {
          console.error('Error al intentar sembrar datos:', seedError);
          setError('No se pudieron generar datos de ejemplo');
          setErrorDetail(seedError.message || 'Error al conectar con la base de datos');
        } finally {
          setGenerandoDatos(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    obtenerCursosRecientes();
  }, []);
  
  // Botón para reintentar con siembra de datos
  const handleRetry = () => {
    // Resetear intentos al usar el botón manual
    haReintentado.current = false;
    setIntentosDeConexion(0);
    obtenerCursosRecientes(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-3xl mx-auto mb-3" />
          <p className="text-blue-800">Cargando cursos...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error de conexión</h3>
        <p className="mb-2">{error}</p>
        {errorDetail && (
          <div className="bg-red-100 p-3 rounded mb-4 text-sm">
            <p className="font-medium">Detalles técnicos:</p>
            <p>{errorDetail}</p>
          </div>
        )}
        <p className="mb-4">
          {intentosDeConexion >= intentosMaximos 
            ? 'Se han agotado los intentos de conexión. Por favor, verifica tu conexión a Internet y la disponibilidad de la base de datos.' 
            : 'Estamos experimentando dificultades para conectar con la base de datos.'}
        </p>
        {generandoDatos ? (
          <div className="flex items-center bg-blue-100 p-4 rounded">
            <FaSpinner className="animate-spin text-blue-600 mr-2" />
            <span>Generando datos de ejemplo...</span>
          </div>
        ) : (
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            disabled={intentosDeConexion >= intentosMaximos}
          >
            <FaSyncAlt className="mr-2" /> Reintentar y generar datos
          </button>
        )}
      </div>
    );
  }
  
  if (cursos.length === 0) {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Sin contenido</h3>
        <p className="mb-4">No hay cursos disponibles actualmente.</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
        >
          <FaSyncAlt className="mr-2" /> Generar cursos de ejemplo
        </button>
      </div>
    );
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