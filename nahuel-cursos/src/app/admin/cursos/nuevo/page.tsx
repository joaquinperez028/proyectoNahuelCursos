'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaSave, FaTimes, FaSpinner, FaUpload, FaVideo } from 'react-icons/fa';
import { EstadoVideoMux } from '@/components/EstadoVideoMux';

export default function NuevoCurso() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    categorias: ''
  });
  
  // Estados para los videos de Mux
  const [videoCompleto, setVideoCompleto] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<File | null>(null);
  const [videoCompletoUploadId, setVideoCompletoUploadId] = useState<string | null>(null);
  const [videoPreviewUploadId, setVideoPreviewUploadId] = useState<string | null>(null);
  const [videoCompletoPlaybackId, setVideoCompletoPlaybackId] = useState<string | null>(null);
  const [videoPreviewPlaybackId, setVideoPreviewPlaybackId] = useState<string | null>(null);
  const [subiendoVideoCompleto, setSubiendoVideoCompleto] = useState(false);
  const [subiendoVideoPreview, setSubiendoVideoPreview] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/auth/login?redirect=/admin/cursos/nuevo');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleVideoCompletoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoCompleto(e.target.files[0]);
    }
  };

  const handleVideoPreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoPreview(e.target.files[0]);
    }
  };

  const subirVideoAMux = async (file: File, esVideoCompleto: boolean) => {
    try {
      if (esVideoCompleto) {
        setSubiendoVideoCompleto(true);
      } else {
        setSubiendoVideoPreview(true);
      }

      // 1. Obtener URL de subida directa a Mux
      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener URL de subida');
      }

      // 2. Subir el archivo directamente a Mux
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Error al subir el video a Mux');
      }

      // 3. Guardar el ID de subida
      if (esVideoCompleto) {
        setVideoCompletoUploadId(data.uploadId);
      } else {
        setVideoPreviewUploadId(data.uploadId);
      }

      return data.uploadId;
    } catch (error: any) {
      console.error('Error al subir video a Mux:', error);
      setError(error.message || 'Error al subir video');
      return null;
    } finally {
      if (esVideoCompleto) {
        setSubiendoVideoCompleto(false);
      } else {
        setSubiendoVideoPreview(false);
      }
    }
  };

  const handleVideoCompletoReady = (playbackId: string) => {
    setVideoCompletoPlaybackId(playbackId);
  };

  const handleVideoPreviewReady = (playbackId: string) => {
    setVideoPreviewPlaybackId(playbackId);
  };

  const validateForm = () => {
    if (!formData.titulo || !formData.descripcion || !formData.precio) {
      setError('Los campos de título, descripción y precio son obligatorios');
      return false;
    }
    
    if (!videoCompletoPlaybackId) {
      setError('Debes subir el video completo del curso y esperar a que se procese');
      return false;
    }
    
    if (!videoPreviewPlaybackId) {
      setError('Debes subir el video de vista previa del curso y esperar a que se procese');
      return false;
    }
    
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio < 0) {
      setError('El precio debe ser un número válido y mayor o igual a 0');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Preparar datos para enviar
      const cursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        video: `https://stream.mux.com/${videoCompletoPlaybackId}.m3u8`,
        videoPreview: `https://stream.mux.com/${videoPreviewPlaybackId}.m3u8`,
        muxVideoId: videoCompletoPlaybackId,
        muxVideoPreviewId: videoPreviewPlaybackId,
        categorias: formData.categorias ? formData.categorias.split(',').map(cat => cat.trim()) : []
      };
      
      // Enviar datos al backend
      const response = await axios.post('/api/cursos', cursoData);
      
      if (response.status === 201) {
        // Redireccionar al panel de administración
        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Error al crear curso:', err);
      setError(err.response?.data?.error || 'Ocurrió un error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Curso</h1>
        <Link 
          href="/admin" 
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <FaTimes className="mr-2" /> Cancelar
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título del curso"
                required
              />
            </div>
            
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del curso"
                required
              />
            </div>
            
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                Precio (USD) *
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 29.99"
                required
              />
            </div>
            
            <div>
              <label htmlFor="categorias" className="block text-sm font-medium text-gray-700 mb-1">
                Categorías (separadas por comas)
              </label>
              <input
                type="text"
                id="categorias"
                name="categorias"
                value={formData.categorias}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Inversiones, Bitcoin, Finanzas"
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Videos del Curso
              </h3>
              
              {/* Video Completo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Completo del Curso *
                </label>
                
                {!videoCompletoUploadId ? (
                  <div className="space-y-4">
                    <input
                      type="file"
                      onChange={handleVideoCompletoChange}
                      accept="video/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {videoCompleto && (
                      <button
                        type="button"
                        onClick={() => subirVideoAMux(videoCompleto, true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        disabled={subiendoVideoCompleto}
                      >
                        {subiendoVideoCompleto ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <FaUpload className="mr-2" />
                            Subir a Mux
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <EstadoVideoMux 
                      uploadId={videoCompletoUploadId} 
                      onReady={handleVideoCompletoReady} 
                    />
                    {videoCompletoPlaybackId && (
                      <div className="mt-2 text-green-600 font-medium">
                        ✓ Video completo listo para usar
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Video de vista previa */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video de Vista Previa (Trailer) *
                </label>
                
                {!videoPreviewUploadId ? (
                  <div className="space-y-4">
                    <input
                      type="file"
                      onChange={handleVideoPreviewChange}
                      accept="video/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {videoPreview && (
                      <button
                        type="button"
                        onClick={() => subirVideoAMux(videoPreview, false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        disabled={subiendoVideoPreview}
                      >
                        {subiendoVideoPreview ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <FaUpload className="mr-2" />
                            Subir a Mux
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <EstadoVideoMux 
                      uploadId={videoPreviewUploadId} 
                      onReady={handleVideoPreviewReady} 
                    />
                    {videoPreviewPlaybackId && (
                      <div className="mt-2 text-green-600 font-medium">
                        ✓ Video de vista previa listo para usar
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !videoCompletoPlaybackId || !videoPreviewPlaybackId}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Guardar Curso
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 