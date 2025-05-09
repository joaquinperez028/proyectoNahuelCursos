'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const introFileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  
  // Estados para la carga directa del video principal
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  
  // Estados para el video de introducción
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);
  const [introUploadProgress, setIntroUploadProgress] = useState(0);
  const [isIntroUploading, setIsIntroUploading] = useState(false);
  const [introUploadId, setIntroUploadId] = useState<string | null>(null);
  const [introAssetId, setIntroAssetId] = useState<string | null>(null);
  const [introPlaybackId, setIntroPlaybackId] = useState<string | null>(null);
  const [introUploadStatus, setIntroUploadStatus] = useState<string | null>(null);
  
  // Verificar el estado de la carga del video principal
  useEffect(() => {
    if (uploadId && uploadStatus !== 'ready' && !isSubmitting) {
      const checkUploadStatus = async () => {
        try {
          const response = await fetch(`/api/mux-asset-status?uploadId=${uploadId}`);
          
          if (!response.ok) {
            throw new Error('Error al verificar el estado de la carga');
          }
          
          const data = await response.json();
          setUploadStatus(data.status);
          
          if (data.assetId) {
            setAssetId(data.assetId);
          }
          
          if (data.playbackId) {
            setPlaybackId(data.playbackId);
            // Si tenemos el playbackId, la carga está lista
            setUploadProgress(100);
            setIsUploading(false);
          } else if (data.status === 'asset_created') {
            setUploadProgress(90);
          } else if (data.status === 'preparing') {
            setUploadProgress(60);
          } else if (data.status === 'ready') {
            setUploadProgress(30);
          }
        } catch (error) {
          console.error('Error al verificar estado:', error);
        }
      };
      
      // Verificar cada 3 segundos
      const interval = setInterval(checkUploadStatus, 3000);
      
      return () => clearInterval(interval);
    }
  }, [uploadId, uploadStatus, isSubmitting]);
  
  // Verificar el estado de la carga del video de introducción
  useEffect(() => {
    if (introUploadId && introUploadStatus !== 'ready' && !isSubmitting) {
      const checkIntroUploadStatus = async () => {
        try {
          const response = await fetch(`/api/mux-asset-status?uploadId=${introUploadId}`);
          
          if (!response.ok) {
            throw new Error('Error al verificar el estado de la carga de introducción');
          }
          
          const data = await response.json();
          setIntroUploadStatus(data.status);
          
          if (data.assetId) {
            setIntroAssetId(data.assetId);
          }
          
          if (data.playbackId) {
            setIntroPlaybackId(data.playbackId);
            // Si tenemos el playbackId, la carga está lista
            setIntroUploadProgress(100);
            setIsIntroUploading(false);
          } else if (data.status === 'asset_created') {
            setIntroUploadProgress(90);
          } else if (data.status === 'preparing') {
            setIntroUploadProgress(60);
          } else if (data.status === 'ready') {
            setIntroUploadProgress(30);
          }
        } catch (error) {
          console.error('Error al verificar estado de intro:', error);
        }
      };
      
      // Verificar cada 3 segundos
      const interval = setInterval(checkIntroUploadStatus, 3000);
      
      return () => clearInterval(interval);
    }
  }, [introUploadId, introUploadStatus, isSubmitting]);
  
  // Redireccionar si no es administrador o no está autenticado
  if (status === 'loading') {
    return <div className="min-h-screen flex justify-center items-center">Cargando...</div>;
  }
  
  if (status === 'unauthenticated' || session?.user.role !== 'admin') {
    router.push('/');
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleIntroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIntroVideoFile(file);
    }
  };

  const uploadFile = async () => {
    if (!videoFile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);
    setUploadId(null);
    setAssetId(null);
    setPlaybackId(null);
    
    try {
      // 1. Solicitar una URL de carga directa
      const directUploadResponse = await fetch('/api/mux-direct-upload', {
        method: 'POST',
      });
      
      if (!directUploadResponse.ok) {
        const errorData = await directUploadResponse.json();
        throw new Error(errorData.error || 'Error al obtener URL de carga');
      }
      
      const directUploadData = await directUploadResponse.json();
      setUploadId(directUploadData.uploadId);
      setUploadProgress(10);
      
      // 2. Subir el archivo directamente a MUX
      const formData = new FormData();
      formData.append('file', videoFile);
      
      const uploadResponse = await fetch(directUploadData.uploadUrl, {
        method: 'PUT',
        body: videoFile,
        headers: {
          'Content-Type': videoFile.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo a MUX');
      }
      
      setUploadProgress(30);
      setUploadStatus('waiting');
      
      // 3. Esperar a que el archivo se procese (esto ocurre en el useEffect)
      
      // 4. Devolver la URL de reproducción cuando esté disponible
      return new Promise<string>((resolve, reject) => {
        const checkForPlaybackId = setInterval(async () => {
          if (playbackId) {
            clearInterval(checkForPlaybackId);
            resolve(`https://stream.mux.com/${playbackId}.m3u8`);
          }
        }, 1000);
        
        // Timeout después de 2 minutos
        setTimeout(() => {
          clearInterval(checkForPlaybackId);
          if (playbackId) {
            resolve(`https://stream.mux.com/${playbackId}.m3u8`);
          } else {
            reject(new Error('Tiempo de espera agotado para la creación del asset'));
          }
        }, 120000);
      });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al subir el archivo');
      }
      setIsUploading(false);
      return null;
    }
  };
  
  const uploadIntroFile = async () => {
    if (!introVideoFile) return null;
    
    setIsIntroUploading(true);
    setIntroUploadProgress(0);
    setIntroUploadStatus(null);
    setIntroUploadId(null);
    setIntroAssetId(null);
    setIntroPlaybackId(null);
    
    try {
      // 1. Solicitar una URL de carga directa
      const directUploadResponse = await fetch('/api/mux-direct-upload', {
        method: 'POST',
      });
      
      if (!directUploadResponse.ok) {
        const errorData = await directUploadResponse.json();
        throw new Error(errorData.error || 'Error al obtener URL de carga para el video de introducción');
      }
      
      const directUploadData = await directUploadResponse.json();
      setIntroUploadId(directUploadData.uploadId);
      setIntroUploadProgress(10);
      
      // 2. Subir el archivo directamente a MUX
      const uploadResponse = await fetch(directUploadData.uploadUrl, {
        method: 'PUT',
        body: introVideoFile,
        headers: {
          'Content-Type': introVideoFile.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Error al subir el video de introducción a MUX');
      }
      
      setIntroUploadProgress(30);
      setIntroUploadStatus('waiting');
      
      // 3. Esperar a que el archivo se procese (esto ocurre en el useEffect)
      
      // 4. Devolver el playbackId cuando esté disponible
      return new Promise<string>((resolve, reject) => {
        const checkForPlaybackId = setInterval(async () => {
          if (introPlaybackId) {
            clearInterval(checkForPlaybackId);
            resolve(introPlaybackId);
          }
        }, 1000);
        
        // Timeout después de 2 minutos
        setTimeout(() => {
          clearInterval(checkForPlaybackId);
          if (introPlaybackId) {
            resolve(introPlaybackId);
          } else {
            reject(new Error('Tiempo de espera agotado para la creación del video de introducción'));
          }
        }, 120000);
      });
    } catch (error) {
      console.error('Error al subir video de introducción:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al subir el video de introducción');
      }
      setIsIntroUploading(false);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    if (!description.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('El precio debe ser un número mayor que cero');
      return;
    }
    
    if (uploadMethod === 'url' && !videoUrl.trim()) {
      setError('La URL del video es obligatoria');
      return;
    }
    
    if (uploadMethod === 'file' && !videoFile && !playbackId) {
      setError('Debe seleccionar un archivo de video');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Si ya tenemos un playbackId, usamos esa URL
      let finalVideoUrl = videoUrl;
      
      if (uploadMethod === 'file') {
        if (playbackId) {
          finalVideoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
        } else {
          const uploadedFileUrl = await uploadFile();
          if (!uploadedFileUrl) {
            throw new Error('Error al subir el archivo de video a MUX');
          }
          finalVideoUrl = uploadedFileUrl;
        }
      }
      
      // Subir el video de introducción si existe
      let introVideoData = {};
      if (introVideoFile || introPlaybackId) {
        if (introPlaybackId) {
          introVideoData = {
            introVideoId: introAssetId || '',
            introPlaybackId
          };
        } else if (introVideoFile) {
          const introId = await uploadIntroFile();
          if (introId) {
            introVideoData = {
              introVideoId: introAssetId || '',
              introPlaybackId: introId
            };
          }
        }
      }
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          videoUrl: finalVideoUrl,
          ...introVideoData
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear el curso');
      }
      
      // Redireccionar a la lista de cursos
      router.push('/admin/cursos');
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ha ocurrido un error inesperado');
      }
      setIsSubmitting(false);
    }
  };
  
  // Estado de carga para mostrar en la interfaz
  const getUploadStatusText = () => {
    if (!uploadStatus || uploadStatus === 'waiting') return 'Subiendo archivo...';
    if (uploadStatus === 'asset_created') return 'Procesando video...';
    if (uploadStatus === 'ready') return 'Finalizando...';
    if (uploadStatus === 'preparing') return 'Preparando video...';
    if (uploadStatus === 'error') return 'Error en la carga';
    return `Estado: ${uploadStatus}`;
  };
  
  const getIntroUploadStatusText = () => {
    if (!introUploadStatus || introUploadStatus === 'waiting') return 'Subiendo video de introducción...';
    if (introUploadStatus === 'asset_created') return 'Procesando video de introducción...';
    if (introUploadStatus === 'ready') return 'Finalizando...';
    if (introUploadStatus === 'preparing') return 'Preparando video de introducción...';
    if (introUploadStatus === 'error') return 'Error en la carga';
    return `Estado: ${introUploadStatus}`;
  };
  
  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Crear nuevo curso</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título del curso
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Programación con JavaScript avanzado"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe de qué trata el curso..."
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Precio (USD)
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 49.99"
            />
          </div>
          
          {/* Video de introducción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Video de introducción</h3>
            <p className="text-sm text-gray-600 mb-4">
              Este video será visible para todos los usuarios como vista previa del curso
            </p>
            
            <div className="mt-1 flex items-center">
              <input
                type="file"
                id="introVideo"
                ref={introFileInputRef}
                onChange={handleIntroFileChange}
                accept="video/*"
                className="sr-only"
                disabled={isIntroUploading || !!introPlaybackId}
              />
              <label
                htmlFor="introVideo"
                className={`relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                  isIntroUploading || !!introPlaybackId ? 'bg-gray-100 text-gray-500' : 'text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <span>{introPlaybackId ? 'Video listo' : 'Seleccionar video de introducción'}</span>
              </label>
              <span className="ml-3 text-sm text-gray-500">
                {introVideoFile ? introVideoFile.name : introPlaybackId ? 'Video procesado correctamente' : 'Ningún archivo seleccionado'}
              </span>
              
              {!isIntroUploading && !introPlaybackId && introVideoFile && (
                <button
                  type="button"
                  onClick={uploadIntroFile}
                  className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Subir ahora
                </button>
              )}
            </div>
            
            {isIntroUploading && (
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${introUploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {getIntroUploadStatusText()} {introUploadProgress}%
                </p>
              </div>
            )}
            
            {introPlaybackId && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  <span className="font-medium">✓ Video de introducción listo</span> - Procesado correctamente en MUX.
                </p>
              </div>
            )}
          </div>
          
          {/* Video principal del curso */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Video principal del curso</h3>
            
            <div className="flex space-x-4 mb-4">
              <div className="flex items-center">
                <input
                  id="urlOption"
                  name="uploadMethod"
                  type="radio"
                  checked={uploadMethod === 'url'}
                  onChange={() => setUploadMethod('url')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="urlOption" className="ml-2 block text-sm text-gray-700">
                  URL del video
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="fileOption"
                  name="uploadMethod"
                  type="radio"
                  checked={uploadMethod === 'file'}
                  onChange={() => setUploadMethod('file')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="fileOption" className="ml-2 block text-sm text-gray-700">
                  Subir archivo
                </label>
              </div>
            </div>
            
            {uploadMethod === 'url' ? (
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL del video
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/video.mp4"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa una URL pública accesible del video. Se procesará a través de MUX para streaming adaptativo.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo de video
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="videoFile"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="sr-only"
                    disabled={isUploading || !!playbackId}
                  />
                  <label
                    htmlFor="videoFile"
                    className={`relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                      isUploading || !!playbackId ? 'bg-gray-100 text-gray-500' : 'text-gray-700 hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <span>{playbackId ? 'Video listo' : 'Seleccionar archivo'}</span>
                  </label>
                  <span className="ml-3 text-sm text-gray-500">
                    {videoFile ? videoFile.name : playbackId ? 'Video procesado correctamente' : 'Ningún archivo seleccionado'}
                  </span>
                  
                  {!isUploading && !playbackId && videoFile && (
                    <button
                      type="button"
                      onClick={uploadFile}
                      className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Subir ahora
                    </button>
                  )}
                </div>
                
                {isUploading && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {getUploadStatusText()} {uploadProgress}%
                    </p>
                  </div>
                )}
                
                {playbackId && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">✓ Video listo</span> - Procesado correctamente en MUX.
                    </p>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-500">
                  Sube un archivo de video. Se cargará directamente a MUX para streaming adaptativo.
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  El procesamiento del video en MUX puede tomar algunos minutos después de la carga.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/cursos')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || isIntroUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? 'Creando...' : 'Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 