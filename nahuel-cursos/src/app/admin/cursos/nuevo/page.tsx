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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ main: 0, preview: 0 });
  const [useChunkedUpload, setUseChunkedUpload] = useState(true);

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

  // Función auxiliar para formatear errores
  const formatError = (error: any): string => {
    if (!error) return 'Error desconocido';
    
    // Si ya es un string, devolverlo directamente
    if (typeof error === 'string') return error;
    
    // Definir un replacer personalizado para JSON.stringify que acceda a propiedades no enumerables
    const customReplacer = (key: string, value: any) => {
      // Para propiedades circulares o funciones
      if (typeof value === 'function') {
        return '[Función]';
      }
      if (value === window || value === document) {
        return '[Objeto del DOM]';
      }
      return value;
    };
    
    // Caso especial para [object Object]
    if (error.toString() === '[object Object]') {
      try {
        // Intentar extraer información útil
        const details = [];
        
        if (error.message) details.push(`Mensaje: ${error.message}`);
        if (error.name) details.push(`Tipo: ${error.name}`);
        if (error.code) details.push(`Código: ${error.code}`);
        if (error.status) details.push(`Estado: ${error.status}`);
        if (error.response?.status) details.push(`Estado HTTP: ${error.response.status}`);
        if (error.response?.statusText) details.push(`Texto HTTP: ${error.response.statusText}`);
        if (error.response?.data) {
          const dataStr = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data, customReplacer);
          details.push(`Datos: ${dataStr}`);
        }
        
        // Si encontramos detalles útiles, usarlos
        if (details.length > 0) {
          return details.join('\n');
        }
        
        // Si no, intentar serializar todo el objeto con un enfoque más agresivo
        try {
          // Intentar usar Object.getOwnPropertyNames para obtener todas las propiedades
          const allProps = Object.getOwnPropertyNames(error);
          const safeProps = {};
          
          // Extraer valores de forma segura
          for (const prop of allProps) {
            try {
              if (typeof error[prop] !== 'function' && 
                  typeof error[prop] !== 'undefined' &&
                  error[prop] !== null) {
                safeProps[prop] = error[prop];
              }
            } catch (e) {
              safeProps[prop] = "[No accesible]";
            }
          }
          
          // Almacenar detalles para mostrar luego
          setErrorDetails(JSON.stringify(safeProps, customReplacer, 2));
          
          // Construir un mensaje más amigable para el usuario
          return "Se produjo un error durante la carga del video. Hemos guardado detalles técnicos que puedes ver expandiendo abajo.";
        } catch (e) {
          console.error("Error al intentar serializar el objeto de error:", e);
          return JSON.stringify(error, customReplacer);
        }
      } catch (e) {
        // Si falla la serialización
        setErrorDetails("El error no pudo ser serializado para mostrar detalles. Revisar la consola para más información.");
        return "Error no serializable - Por favor intenta de nuevo o contacta con soporte técnico.";
      }
    }
    
    // Casos normales
    if (error.message) return error.message;
    if (error.toString) return error.toString();
    
    return 'Error desconocido';
  };

  // Función para subir archivos grandes en fragmentos
  const uploadLargeVideoInChunks = async (file: File): Promise<string> => {
    // Tamaño de cada fragmento (5MB)
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;
    let fileId: string | null = null;
    
    console.log(`Iniciando subida fragmentada para ${file.name}. Total de fragmentos: ${totalChunks}`);
    console.log(`Tipo de archivo: ${file.type}, Tamaño: ${file.size} bytes`);
    
    try {
      // Subir cada fragmento secuencialmente
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);
        
        console.log(`Preparando fragmento ${chunkIndex + 1}/${totalChunks} (${start}-${end} de ${file.size} bytes)`);
        console.log(`Tamaño del fragmento: ${chunk.size} bytes, tipo: ${chunk.type || file.type}`);
        
        // Verificar que el fragmento tenga contenido
        if (chunk.size === 0) {
          throw new Error(`El fragmento ${chunkIndex + 1} está vacío`);
        }
        
        // Crear FormData para este fragmento
        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk, file.name); // Añadir nombre de archivo también al chunk
        chunkFormData.append('fileName', file.name);
        chunkFormData.append('contentType', file.type || 'application/octet-stream');
        chunkFormData.append('totalChunks', totalChunks.toString());
        chunkFormData.append('currentChunk', chunkIndex.toString());
        
        // Si ya tenemos un fileId (no es el primer fragmento), lo incluimos
        if (fileId) {
          chunkFormData.append('fileId', fileId);
        }
        
        try {
          console.log(`Enviando fragmento ${chunkIndex + 1}/${totalChunks}...`);
          // Enviar el fragmento al servidor con un tiempo de espera más largo
          const response = await axios.post('/api/upload/chunks', chunkFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutos por fragmento
            onUploadProgress: (progressEvent) => {
              // Calcular el progreso total teniendo en cuenta todos los fragmentos
              const chunkProgress = progressEvent.loaded / (progressEvent.total || chunk.size);
              const overallProgress = ((chunkIndex + chunkProgress) / totalChunks) * 100;
              const percentCompleted = Math.round(overallProgress);
              
              console.log(`Progreso de fragmento ${chunkIndex + 1}: ${Math.round(chunkProgress * 100)}%, Total: ${percentCompleted}%`);
              
              // Actualizar el progreso global
              if (file === videoFile) {
                setUploadProgress(prev => ({ ...prev, main: percentCompleted }));
              } else {
                setUploadProgress(prev => ({ ...prev, preview: percentCompleted }));
              }
            }
          });
          
          console.log(`Respuesta del servidor para fragmento ${chunkIndex + 1}:`, response.data);
          
          // Guardar el fileId devuelto por el servidor
          if (response.data.fileId) {
            fileId = response.data.fileId;
            console.log(`FileId obtenido/actualizado: ${fileId}`);
          } else {
            console.warn(`Advertencia: No se recibió fileId para el fragmento ${chunkIndex + 1}`);
          }
          
          uploadedChunks++;
          console.log(`Fragmento ${chunkIndex + 1}/${totalChunks} subido correctamente. FileId: ${fileId}`);
        } catch (chunkError: any) {
          // Manejar errores específicos de la subida de fragmentos
          console.error(`Error al subir fragmento ${chunkIndex + 1}/${totalChunks}:`, chunkError);
          
          let errorMessage = `Error en fragmento ${chunkIndex + 1}/${totalChunks}: `;
          
          // Determinar el mensaje de error específico
          if (chunkError.response?.data?.error) {
            errorMessage += chunkError.response.data.error;
          } else if (chunkError.message) {
            errorMessage += chunkError.message;
          } else if (chunkError.toString() === '[object Object]') {
            try {
              errorMessage += JSON.stringify(chunkError);
            } catch (e) {
              errorMessage += 'Error no serializable - Ver consola para más detalles';
            }
          } else {
            errorMessage += 'Error desconocido durante la subida del fragmento';
          }
          
          // Almacenar detalles adicionales del error
          try {
            setErrorDetails(JSON.stringify({
              chunkIndex,
              totalChunks,
              fileId,
              fileName: file.name,
              chunkSize: chunk.size,
              responseStatus: chunkError.response?.status,
              responseData: chunkError.response?.data,
              message: chunkError.message
            }, null, 2));
          } catch (e) {
            setErrorDetails(`Error no serializable para fragmento ${chunkIndex + 1}/${totalChunks}`);
          }
          
          throw new Error(errorMessage);
        }
        
        // En el último fragmento, finalizar el archivo
        if (chunkIndex === totalChunks - 1 && fileId) {
          console.log('Todos los fragmentos subidos. Solicitando finalización...');
          try {
            const finalizeResponse = await axios.post('/api/upload/chunks/finalize', {
              fileId: fileId,
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              totalChunks: totalChunks
            }, {
              timeout: 180000 // 3 minutos para finalizar
            });
            
            console.log('Archivo completado exitosamente:', finalizeResponse.data);
            return finalizeResponse.data.filePath;
          } catch (finalizeError: any) {
            console.error('Error al finalizar la subida fragmentada:', finalizeError);
            
            let errorMessage = 'Error al finalizar la combinación de fragmentos: ';
            
            if (finalizeError.response?.data?.error) {
              errorMessage += finalizeError.response.data.error;
            } else if (finalizeError.message) {
              errorMessage += finalizeError.message;
            } else {
              errorMessage += 'Error desconocido durante la finalización';
            }
            
            throw new Error(errorMessage);
          }
        }
      }
      
      throw new Error('No se pudo completar la subida de todos los fragmentos');
    } catch (error: any) {
      console.error('Error en la subida fragmentada:', error);
      
      // Componer un mensaje de error más detallado
      let errorMessage = error.message || 'Error desconocido durante la subida fragmentada';
      
      // Añadir información contextual
      errorMessage += ` (Fragmentos subidos: ${uploadedChunks}/${totalChunks})`;
      
      throw new Error(errorMessage);
    }
  };

  const uploadVideoFile = async (file: File): Promise<string> => {
    try {
      console.log('Iniciando subida del archivo a MongoDB GridFS:', file.name);
      
      // Usar subida fragmentada para archivos grandes
      if (useChunkedUpload && file.size > 20 * 1024 * 1024) {
        console.log('Archivo grande detectado. Usando subida fragmentada...');
        return await uploadLargeVideoInChunks(file);
      }
      
      // Para archivos pequeños, usar el método normal
      console.log('Usando subida normal para archivo pequeño');
      
      // Verificar tamaño antes de intentar subir
      if (file.size > 25 * 1024 * 1024) {
        console.warn('Archivo grande detectado:', file.size, 'bytes. Puede exceder límites del servidor.');
        setError('El archivo es demasiado grande para una subida directa. Usando subida fragmentada...');
        return await uploadLargeVideoInChunks(file);
      }
      
      // Crear instancia de FormData
      const formData = new FormData();
      formData.append('video', file);
      
      console.log('Tamaño del archivo a subir:', file.size, 'bytes');
      console.log('Tipo del archivo a subir:', file.type);
      
      const response = await axios.post('/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Añadir timeout y seguimiento de progreso
        timeout: 600000, // 10 minutos para archivos grandes
        maxContentLength: Infinity, // Sin límite de contenido en Axios
        maxBodyLength: Infinity, // Sin límite de cuerpo en Axios
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
      
      // Detección específica del error 413 (Entidad demasiado grande)
      if (error.response && error.response.status === 413) {
        const errorMsg = 'El archivo es demasiado grande para ser subido. El límite del servidor es 25MB aproximadamente. Por favor, comprime el video o usa una URL externa.';
        setError(`Error al subir video: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Depuración detallada del error
      console.error('Tipo de error:', typeof error);
      console.error('Error es instancia de Error:', error instanceof Error);
      console.error('JSON.stringify del error:');
      try {
        console.error(JSON.stringify(error, null, 2));
      } catch (e) {
        console.error('Error no serializable con JSON.stringify');
      }
      
      console.error('Propiedades del error:');
      for (const prop in error) {
        try {
          console.error(`${prop}:`, error[prop]);
        } catch (e) {
          console.error(`Error al acceder a la propiedad ${prop}`);
        }
      }
      
      console.error('Detalles adicionales del error:', {
        isAxiosError: error.isAxiosError,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Usar la función de formateo de errores
      let errorMsg = formatError(error.response?.data || error);
      
      // Si hay datos más detallados en la respuesta
      if (error.response?.data?.error) {
        errorMsg = formatError(error.response.data.error);
      }
      
      setError(`Error al subir video: ${errorMsg}`);
      
      // Almacenar detalles adicionales si es necesario
      if (error.toString() === '[object Object]') {
        try {
          setErrorDetails(JSON.stringify(error, null, 2));
        } catch (e) {
          setErrorDetails("Error no serializable - Ver consola para más detalles");
        }
      }
      
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
          try {
            videoPath = await uploadVideoFile(videoFile);
            console.log('Video principal subido correctamente a MongoDB GridFS:', videoPath);
          } catch (videoUploadError) {
            // Capturar específicamente errores de [object Object]
            if (videoUploadError.toString() === '[object Object]') {
              console.error('Error [object Object] detectado durante la subida del video principal');
              setError('Error durante la subida del video principal. Por favor, inténtalo de nuevo o contacta con soporte técnico.');
              setErrorDetails(JSON.stringify(videoUploadError, Object.getOwnPropertyNames(videoUploadError), 2));
            } else {
              throw videoUploadError; // Re-lanzar para que lo capture el bloque catch externo
            }
            setLoading(false);
            setUploadingVideo(false);
            setUploadingPreview(false);
            return;
          }
          setUploadingVideo(false);
        }
        
        if (videoPreviewFile) {
          setUploadingPreview(true);
          setUploadProgress(prev => ({ ...prev, preview: 0 }));
          console.log('Subiendo video de vista previa a MongoDB GridFS...');
          try {
            videoPreviewPath = await uploadVideoFile(videoPreviewFile);
            console.log('Video de vista previa subido correctamente a MongoDB GridFS:', videoPreviewPath);
          } catch (previewUploadError) {
            // Capturar específicamente errores de [object Object]
            if (previewUploadError.toString() === '[object Object]') {
              console.error('Error [object Object] detectado durante la subida del video de vista previa');
              setError('Error durante la subida del video de vista previa. Por favor, inténtalo de nuevo o contacta con soporte técnico.');
              setErrorDetails(JSON.stringify(previewUploadError, Object.getOwnPropertyNames(previewUploadError), 2));
            } else {
              throw previewUploadError; // Re-lanzar para que lo capture el bloque catch externo
            }
            setLoading(false);
            setUploadingVideo(false);
            setUploadingPreview(false);
            return;
          }
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
              
              {errorDetails && (
                <div className="mt-3 border-t border-red-200 pt-3">
                  <details>
                    <summary className="text-sm font-medium cursor-pointer">Ver detalles técnicos</summary>
                    <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64">{errorDetails}</pre>
                  </details>
                </div>
              )}
              
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => {
                    setError('');
                    setErrorDetails(null);
                  }} 
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
              <strong>Nota:</strong> El sistema ahora soporta subida de archivos grandes (hasta 100MB) usando 
              un proceso de fragmentación que divide los archivos en partes más pequeñas.
            </p>
            <div className="mt-2 flex items-center">
              <input
                type="checkbox"
                id="useChunkedUpload"
                checked={useChunkedUpload}
                onChange={(e) => setUseChunkedUpload(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="useChunkedUpload" className="ml-2 block text-sm text-blue-700">
                Habilitar subida fragmentada para archivos grandes (recomendado)
              </label>
            </div>
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
                        
                        {videoFile && uploadingVideo && (
                          <div className="mt-2">
                            <ProgressBar progress={uploadProgress.main} />
                            {uploadProgress.main === 100 && (
                              <p className="text-xs text-green-600 mt-1 text-center">
                                Procesando fragmentos... Por favor, espere.
                              </p>
                            )}
                            {videoFile.size > 20 * 1024 * 1024 && useChunkedUpload && (
                              <p className="text-xs text-blue-600 mt-1 text-center">
                                Usando subida fragmentada para este archivo grande
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
                        
                        {videoPreviewFile && uploadingPreview && (
                          <div className="mt-2">
                            <ProgressBar progress={uploadProgress.preview} />
                            {uploadProgress.preview === 100 && (
                              <p className="text-xs text-green-600 mt-1 text-center">
                                Procesando fragmentos... Por favor, espere.
                              </p>
                            )}
                            {videoPreviewFile.size > 20 * 1024 * 1024 && useChunkedUpload && (
                              <p className="text-xs text-blue-600 mt-1 text-center">
                                Usando subida fragmentada para este archivo grande
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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