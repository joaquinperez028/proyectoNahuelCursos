'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const uploadFile = async () => {
    if (!videoFile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al subir el archivo');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Ahora MUX devuelve el muxAssetId y playbackId
      // Construimos la URL de MUX para reproducción
      if (data.playbackId) {
        return `https://stream.mux.com/${data.playbackId}.m3u8`;
      } else {
        throw new Error('No se pudo obtener el ID de reproducción de MUX');
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al subir el archivo');
      }
      return null;
    } finally {
      setIsUploading(false);
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
    
    if (uploadMethod === 'file' && !videoFile) {
      setError('Debe seleccionar un archivo de video');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Si el método es por archivo, subir primero el archivo a MUX
      let finalVideoUrl = videoUrl;
      
      if (uploadMethod === 'file') {
        const uploadedFileUrl = await uploadFile();
        if (!uploadedFileUrl) {
          throw new Error('Error al subir el archivo de video a MUX');
        }
        // Usar la URL del archivo subido en MUX
        finalVideoUrl = uploadedFileUrl;
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
          
          <div className="mb-8">
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
                  />
                  <label
                    htmlFor="videoFile"
                    className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Seleccionar archivo</span>
                  </label>
                  <span className="ml-3 text-sm text-gray-500">
                    {videoFile ? videoFile.name : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                {isUploading && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Subiendo a MUX: {uploadProgress}%</p>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Sube un archivo de video. Se procesará a través de MUX para streaming adaptativo.
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Importante: El procesamiento del video en MUX puede tomar algunos minutos después de la carga.
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
              disabled={isSubmitting || isUploading}
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