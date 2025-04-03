'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { FaStar, FaRegStar, FaUser, FaSpinner } from 'react-icons/fa';

interface Valoracion {
  _id: string;
  usuarioId: string;
  usuario: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

interface ValoracionesCursoProps {
  cursoId: string;
  tieneAcceso: boolean;
}

export default function ValoracionesCurso({ cursoId, tieneAcceso }: ValoracionesCursoProps) {
  const { data: session, status } = useSession();
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [totalValoraciones, setTotalValoraciones] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para la nueva valoración
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [usuarioHaValorado, setUsuarioHaValorado] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Cargar las valoraciones
  useEffect(() => {
    const obtenerValoraciones = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/cursos/${cursoId}/valoraciones`);
        setValoraciones(response.data.valoraciones);
        setPromedio(response.data.promedio);
        setTotalValoraciones(response.data.total);
        
        // Verificar si el usuario ha valorado este curso
        if (status === 'authenticated' && session?.user) {
          const usuarioId = session.user.id || '';
          const usuarioEmail = session.user.email || '';
          
          const valoracionUsuario = response.data.valoraciones.find(
            (v: Valoracion) => 
              v.usuarioId === usuarioId || 
              v.usuario === `${session.user.nombre || ''} ${session.user.apellido || ''}`.trim() ||
              v.usuario.includes(usuarioEmail)
          );
          
          if (valoracionUsuario) {
            setUsuarioHaValorado(true);
            setCalificacion(valoracionUsuario.calificacion);
            setComentario(valoracionUsuario.comentario);
          }
        }
      } catch (err) {
        console.error('Error al obtener valoraciones:', err);
        setError('No se pudieron cargar las valoraciones');
      } finally {
        setLoading(false);
      }
    };
    
    obtenerValoraciones();
  }, [cursoId, status, session]);
  
  // Enviar una valoración
  const handleSubmitValoracion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status !== 'authenticated') {
      setMensajeError('Debes iniciar sesión para valorar este curso');
      return;
    }
    
    if (!tieneAcceso) {
      setMensajeError('Debes comprar este curso para poder valorarlo');
      return;
    }
    
    try {
      setEnviando(true);
      setMensajeError('');
      setMensajeExito('');
      
      const response = await axios.post(`/api/cursos/${cursoId}/valoraciones`, {
        calificacion,
        comentario
      });
      
      // Recargar las valoraciones
      const responseGet = await axios.get(`/api/cursos/${cursoId}/valoraciones`);
      setValoraciones(responseGet.data.valoraciones);
      setPromedio(responseGet.data.promedio);
      setTotalValoraciones(responseGet.data.total);
      
      setMensajeExito('¡Gracias por tu valoración!');
      setUsuarioHaValorado(true);
      setMostrarFormulario(false);
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setMensajeExito('');
      }, 3000);
    } catch (err: any) {
      console.error('Error al enviar valoración:', err);
      setMensajeError(err.response?.data?.error || 'Error al enviar la valoración');
    } finally {
      setEnviando(false);
    }
  };
  
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(fecha);
  };
  
  // Renderizar estrellas para una calificación
  const renderEstrellas = (calificacion: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <span key={estrella}>
            {estrella <= calificacion ? (
              <FaStar className="mr-1" />
            ) : (
              <FaRegStar className="mr-1" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  // Renderizar estrellas seleccionables para el formulario
  const renderEstrellasSeleccionables = () => {
    return (
      <div className="flex text-yellow-400 text-2xl mb-4">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <button
            key={estrella}
            type="button"
            onClick={() => setCalificacion(estrella)}
            className="mr-1 focus:outline-none"
            aria-label={`${estrella} estrellas`}
          >
            {estrella <= calificacion ? <FaStar /> : <FaRegStar />}
          </button>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FaSpinner className="animate-spin text-blue-600 text-2xl" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
        {error}
      </div>
    );
  }
  
  return (
    <div className="mt-10 border-t border-gray-200 pt-10">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900">Valoraciones y Comentarios</h2>
      
      {/* Resumen de valoraciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8">
        <div className="flex items-center mb-4 sm:mb-0 sm:mr-8">
          <div className="text-4xl font-bold text-gray-900 mr-4">
            {promedio.toFixed(1)}
          </div>
          <div>
            <div className="flex text-yellow-400 text-xl mb-1">
              {renderEstrellas(promedio)}
            </div>
            <div className="text-gray-600 text-sm">
              {totalValoraciones} {totalValoraciones === 1 ? 'valoración' : 'valoraciones'}
            </div>
          </div>
        </div>
        
        {tieneAcceso && status === 'authenticated' && (
          <div className="w-full sm:w-auto">
            {!mostrarFormulario && !usuarioHaValorado ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                Valorar este curso
              </button>
            ) : usuarioHaValorado && !mostrarFormulario ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                Editar mi valoración
              </button>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Formulario de valoración */}
      {mostrarFormulario && tieneAcceso && status === 'authenticated' && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {usuarioHaValorado ? 'Editar tu valoración' : 'Valorar este curso'}
          </h3>
          
          <form onSubmit={handleSubmitValoracion}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Tu calificación</label>
              {renderEstrellasSeleccionables()}
            </div>
            
            <div className="mb-6">
              <label htmlFor="comentario" className="block text-gray-700 mb-2">
                Tu comentario (opcional)
              </label>
              <textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Comparte tu experiencia con este curso..."
              />
            </div>
            
            {mensajeError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                {mensajeError}
              </div>
            )}
            
            {mensajeExito && (
              <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
                {mensajeExito}
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={enviando}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors text-sm font-medium"
              >
                {enviando ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" /> Enviando...
                  </span>
                ) : (
                  usuarioHaValorado ? 'Actualizar valoración' : 'Enviar valoración'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Lista de valoraciones */}
      {valoraciones.length > 0 ? (
        <div className="space-y-8">
          {valoraciones.map((valoracion) => (
            <div key={valoracion._id} className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                  <FaUser className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <h4 className="font-semibold text-gray-900 mr-2">{valoracion.usuario}</h4>
                      <div className="flex text-yellow-400 mt-1 sm:mt-0">
                        {renderEstrellas(valoracion.calificacion)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 sm:mt-0">
                      {formatearFecha(valoracion.fecha)}
                    </div>
                  </div>
                  {valoracion.comentario && (
                    <p className="text-gray-700 mt-2 whitespace-pre-line">{valoracion.comentario}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Este curso aún no tiene valoraciones</p>
          {tieneAcceso && status === 'authenticated' && !mostrarFormulario && !usuarioHaValorado && (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Sé el primero en valorar este curso
            </button>
          )}
        </div>
      )}
    </div>
  );
} 