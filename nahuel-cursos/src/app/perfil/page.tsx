'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaSpinner, FaEdit, FaUser, FaPhone, FaEnvelope, FaSave, FaTimes } from 'react-icons/fa';
import { actualizarTelefono } from './actualizarTelefono';

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

  const obtenerCursosComprados = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/usuario/cursos');
      
      // Verificar la estructura de la respuesta y asegurarse de que cursosComprados sea un array
      const cursos = response.data.cursos || [];
      setCursosComprados(Array.isArray(cursos) ? cursos : []);
      
    } catch (err) {
      console.error('Error al obtener cursos comprados:', err);
      setError('No se pudieron cargar tus cursos. Intenta de nuevo más tarde.');
      setCursosComprados([]); // Establecer un array vacío en caso de error
    } finally {
      setLoading(false);
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
        setTelefonoError(resultado.message);
      }
    } catch (error) {
      console.error('Error en el proceso de actualización:', error);
      setTelefonoError('No se pudo actualizar el teléfono. Por favor, intenta de nuevo.');
    } finally {
      setGuardandoTelefono(false);
    }
  };

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
                      />
                      
                      {telefonoError && (
                        <p className="text-red-600 text-xs font-medium">{telefonoError}</p>
                      )}
                      
                      {telefonoSuccess && (
                        <p className="text-green-600 text-xs font-medium">{telefonoSuccess}</p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleGuardarTelefono}
                          disabled={guardandoTelefono}
                          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium"
                        >
                          {guardandoTelefono ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaSave className="mr-1" />
                          )}
                          Guardar
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditandoTelefono(false);
                            setTelefono(session?.user?.telefono || '');
                            setTelefonoError('');
                            setTelefonoSuccess('');
                          }}
                          className="flex items-center text-black hover:text-gray-800 px-3 py-1 rounded-md text-sm font-medium"
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
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 font-medium">
                {error}
              </div>
            )}
            
            {!cursosComprados || cursosComprados.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-black font-medium mb-4">Aún no has comprado ningún curso</p>
                <Link 
                  href="/cursos" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver cursos disponibles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cursosComprados.map((curso) => (
                  <Link key={curso._id} href={`/cursos/${curso._id}`}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                      <div className="relative pb-[56.25%] bg-gray-100">
                        {curso.videoPreview ? (
                          <iframe 
                            src={curso.videoPreview}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
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
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <span className="text-sm text-blue-600 font-medium">Ver curso</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 