'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Curso {
  _id: string;
  title: string;
  playbackId: string;
}

export default function ActualizarPlaybackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [playbackId, setPlaybackId] = useState<string>('cy5yo02Us6yS501uC00BKfwZ54TeYE4T01HBeXFZmprOHIo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Redireccionar si no es admin o no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (session?.user?.role !== 'admin' && status === 'authenticated') {
      router.push('/');
    }
  }, [session, status, router]);
  
  // Cargar la lista de cursos
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCursos(data);
        }
      } catch (error) {
        console.error('Error al cargar cursos:', error);
      }
    };
    
    if (session?.user?.role === 'admin') {
      fetchCursos();
    }
  }, [session]);
  
  // Manejar la actualización del playbackId
  const handleUpdatePlaybackId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cursoSeleccionado || !playbackId) {
      setMessage({
        type: 'error',
        text: 'Por favor, selecciona un curso y proporciona un playbackId válido'
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/courses/update-playback-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: cursoSeleccionado,
          playbackId: playbackId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: `¡PlaybackID actualizado correctamente! Curso: ${data.course.title}`
        });
        
        // Actualizar el playbackId en la lista de cursos
        setCursos(cursos.map(curso => 
          curso._id === cursoSeleccionado 
            ? { ...curso, playbackId: playbackId } 
            : curso
        ));
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al actualizar el playbackId'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión al actualizar el playbackId'
      });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mostrar pantalla de carga si aún está verificando la sesión
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }
  
  // Mostrar contenido solo si es admin
  if (session?.user?.role !== 'admin') {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Actualizar PlaybackID de Curso</h1>
      
      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleUpdatePlaybackId} className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Curso
          </label>
          <select 
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Seleccionar curso --</option>
            {cursos.map(curso => (
              <option key={curso._id} value={curso._id}>
                {curso.title} - ID: {curso.playbackId || 'Sin PlaybackID'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nuevo PlaybackID
          </label>
          <input 
            type="text"
            value={playbackId}
            onChange={(e) => setPlaybackId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Ingresa el nuevo PlaybackID"
          />
          <p className="text-sm text-gray-500 mt-1">
            PlaybackID actual: cy5yo02Us6yS501uC00BKfwZ54TeYE4T01HBeXFZmprOHIo
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push('/admin/cursos')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Volver
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar PlaybackID'}
          </button>
        </div>
      </form>
      
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-2xl">
        <h2 className="text-lg font-medium mb-4">Cursos Disponibles</h2>
        
        {cursos.length === 0 ? (
          <p className="text-gray-500">No hay cursos disponibles</p>
        ) : (
          <ul className="space-y-3">
            {cursos.map(curso => (
              <li key={curso._id} className="p-3 bg-white border rounded-md">
                <p className="font-medium">{curso.title}</p>
                <p className="text-sm text-gray-600">ID: {curso._id}</p>
                <p className="text-sm text-gray-600">
                  PlaybackID: {curso.playbackId || 'No definido'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 