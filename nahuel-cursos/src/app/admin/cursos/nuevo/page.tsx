'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaSave, FaTimes, FaSpinner, FaUpload, FaVideo } from 'react-icons/fa';

export default function NuevoCurso() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    video: '',
    videoPreview: '',
    categorias: ''
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewFile, setVideoPreviewFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario es administrador
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    router.push('/');
    return null;
  }

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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleVideoPreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoPreviewFile(e.target.files[0]);
    }
  };

  const uploadVideoFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await axios.post('/api/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.filePath;
  };

  const validateForm = () => {
    if (!formData.titulo || !formData.descripcion || !formData.precio) {
      setError('Los campos de título, descripción y precio son obligatorios');
      return false;
    }
    
    if (!formData.video && !videoFile) {
      setError('Debes proporcionar un video completo (ya sea URL o archivo)');
      return false;
    }
    
    if (!formData.videoPreview && !videoPreviewFile) {
      setError('Debes proporcionar un video de vista previa (ya sea URL o archivo)');
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
      
      // Subir archivos de video si se proporcionaron
      let videoPath = formData.video;
      let videoPreviewPath = formData.videoPreview;
      
      if (videoFile) {
        setUploadingVideo(true);
        videoPath = await uploadVideoFile(videoFile);
        setUploadingVideo(false);
      }
      
      if (videoPreviewFile) {
        setUploadingPreview(true);
        videoPreviewPath = await uploadVideoFile(videoPreviewFile);
        setUploadingPreview(false);
      }
      
      // Preparar datos para enviar
      const cursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        video: videoPath,
        videoPreview: videoPreviewPath,
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Completo del Curso *
              </label>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div 
                      className="border border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/*"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <FaUpload className="text-blue-500 text-2xl mb-2" />
                        <span className="text-sm text-gray-700">
                          {videoFile ? videoFile.name : 'Subir archivo de video completo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {uploadingVideo && (
                    <div className="flex items-center text-blue-600">
                      <FaSpinner className="animate-spin mr-2" />
                      <span>Subiendo...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mx-auto">O</span>
                </div>
                
                <div>
                  <input
                    type="url"
                    id="video"
                    name="video"
                    value={formData.video}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL del video completo (opcional si subes archivo)"
                  />
                </div>
              </div>
              
              <p className="mt-1 text-sm text-gray-500">Sube un archivo de video o proporciona una URL externa.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video de Vista Previa *
              </label>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div 
                      className="border border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => videoPreviewInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={videoPreviewInputRef}
                        onChange={handleVideoPreviewChange}
                        accept="video/*"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <FaUpload className="text-blue-500 text-2xl mb-2" />
                        <span className="text-sm text-gray-700">
                          {videoPreviewFile ? videoPreviewFile.name : 'Subir archivo de vista previa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {uploadingPreview && (
                    <div className="flex items-center text-blue-600">
                      <FaSpinner className="animate-spin mr-2" />
                      <span>Subiendo...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mx-auto">O</span>
                </div>
                
                <div>
                  <input
                    type="url"
                    id="videoPreview"
                    name="videoPreview"
                    value={formData.videoPreview}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL del video de vista previa (opcional si subes archivo)"
                  />
                </div>
              </div>
              
              <p className="mt-1 text-sm text-gray-500">Sube un archivo de video corto para vista previa o proporciona una URL externa.</p>
            </div>
            
            <div>
              <label htmlFor="categorias" className="block text-sm font-medium text-gray-700 mb-1">
                Categorías
              </label>
              <input
                type="text"
                id="categorias"
                name="categorias"
                value={formData.categorias}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Bitcoin, Ethereum, Trading (separadas por comas)"
              />
              <p className="mt-1 text-sm text-gray-500">Introduce las categorías separadas por comas.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || uploadingVideo || uploadingPreview}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || uploadingVideo || uploadingPreview) ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {uploadingVideo || uploadingPreview ? 'Subiendo archivos...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Crear Curso
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