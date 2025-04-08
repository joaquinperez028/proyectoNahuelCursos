'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaArrowRight, FaPlayCircle, FaVideo, FaSyncAlt, FaLock, FaGraduationCap } from 'react-icons/fa';
import ValoracionEstrellas from './ValoracionEstrellas';
import VideoPlayer from './VideoPlayer';

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
  const [errorDetail, setErrorDetail] = useState('');
  const [esReciente, setEsReciente] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
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
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-green-800">
            {esReciente ? 'Últimos cursos añadidos' : 'Nuestro curso más reciente'}
          </h2>
          <Link 
            href="/cursos" 
            className="flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            Ver todos
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cursos.map((curso) => (
            <div 
              key={curso._id} 
              className="bg-gray-100 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col relative"
            >
              <div className="w-full h-48 bg-gray-200 relative">
                {curso.videoPreview ? (
                  <VideoPlayer 
                    src={curso.videoPreview} 
                    className="absolute inset-0" 
                    autoPlay={false}
                    stopPropagation={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center p-2">
                      <FaVideo className="text-4xl text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-700">Vista previa no disponible</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-semibold mb-2 text-green-800">{curso.titulo}</h3>
                <p className="text-green-700 mb-4 line-clamp-2 flex-1">{curso.descripcion}</p>
                <div className="mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">${curso.precio.toFixed(2)}</span>
                    {curso.calificacionPromedio !== undefined && (
                      <ValoracionEstrellas 
                        calificacion={curso.calificacionPromedio} 
                        totalValoraciones={curso.totalValoraciones} 
                        tamano="sm" 
                      />
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                    <button 
                      onClick={() => setSelectedCurso(curso)}
                      className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
                    >
                      Ver detalles
                      <FaArrowRight className="ml-2" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de detalles del curso */}
        {selectedCurso && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Fondo con desenfoque */}
            <div 
              className="absolute inset-0 backdrop-blur-sm bg-black/30"
              onClick={() => setSelectedCurso(null)}
            ></div>
            
            {/* Contenido del modal */}
            <div 
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all"
              onClick={e => e.stopPropagation()}
            >
              {/* Botón de cerrar */}
              <button 
                onClick={() => setSelectedCurso(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 bg-black/30 rounded-full p-1 backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Video o placeholder */}
              <div className="w-full aspect-video bg-black relative">
                {selectedCurso.videoPreview ? (
                  <VideoPlayer 
                    src={selectedCurso.videoPreview} 
                    className="absolute inset-0" 
                    autoPlay={false}
                    stopPropagation={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center px-6">
                      <FaLock className="text-6xl text-green-500 mx-auto mb-4" />
                      <h3 className="text-white text-2xl font-bold mb-2">Contenido Premium</h3>
                      <p className="text-gray-300 text-sm">Adquiere este curso para acceder al contenido completo</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Información del curso */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-green-800 mb-3">{selectedCurso.titulo}</h2>
                <p className="text-green-700 mb-6">{selectedCurso.descripcion}</p>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-bold text-green-800">${selectedCurso.precio.toFixed(2)}</span>
                  {selectedCurso.calificacionPromedio !== undefined && (
                    <ValoracionEstrellas 
                      calificacion={selectedCurso.calificacionPromedio} 
                      totalValoraciones={selectedCurso.totalValoraciones} 
                      tamano="lg" 
                    />
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Este curso incluye:</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FaVideo className="text-green-600 text-lg" />
                      </div>
                      <span className="text-gray-700">Video curso completo</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FaLock className="text-green-600 text-lg" />
                      </div>
                      <span className="text-gray-700">Acceso multiplataforma</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FaGraduationCap className="text-green-600 text-lg" />
                      </div>
                      <span className="text-gray-700">Actualizaciones gratuitas</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Link 
                    href={`/cursos/${selectedCurso._id}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl text-center transition-colors font-medium flex items-center justify-center"
                  >
                    Ver curso completo
                    <FaArrowRight className="ml-2" />
                  </Link>
                  <button
                    onClick={() => setSelectedCurso(null)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 