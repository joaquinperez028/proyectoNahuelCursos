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
  const [uploadProgress, setUploadProgress] = useState({ main: 0, preview: 0 });

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
    try {
      console.log('Iniciando subida del archivo a MongoDB GridFS:', file.name);
      const formData = new FormData();
      formData.append('video', file);
      
      console.log('Tamaño del archivo a subir:', file.size, 'bytes');
      console.log('Tipo del archivo a subir:', file.type);
      
      const response = await axios.post('/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Añadir timeout y seguimiento de progreso
        timeout: 300000, // 5 minutos para archivos grandes
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          console.log(`Progreso de subida: ${percentCompleted}%`);
          
          // Actualizar el progreso según qué video se está subiendo
          if (file === videoFile) {
            setUploadProgress(prev => ({ ...prev, main: percentCompleted }));
          } else {
            setUploadProgress(prev => ({ ...prev, preview: percentCompleted }));
          }
        }
      });
      
      console.log('Archivo subido exitosamente a MongoDB GridFS:', response.data);
      return response.data.filePath;
    } catch (error: any) {
      console.error('Error en subida de archivo a MongoDB GridFS:', error);
      console.error('Detalles adicionales del error:', {
        isAxiosError: error.isAxiosError,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        config: error.config
      });
      
      let errorMsg = 'Error desconocido en la subida del archivo';
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      } else if (typeof error === 'object') {
        // Intenta convertir el objeto de error a una cadena legible
        try {
          errorMsg = JSON.stringify(error);
        } catch (e) {
          errorMsg = 'Error no serializable';
        }
      }
      
      setError(`Error al subir video: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  const validateForm = () => {
    if (!formData.titulo || !formData.descripcion || !formData.precio) {
      setError('Los campos de título, descripción y precio son obligatorios');
      return false;
    }
    
    // Validar que se proporcione al menos un video o URL para cada tipo
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
    
    // Validar tamaño de archivos si se proporcionan
    if (videoFile && videoFile.size > 100 * 1024 * 1024) {
      setError('El archivo de video completo excede el tamaño máximo permitido (100MB)');
      return false;
    }
    
    if (videoPreviewFile && videoPreviewFile.size > 100 * 1024 * 1024) {
      setError('El archivo de video de vista previa excede el tamaño máximo permitido (100MB)');
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
      
      try {
        if (videoFile) {
          setUploadingVideo(true);
          setUploadProgress(prev => ({ ...prev, main: 0 }));
          console.log('Subiendo video principal a MongoDB GridFS...');
          videoPath = await uploadVideoFile(videoFile);
          console.log('Video principal subido correctamente a MongoDB GridFS:', videoPath);
          setUploadingVideo(false);
        }
        
        if (videoPreviewFile) {
          setUploadingPreview(true);
          setUploadProgress(prev => ({ ...prev, preview: 0 }));
          console.log('Subiendo video de vista previa a MongoDB GridFS...');
          videoPreviewPath = await uploadVideoFile(videoPreviewFile);
          console.log('Video de vista previa subido correctamente a MongoDB GridFS:', videoPreviewPath);
          setUploadingPreview(false);
        }
      } catch (uploadError: any) {
        console.error('Error durante la subida de videos a MongoDB GridFS:', uploadError);
        // Mejorar el mensaje de error para que sea más informativo
        let errorMsg = 'Error desconocido en la subida del archivo';
        
        if (uploadError.message) {
          errorMsg = uploadError.message;
        } else if (typeof uploadError === 'object') {
          try {
            errorMsg = JSON.stringify(uploadError);
          } catch (e) {
            errorMsg = 'Error no serializable durante la subida';
          }
        }
        
        setError(`Error durante la subida de videos: ${errorMsg}`);
        // No continuamos con la creación del curso si hay un error en la subida
        setLoading(false);
        setUploadingVideo(false);
        setUploadingPreview(false);
        return;
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
      
      console.log('Enviando datos del curso al backend:', cursoData);
      
      // Enviar datos al backend
      const response = await axios.post('/api/cursos', cursoData);
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.status === 201) {
        // Redireccionar al panel de administración
        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Error al crear curso:', err);
      let errorMsg = 'Ocurrió un error al crear el curso';
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      } else if (typeof err === 'object') {
        try {
          errorMsg = JSON.stringify(err);
        } catch (e) {
          errorMsg = 'Error no serializable';
        }
      }
      
      setError(errorMsg);
      // Mantener los datos del formulario para que el usuario pueda corregirlos
    } finally {
      setLoading(false);
      setUploadingVideo(false);
      setUploadingPreview(false);
    }
  };

  // Componente para mostrar el progreso de subida
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{progress}% completado</span>
        {progress > 0 && progress < 100 && (
          <span>Subiendo... Por favor, no cierre esta página</span>
        )}
        {progress === 100 && (
          <span className="text-green-600">¡Subida completada! Procesando...</span>
        )}
      </div>
    </div>
  );

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
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-bold mb-2">Error</h3>
              <p className="text-sm whitespace-pre-wrap overflow-auto max-h-32">{error}</p>
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => setError('')} 
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded-md transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <h2 className="text-blue-800 font-bold text-lg mb-2">Almacenamiento de Videos en MongoDB</h2>
            <p className="text-blue-700 mb-2">
              Los videos se subirán directamente a la base de datos MongoDB y se servirán desde allí.
              No se utilizarán servicios externos de almacenamiento.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Nota:</strong> El tamaño máximo de cada archivo es de 100MB. Para archivos más grandes, 
              considera comprimir el video o proporcionar una URL externa.
            </p>
          </div>
          
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
                      className={`border border-gray-300 rounded-lg p-4 flex items-center justify-center ${videoFile ? 'bg-blue-50' : 'cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/*"
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <FaUpload className={`${videoFile ? 'text-blue-500' : 'text-gray-400'} text-2xl mb-2`} />
                        <span className="text-sm text-gray-700 text-center">
                          {videoFile ? videoFile.name : 'Seleccionar archivo de video completo para subir a MongoDB'}
                        </span>
                        
                        {videoFile && !uploadingVideo && (
                          <span className="text-xs text-gray-500 mt-1">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    {uploadingVideo && (
                      <div className="mt-2">
                        <ProgressBar progress={uploadProgress.main} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow h-px bg-gray-200"></div>
                  <span className="mx-4 text-gray-500 text-xs">O</span>
                  <div className="flex-grow h-px bg-gray-200"></div>
                </div>
                
                <div>
                  <input
                    type="url"
                    id="video"
                    name="video"
                    value={formData.video}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL externa del video completo (opcional si subes archivo)"
                  />
                </div>
              </div>
              
              <p className="mt-1 text-sm text-gray-500">Sube un archivo de video a MongoDB o proporciona una URL externa.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video de Vista Previa *
              </label>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div 
                      className={`border border-gray-300 rounded-lg p-4 flex items-center justify-center ${videoPreviewFile ? 'bg-blue-50' : 'cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !uploadingPreview && videoPreviewInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={videoPreviewInputRef}
                        onChange={handleVideoPreviewChange}
                        accept="video/*"
                        disabled={uploadingPreview}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <FaUpload className={`${videoPreviewFile ? 'text-blue-500' : 'text-gray-400'} text-2xl mb-2`} />
                        <span className="text-sm text-gray-700 text-center">
                          {videoPreviewFile ? videoPreviewFile.name : 'Seleccionar archivo de vista previa para subir a MongoDB'}
                        </span>
                        
                        {videoPreviewFile && !uploadingPreview && (
                          <span className="text-xs text-gray-500 mt-1">
                            {(videoPreviewFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    {uploadingPreview && (
                      <div className="mt-2">
                        <ProgressBar progress={uploadProgress.preview} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow h-px bg-gray-200"></div>
                  <span className="mx-4 text-gray-500 text-xs">O</span>
                  <div className="flex-grow h-px bg-gray-200"></div>
                </div>
                
                <div>
                  <input
                    type="url"
                    id="videoPreview"
                    name="videoPreview"
                    value={formData.videoPreview}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL externa del video de vista previa (opcional si subes archivo)"
                  />
                </div>
              </div>
              
              <p className="mt-1 text-sm text-gray-500">Sube un archivo de video corto a MongoDB o proporciona una URL externa.</p>
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