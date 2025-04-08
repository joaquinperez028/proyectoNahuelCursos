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
  
  // Añadir logs para depurar
  useEffect(() => {
    console.log('ValoracionesCurso montado con cursoId:', cursoId);
    console.log('ValoracionesCurso tieneAcceso:', tieneAcceso);
    console.log('ValoracionesCurso estado de sesión:', status);
    if (session?.user) {
      console.log('ValoracionesCurso usuario:', {
        id: session.user.id,
        email: session.user.email,
        nombre: session.user.nombre || session.user.name
      });
    }
  }, [cursoId, tieneAcceso, status, session])
  
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
  
  // Verificar si podemos mostrar el formulario de valoración
  const mostrarOpcionesValoracion = () => {
    return status === 'authenticated' && tieneAcceso;
  };
  
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
      <div className="flex">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <span key={estrella} className="mr-1">
            {estrella <= calificacion ? (
              <FaStar className="text-green-500" />
            ) : (
              <FaRegStar className="text-green-300" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  // Renderizar estrellas seleccionables para el formulario
  const renderEstrellasSeleccionables = () => {
    return (
      <div className="flex text-green-500 text-2xl mb-4">
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
    <div className="bg-black rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Valoraciones y Comentarios</h2>
      
      {/* Promedio y total de valoraciones */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-white">{promedio.toFixed(1)}</div>
          <div>
            <div className="text-xl mb-1">
              {renderEstrellas(promedio)}
            </div>
            <p className="text-green-400 mt-1">{totalValoraciones} valoraciones</p>
          </div>
        </div>
        
        {mostrarOpcionesValoracion() && (
          <div>
            {!mostrarFormulario && !usuarioHaValorado ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                Valorar este curso
              </button>
            ) : usuarioHaValorado && !mostrarFormulario ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                Editar mi valoración
              </button>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Formulario de valoración */}
      {mostrarFormulario && mostrarOpcionesValoracion() && (
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Deja tu valoración</h3>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Tu calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  onClick={() => setCalificacion(estrella)}
                  className={`text-2xl ${
                    estrella <= calificacion ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Tu comentario</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              rows={4}
            ></textarea>
          </div>
          <button
            onClick={handleSubmitValoracion}
            disabled={enviando || calificacion === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Enviando...' : 'Enviar valoración'}
          </button>
        </div>
      )}
      
      {/* Lista de valoraciones */}
      {valoraciones.length > 0 ? (
        <div className="space-y-6">
          {valoraciones.map((valoracion) => (
            <div key={valoracion._id} className="border-t border-gray-800 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                  {valoracion.usuario.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-white">{valoracion.usuario}</p>
                  <div className="flex items-center gap-2">
                    <div className="text-lg">
                      {renderEstrellas(valoracion.calificacion)}
                    </div>
                    <span className="text-green-400 text-sm">
                      {formatearFecha(valoracion.fecha)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300">{valoracion.comentario}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Este curso aún no tiene valoraciones</p>
          {mostrarOpcionesValoracion() && !mostrarFormulario && !usuarioHaValorado && (
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