'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaEdit, FaUser, FaPhone, FaEnvelope, FaSave, FaTimes, FaPlayCircle, FaSyncAlt } from 'react-icons/fa';
import { actualizarTelefono } from './actualizarTelefono';
import VideoPlayer from '@/components/VideoPlayer';

interface Curso {
  _id: string;
  titulo: string;
  descripcion: string;
  videoPreview: string;
  precio: number;
}

export default function Perfil() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [cursosComprados, setCursosComprados] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);
  
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [telefonoError, setTelefonoError] = useState('');
  const [telefonoSuccess, setTelefonoSuccess] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      // Verificar si el ID es temporal antes de intentar cargar cursos
      if (session?.user?.id?.startsWith('temp_')) {
        setLoading(false);
        setError('Tu cuenta está siendo procesada. Por favor, espera unos momentos o cierra sesión y vuelve a iniciar.');
        return;
      }
      
      obtenerCursosComprados();
      // Establecer el teléfono desde la sesión
      setTelefono(session.user.telefono || '');
      
      // Verificar si venimos de una actualización exitosa
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('updated') === 'true') {
        setProfileUpdated(true);
        // Limpiar la URL sin recargar la página
        window.history.replaceState({}, document.title, '/perfil');
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          setProfileUpdated(false);
        }, 5000);
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/perfil');
    }
  }, [status, session, router]);

  // Función para intentar recargar la sesión
  const recargarSesion = async () => {
    try {
      setLoading(true);
      setError('Actualizando sesión...');
      
      // Intentar actualizar la sesión mediante el endpoint específico
      await axios.post('/api/auth/actualizar-sesion');
      
      // Forzar actualización de la sesión
      if (update) {
        await update();
        setError('');
        obtenerCursosComprados();
      } else {
        // Si no podemos actualizar, recargar la página
        window.location.reload();
      }
    } catch (err) {
      console.error('Error al recargar sesión:', err);
      setError('No se pudo actualizar la sesión. Intenta cerrar sesión y volver a iniciar.');
      setLoading(false);
    }
  };

  const obtenerCursosComprados = async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) {
        setLoading(true);
      }
      setError('');
      
      // Si el ID es temporal, mostrar mensaje y no intentar cargar
      if (session?.user?.id?.startsWith('temp_')) {
        setError('Tu cuenta está siendo procesada. Por favor, espera unos momentos o cierra sesión y vuelve a iniciar.');
        setLoading(false);
        return;
      }
      
      console.log('Solicitando cursos comprados...');
      
      const response = await axios.get('/api/usuario/cursos', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Verificar la estructura de la respuesta y asegurarse de que cursosComprados sea un array
      const cursos = response.data.cursos || [];
      console.log('Cursos comprados recibidos:', cursos.length);
      
      if (cursos.length === 0) {
        console.log('No se encontraron cursos comprados');
      } else {
        console.log('IDs de cursos comprados:', cursos.map(c => c._id));
      }
      
      setCursosComprados(Array.isArray(cursos) ? cursos : []);
      
    } catch (err: any) {
      console.error('Error al obtener cursos comprados:', err);
      
      // Extraer mensaje de error específico si está disponible
      let mensajeError = 'No se pudieron cargar tus cursos. Intenta de nuevo más tarde.';
      let mensajeDetalle = '';
      
      if (err.response?.data?.error) {
        mensajeError = err.response.data.error;
        mensajeDetalle = err.response.data.message || err.response.data.detalles || '';
        
        if (err.response.data.detalles) {
          console.error('Detalles del error:', err.response.data.detalles);
        }
      }
      
      // Personalizar mensaje para errores específicos
      if (err.response?.status === 401) {
        mensajeError = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
        // Redirigir a login después de un breve retraso
        setTimeout(() => {
          router.push('/auth/login?redirect=/perfil');
        }, 3000);
      } else if (err.response?.status === 404) {
        mensajeError = 'No se encontró tu información de usuario.';
        mensajeDetalle = 'Por favor, cierra sesión y vuelve a iniciar sesión.';
      } else if (err.response?.status === 202) {
        mensajeError = 'Tu cuenta está siendo procesada.';
        mensajeDetalle = 'Por favor, espera unos momentos o cierra sesión y vuelve a iniciar.';
        
        // Programar un reintento después de unos segundos para sesiones en proceso
        setTimeout(() => {
          obtenerCursosComprados(false);
        }, 5000);
      }
      
      setError(mensajeError + (mensajeDetalle ? ` - ${mensajeDetalle}` : ''));
      setCursosComprados([]); // Establecer un array vacío en caso de error
    } finally {
      if (mostrarCarga) {
        setLoading(false);
      }
    }
  };

  const handleGuardarTelefono = async () => {
    setGuardandoTelefono(true);
    setTelefonoError('');
    setTelefonoSuccess('');
    
    try {
      console.log('Iniciando actualización del teléfono:', telefono);
      
      // Usar la función de utilidad para actualizar el teléfono
      const resultado = await actualizarTelefono(telefono, update, session);
      console.log('Resultado de la actualización:', resultado);
      
      if (resultado.success) {
        setTelefonoSuccess(resultado.message);
        
        // Si la actualización tuvo éxito completo
        if (resultado.actualizado === true) {
          console.log('Teléfono actualizado correctamente en BD y sesión');
          // Cerramos el modo de edición después de un momento
          setTimeout(() => {
            setEditandoTelefono(false);
          }, 1500);
        } 
        // Si la actualización no se completó o no se pudo verificar
        else {
          console.log('La actualización no se completó o no se pudo verificar');
          setTimeout(() => {
            // Forzar la recarga para sincronizar con el servidor
            window.location.reload();
          }, 2000);
        }
      } else {
        // En caso de error, mostrar el mensaje de error
        console.error('Error durante la actualización:', resultado.message);
        
        // Comprobar si el error es de autenticación/sesión
        if (resultado.message.includes('sesión') || 
            resultado.message.includes('iniciar sesión') || 
            resultado.message.includes('autorización')) {
          setTelefonoError(`${resultado.message} Se intentará recargar la página en unos segundos.`);
          
          // Si es un error de sesión, intentar recargar después de un momento
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setTelefonoError(resultado.message);
        }
      }
    } catch (error) {
      console.error('Error en el proceso de actualización:', error);
      setTelefonoError('No se pudo actualizar el teléfono. Por favor, intenta de nuevo.');
    } finally {
      setGuardandoTelefono(false);
    }
  };

  // Función para reintentar la carga de cursos
  const handleRetryLoading = () => {
    setError('');
    setLoading(true);
    // Esperar un momento para dar la sensación de que se está recargando
    setTimeout(() => {
      obtenerCursosComprados();
    }, 500);
  };

  // También vamos a añadir un efecto para recargar cursos cuando el usuario actualiza la sesión
  useEffect(() => {
    // Si cambió el ID del usuario, volver a cargar los cursos
    if (status === 'authenticated' && session?.user?.id) {
      console.log('ID de usuario en sesión:', session.user.id);
      obtenerCursosComprados();
    }
  }, [session?.user?.id]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // El useEffect redirigirá
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-blue-900 py-4 px-6 rounded-t-xl mb-6">
        <h1 className="text-3xl font-bold text-white mb-0">Mi Perfil</h1>
      </div>
      
      {profileUpdated && (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 flex items-center justify-between">
          <p>Tu perfil ha sido actualizado correctamente.</p>
          <button 
            onClick={() => setProfileUpdated(false)}
            className="text-green-800 hover:text-green-900"
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información del usuario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <div className="text-center mb-6">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'Avatar'} 
                  className="rounded-full w-24 h-24 mx-auto mb-4 border-2 border-blue-100"
                />
              ) : (
                <div className="bg-blue-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <FaUser className="text-blue-500 text-4xl" />
                </div>
              )}
              <h2 className="text-xl font-bold text-black">
                {session?.user?.nombre} {session?.user?.apellido}
              </h2>
              <p className="text-black font-medium mt-1">
                {session?.user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-start">
                <FaEnvelope className="text-blue-500 mt-1 mr-3" />
                <div>
                  <p className="text-sm font-bold text-black">Email</p>
                  <p className="text-black font-medium">{session?.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaPhone className="text-blue-500 mt-1 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-black">Teléfono</p>
                  
                  {editandoTelefono ? (
                    <div className="mt-1 space-y-2">
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingresa tu teléfono"
                        disabled={guardandoTelefono}
                      />
                      
                      {telefonoError && (
                        <div className="bg-red-50 p-2 rounded text-red-600 text-xs font-medium">
                          <p>{telefonoError}</p>
                        </div>
                      )}
                      
                      {telefonoSuccess && (
                        <div className="bg-green-50 p-2 rounded text-green-600 text-xs font-medium">
                          <p>{telefonoSuccess}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleGuardarTelefono}
                          disabled={guardandoTelefono}
                          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium disabled:bg-blue-300"
                        >
                          {guardandoTelefono ? (
                            <>
                              <FaSpinner className="animate-spin mr-1" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <FaSave className="mr-1" />
                              Guardar
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditandoTelefono(false);
                            setTelefono(session?.user?.telefono || '');
                            setTelefonoError('');
                            setTelefonoSuccess('');
                          }}
                          className="flex items-center text-black hover:text-gray-800 px-3 py-1 rounded-md text-sm font-medium"
                          disabled={guardandoTelefono}
                        >
                          <FaTimes className="mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-black font-medium mr-2">
                        {session?.user?.telefono || 'No especificado'}
                      </p>
                      <button
                        onClick={() => setEditandoTelefono(true)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Editar teléfono"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {session?.user?.role === 'admin' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link 
                  href="/admin" 
                  className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  Panel de administración
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Cursos comprados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-black mb-6">Mis Cursos</h2>
            
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
                <p className="font-medium mb-2">{error}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleRetryLoading}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors flex items-center"
                  >
                    <FaSyncAlt className="mr-1" size={12} /> Reintentar
                  </button>
                  
                  {session?.user?.id?.startsWith('temp_') && (
                    <button 
                      onClick={recargarSesion}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors flex items-center"
                    >
                      <FaSyncAlt className="mr-1" size={12} /> Actualizar sesión
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {!error && !loading && (!cursosComprados || cursosComprados.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-black font-medium mb-4">Aún no has comprado ningún curso</p>
                <Link 
                  href="/cursos" 
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  Ver cursos disponibles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cursosComprados.map((curso) => (
                  <div key={curso._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="relative pb-[56.25%] bg-gray-100">
                      {curso.videoPreview ? (
                        <VideoPlayer 
                          src={curso.videoPreview} 
                          className="absolute inset-0" 
                          autoPlay={false}
                          stopPropagation={true}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <span className="text-black font-medium">Vista previa no disponible</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-black mb-2">{curso.titulo}</h3>
                      <p className="text-black text-sm line-clamp-2 mb-auto">
                        {curso.descripcion}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm text-green-600 font-medium">Curso comprado</span>
                        <Link 
                          href={`/cursos/${curso._id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center"
                        >
                          Ver curso
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 