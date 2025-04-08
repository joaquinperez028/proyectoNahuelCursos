'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaPlay, FaLock, FaSpinner, FaShoppingCart, FaCheckCircle, FaTimes, FaSyncAlt } from 'react-icons/fa';
import VideoPlayer from '@/components/VideoPlayer';
import ValoracionEstrellas from '@/components/ValoracionEstrellas';
import ValoracionesCurso from '@/components/ValoracionesCurso';
import { useParams } from 'next/navigation';

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
  calificacionPromedio?: number;
  totalValoraciones?: number;
}

export default function DetalleCurso({ params }: CursoProps) {
  // Usar useParams para obtener los parámetros de la ruta
  const routeParams = useParams();
  const id = routeParams.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingCompra, setLoadingCompra] = useState(false);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  const [mensajeCompra, setMensajeCompra] = useState('');

  // Cargar los datos del curso cuando el componente se monta
  useEffect(() => {
    const obtenerCurso = async () => {
      try {
        setLoading(true);
        console.log('Obteniendo detalles del curso:', id);
        
        // Hacer la solicitud con cabeceras para evitar caché
        const response = await axios.get(`/api/cursos/${id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        setCurso(response.data);
        
        // Verificar si tenemos acceso al video completo
        const tieneVideoCompleto = !!response.data.video;
        setTieneAcceso(tieneVideoCompleto);
        
        console.log('Tiene acceso al video completo:', tieneVideoCompleto);
        
        // Si viene de una compra pero no tiene el video, intentar cargar de nuevo
        if (window.location.search.includes('comprado=true') && !tieneVideoCompleto) {
          console.log('Compra reciente detectada, pero aún no tiene acceso. Recargando en 2 segundos...');
          setTimeout(() => recargarCurso(), 2000);
        }
      } catch (err) {
        console.error('Error al obtener curso:', err);
        setError('Ocurrió un error al cargar el curso. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      obtenerCurso();
    }
  }, [id]); // Eliminamos session de las dependencias para evitar recargas innecesarias

  // Función para recargar los datos del curso (después de una compra o error)
  const recargarCurso = async () => {
    try {
      console.log('Recargando datos del curso...');
      setLoading(true);
      
      // Verificar primero si la sesión está actualizada
      if (session?.user?.id?.startsWith('temp_')) {
        console.log('ID de usuario temporal detectado, esperando actualización de sesión');
        setMensajeCompra('Tu sesión está siendo procesada. Por favor, espera unos segundos o cierra sesión y vuelve a iniciar.');
        setLoading(false);
        return;
      }
      
      // Intentar verificar directamente si tiene cursos comprados a través del endpoint de usuario
      try {
        const cursosResponse = await axios.get('/api/usuario/cursos', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('Respuesta de cursos del usuario:', cursosResponse.data);
        
        // Verificar si el curso actual está en la lista de comprados
        if (cursosResponse.data.cursos && Array.isArray(cursosResponse.data.cursos)) {
          const cursoComprado = cursosResponse.data.cursos.some(
            (curso: any) => curso._id === id || curso._id.toString() === id
          );
          
          console.log('¿Curso encontrado en la lista de comprados?', cursoComprado);
          
          if (cursoComprado) {
            console.log('Curso ya comprado según endpoint de usuario');
            setTieneAcceso(true);
            setMensajeCompra('¡Ya tienes acceso al curso! El contenido completo está disponible ahora.');
            
            // Recargar la info del curso para obtener el enlace al video completo
            const cursoResponse = await axios.get(`/api/cursos/${id}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            setCurso(cursoResponse.data);
            
            // Limpiar URL sin recargar la página
            if (window.location.search) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            // Ocultar el mensaje después de unos segundos
            setTimeout(() => setMensajeCompra(''), 5000);
            
            setLoading(false);
            return;
          }
        }
      } catch (cursosErr) {
        console.error('Error al verificar cursos del usuario:', cursosErr);
        // Continuamos con el método alternativo
      }
      
      // Método estándar: obtener el curso y verificar si tiene video
      const response = await axios.get(`/api/cursos/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Force-Check': 'true' // Cabecera personalizada para forzar verificación
        }
      });
      
      setCurso(response.data);
      
      // Verificar si tenemos acceso al video completo
      const tieneVideoCompleto = !!response.data.video;
      setTieneAcceso(tieneVideoCompleto);
      
      console.log('Curso recargado, tiene acceso al video:', tieneVideoCompleto);
      
      // Limpiar URL sin recargar la página
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Actualizar mensaje según resultado
      if (tieneVideoCompleto) {
        setMensajeCompra('¡Ya tienes acceso al curso! El contenido completo está disponible ahora.');
        // Ocultar el mensaje después de unos segundos
        setTimeout(() => setMensajeCompra(''), 5000);
      } else if (window.location.search.includes('comprado=true')) {
        // Si es después de una compra y aún no tiene acceso
        setMensajeCompra('Tu compra ha sido registrada, pero el acceso puede tardar unos momentos. Puedes intentar verificar de nuevo.');
      }
    } catch (err) {
      console.error('Error al recargar curso:', err);
      setMensajeCompra('Error al verificar el acceso. Por favor, intenta de nuevo en unos momentos.');
      // No mostramos error, mantenemos los datos que ya teníamos
    } finally {
      setLoading(false);
    }
  };

  const handleComprarCurso = async () => {
    if (status === 'unauthenticated') {
      // Redirigir al login si el usuario no está autenticado
      router.push(`/auth/login?redirect=/cursos/${id}`);
      return;
    }
    
    // Verificar si el ID de usuario es temporal
    if (session?.user?.id?.startsWith('temp_')) {
      setMensajeCompra('Tu cuenta aún está siendo procesada. Por favor, espera unos segundos o cierra sesión y vuelve a iniciar.');
      return;
    }
    
    try {
      setLoadingCompra(true);
      setMensajeCompra('');
      console.log('Enviando compra con cursoId:', id);
      
      const response = await axios.post('/api/cursos/comprar', { 
        cursoId: id 
      });
      
      console.log('Respuesta de compra:', response.data);
      
      // Mostrar mensaje de éxito
      setMensajeCompra('¡Curso comprado con éxito! Cargando contenido...');
      
      // Recargar los datos del curso después de la compra
      await recargarCurso();
      
      // Modificar la URL para indicar que el curso ha sido comprado
      const newUrl = window.location.pathname + '?comprado=true';
      window.history.replaceState({}, document.title, newUrl);

      // Si después de la recarga aún no tiene acceso, intentar una vez más después de un breve retraso
      if (!tieneAcceso) {
        setMensajeCompra('Finalizando configuración de acceso. Puede tardar unos segundos...');
        
        setTimeout(async () => {
          await recargarCurso();
          
          if (!tieneAcceso) {
            setMensajeCompra('Tu compra ha sido registrada correctamente. Si no ves el contenido en unos minutos, cierra sesión y vuelve a iniciar.');
          }
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error al comprar curso:', err);
      
      // Respuesta con mensaje específico
      if (err.response?.data?.mensaje) {
        // Si ya tiene el curso o cualquier otro mensaje de éxito
        setMensajeCompra(err.response.data.mensaje);
        // Verificar acceso de todos modos, porque podría ser que ya tenga el curso
        setTimeout(() => recargarCurso(), 1000);
      } 
      // Respuesta con error pero con mensaje específico
      else if (err.response?.data?.error) {
        let mensajeError = err.response.data.error;
        
        // Si incluye un mensaje adicional, mostrarlo
        if (err.response.data.message) {
          mensajeError += ': ' + err.response.data.message;
        }
        
        // Si es un error de procesamiento (cuenta temporal) dar instrucciones específicas
        if (mensajeError.includes('cuenta') || mensajeError.includes('procesada') || err.response.status === 202) {
          mensajeError += ' Intenta cerrar sesión y volver a iniciar.';
        }
        
        setMensajeCompra('Error: ' + mensajeError);
        
        // IMPORTANTE: Aún con errores, verificar acceso
        // porque podría ser que la compra se haya registrado a pesar del error
        setTimeout(() => recargarCurso(), 2000);
      } 
      // Error general sin detalles
      else {
        setMensajeCompra('Error: No se pudo procesar la compra. Por favor, intenta más tarde.');
        // Verificar acceso de todos modos
        setTimeout(() => recargarCurso(), 2000);
      }
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
      <div className="bg-black py-4 px-6 rounded-t-xl mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-0">{curso.titulo}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {curso.categorias.map((categoria, index) => (
            <span key={index} className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
              {categoria}
            </span>
          ))}
        </div>
      </div>
      
      {mensajeCompra && (
        <div className={`${mensajeCompra.includes('error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'} p-4 rounded-lg mb-6 flex items-center justify-between flex-wrap`}>
          <div className="flex items-center">
            {mensajeCompra.includes('error') 
              ? <FaTimes className="text-red-600 mr-2" /> 
              : <FaCheckCircle className="text-green-600 mr-2" />} 
            {mensajeCompra}
          </div>
          
          {!tieneAcceso && mensajeCompra.includes('compra') && (
            <button 
              onClick={recargarCurso} 
              className="mt-2 sm:mt-0 bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1 rounded text-sm"
            >
              <FaSyncAlt className="inline mr-1" /> Verificar acceso
            </button>
          )}
        </div>
      )}
      
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
          
          {/* Valoraciones del curso */}
          {id && <ValoracionesCurso cursoId={id} tieneAcceso={tieneAcceso} />}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {!tieneAcceso ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-8">
              <div className="p-6">
                <div className="font-bold text-3xl text-gray-900 mb-2">${curso.precio.toFixed(2)}</div>
                <p className="text-gray-600 mb-6">Acceso de por vida al contenido del curso</p>
                
                {/* Mostrar valoraciones en la sidebar */}
                {(curso.calificacionPromedio !== undefined && curso.calificacionPromedio > 0) && (
                  <div className="mb-6">
                    <ValoracionEstrellas 
                      calificacion={curso.calificacionPromedio} 
                      totalValoraciones={curso.totalValoraciones} 
                      tamano="lg"
                    />
                  </div>
                )}
                
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