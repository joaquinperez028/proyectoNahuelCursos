'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [uploadSession, setUploadSession] = useState<{[key: string]: string}>({});

  // Función para guardar el estado de la sesión de carga
  const saveUploadSession = (fileName: string, fileId: string) => {
    const session = { ...uploadSession, [fileName]: fileId };
    setUploadSession(session);
    
    // También guardarlo en localStorage para persistencia
    try {
      localStorage.setItem('uploadSession', JSON.stringify(session));
      console.log(`Sesión de carga guardada para ${fileName} con fileId=${fileId}`);
    } catch (e) {
      console.error('Error al guardar sesión de carga en localStorage:', e);
    }
  };
  
  // Función para recuperar el fileId de una sesión previa
  const getExistingFileId = (fileName: string): string | null => {
    const sessionFileId = uploadSession[fileName];
    
    if (sessionFileId) {
      console.log(`Recuperando sesión de carga existente para ${fileName}: fileId=${sessionFileId}`);
      return sessionFileId;
    }
    
    // Intentar recuperar de localStorage si no está en el estado
    try {
      const savedSession = localStorage.getItem('uploadSession');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed[fileName]) {
          // Actualizar el estado con todas las sesiones guardadas
          setUploadSession(parsed);
          console.log(`Sesión recuperada de localStorage para ${fileName}: fileId=${parsed[fileName]}`);
          return parsed[fileName];
        }
      }
    } catch (e) {
      console.error('Error al recuperar sesión de carga de localStorage:', e);
    }
    
    return null;
  };

  // Cargar sesiones de carga previas desde localStorage al inicio
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('uploadSession');
      if (savedSession) {
        setUploadSession(JSON.parse(savedSession));
        console.log('Sesiones de carga recuperadas de localStorage:', savedSession);
      }
    } catch (e) {
      console.error('Error al cargar sesiones de carga previas:', e);
    }
  }, []);

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
    // Tamaño de cada fragmento (reducido a 2MB para evitar errores 413)
    const CHUNK_SIZE = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;
    
    // Intentar recuperar un fileId previo para esta carga
    let fileId: string | null = getExistingFileId(file.name);
    
    // Si tenemos un fileId previo, mostrar mensaje de recuperación
    if (fileId) {
      console.log(`Reanudando carga previa para ${file.name} con fileId=${fileId}`);
      setError(`Reanudando carga previa para ${file.name}. Si continúa encontrando errores, puede intentar recargar la página para iniciar una nueva carga.`);
      setTimeout(() => setError(''), 5000); // Limpiar el mensaje después de 5 segundos
      
      // Obtener información sobre fragmentos ya subidos antes de continuar
      try {
        const chunkInfoResponse = await axios.get(`/api/upload/chunks/info?fileId=${fileId}`);
        const alreadyUploadedChunks = chunkInfoResponse.data.uploadedChunks || [];
        
        console.log(`Información de carga recuperada. Fragmentos ya subidos: ${alreadyUploadedChunks.length}/${totalChunks}`);
        
        // Actualizar progreso inicial basado en los fragmentos ya subidos
        if (alreadyUploadedChunks.length > 0) {
          const initialProgress = Math.round((alreadyUploadedChunks.length / totalChunks) * 100);
          
          if (file === videoFile) {
            setUploadProgress(prev => ({ ...prev, main: initialProgress }));
          } else {
            setUploadProgress(prev => ({ ...prev, preview: initialProgress }));
          }
          
          // Ya mostrar fragmentos subidos
          uploadedChunks = alreadyUploadedChunks.length;
        }
      } catch (error) {
        console.warn('No se pudo obtener información sobre fragmentos ya subidos:', error);
        // Seguir con la carga normal incluso si falla esta verificación
      }
    } else {
      console.log(`Iniciando nueva carga para ${file.name}`);
    }
    
    console.log(`Iniciando subida fragmentada para ${file.name}. Total de fragmentos: ${totalChunks}`);
    console.log(`Tipo de archivo: ${file.type}, Tamaño: ${file.size} bytes`);
    
    try {
      // Crear un array para realizar un seguimiento de los fragmentos subidos con éxito
      const successfulChunks = new Set<number>();
      
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
        chunkFormData.append('chunk', chunk, file.name);
        chunkFormData.append('fileName', file.name);
        chunkFormData.append('contentType', file.type || 'application/octet-stream');
        chunkFormData.append('totalChunks', totalChunks.toString());
        chunkFormData.append('chunkIndex', chunkIndex.toString());
        
        // Si ya tenemos un fileId (no es el primer fragmento o estamos reanudando), lo incluimos
        if (fileId) {
          chunkFormData.append('fileId', fileId);
        }
        
        let retryCount = 0;
        const maxRetries = 3;
        let fragmentUploaded = false;
        
        while (retryCount <= maxRetries && !fragmentUploaded) {
          try {
            console.log(`Enviando fragmento ${chunkIndex + 1}/${totalChunks}${retryCount > 0 ? ` (intento ${retryCount}/${maxRetries})` : ''}...`);
            
            // Enviar el fragmento al servidor con un tiempo de espera más largo
            const response = await axios.post('/api/upload/chunks', chunkFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 120000, // 2 minutos por fragmento
              onUploadProgress: (progressEvent) => {
                // Calcular el progreso total teniendo en cuenta todos los fragmentos
                const chunkProgress = progressEvent.loaded / (progressEvent.total || chunk.size);
                const successfulCount = successfulChunks.size;
                const overallProgress = ((successfulCount + chunkProgress) / totalChunks) * 100;
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
            
            // Guardar el fileId devuelto por el servidor (para el primer fragmento o si cambia)
            let fileIdUpdated = false;
            
            // Priorizar el fileId explícito
            if (response.data.fileId) {
              fileId = response.data.fileId;
              console.log(`FileId explícito obtenido/actualizado: ${fileId}`);
              fileIdUpdated = true;
            }
            // Si no hay fileId explícito pero hay fsFileId, usar ese (solo para el primer fragmento)
            else if (response.data.fsFileId && chunkIndex === 0) {
              fileId = response.data.fsFileId;
              console.log(`FsFileId obtenido del primer fragmento: ${fileId}`);
              fileIdUpdated = true;
            }
            
            // Verificar que tenemos un fileId válido
            if (!fileId) {
              console.error('Error: No se recibió un fileId válido del servidor');
              throw new Error('No se recibió un fileId válido del servidor. No se puede continuar con la carga.');
            }
            
            // Guardar la sesión de carga para recuperación futura si el ID fue actualizado
            if (fileIdUpdated) {
              saveUploadSession(file.name, fileId);
              
              // Logging para diagnóstico
              console.log(`FileId actualizado para próximos fragmentos: ${fileId}`);
              
              // Solo para el primer fragmento, registrar qué ID usaremos para los siguientes
              if (chunkIndex === 0) {
                console.log(`IMPORTANTE: Se usará fileId=${fileId} para todos los fragmentos subsiguientes`);
              }
            }
            
            uploadedChunks++;
            successfulChunks.add(chunkIndex);
            fragmentUploaded = true;
            console.log(`Fragmento ${chunkIndex + 1}/${totalChunks} subido correctamente. FileId: ${fileId}`);
            
            // En el último fragmento, finalizar el archivo
            if (chunkIndex === totalChunks - 1 && fileId) {
              console.log('Todos los fragmentos subidos. Verificando estado de finalización...');
              
              // Verificar si ya fue marcado como completo en el último fragmento
              if (response.data.isComplete) {
                console.log('El servidor ya marcó el archivo como completo:', response.data);
                // Usar el fsFileId devuelto o cualquier ruta de archivo proporcionada
                if (response.data.fsFileId) {
                  return `/api/videos/${response.data.fsFileId}`;
                } else if (response.data.filePath) {
                  return response.data.filePath;
                } else {
                  return `/api/videos/${fileId}`;
                }
              }
              
              // Si no se marcó como completo, intentar finalizarlo manualmente
              try {
                console.log('Solicitando finalización manual...');
                const finalizeResponse = await axios.post('/api/upload/chunks/finalize', {
                  fileId: fileId,
                  fileName: file.name,
                  contentType: file.type || 'application/octet-stream',
                  totalChunks: totalChunks
                }, {
                  timeout: 180000 // 3 minutos para finalizar
                });
                
                console.log('Archivo completado exitosamente:', finalizeResponse.data);
                return finalizeResponse.data.filePath || `/api/videos/${fileId}`;
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
          } catch (chunkError: any) {
            // Capturar específicamente el error de clave duplicada
            if (chunkError.response?.data?.error && 
                (chunkError.response.data.error.includes('duplicate key error') || 
                 chunkError.response.data.error.includes('E11000'))) {
              console.log(`Detectado error de clave duplicada para fragmento ${chunkIndex + 1}. Fragmento probablemente ya subido.`);
              
              // Marcamos este fragmento como completado y continuamos con el siguiente
              successfulChunks.add(chunkIndex);
              fragmentUploaded = true;
              uploadedChunks++;
              continue;
            }
            
            // Capturar específicamente el error 413 (Entidad demasiado grande)
            if (chunkError.response?.status === 413) {
              console.error(`Error 413: Fragmento ${chunkIndex + 1} demasiado grande.`);
              
              // Si ya estamos en el último intento, lanzar el error
              if (retryCount >= maxRetries) {
                setErrorDetails(JSON.stringify({
                  message: "Fragmento demasiado grande para el servidor",
                  chunkIndex,
                  chunkSize: chunk.size,
                  status: 413,
                  responseMessage: chunkError.response?.data?.message || "Request Entity Too Large"
                }, null, 2));
                
                throw new Error(`Error en fragmento ${chunkIndex + 1}/${totalChunks}: El fragmento es demasiado grande para el servidor (Error 413). Por favor, intenta con un archivo más pequeño o contacta al administrador.`);
              }
              
              // Incrementar el contador de reintentos y continuar con el siguiente intento
              retryCount++;
              console.log(`Reintentando con fragmento más pequeño (intento ${retryCount}/${maxRetries})...`);
              continue;
            }
            
            // Para otros errores, registrar y lanzar normalmente
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
            
            // Si aún hay reintentos disponibles, continuar
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Reintentando envío de fragmento (intento ${retryCount}/${maxRetries})...`);
              // Añadir pequeño retraso antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            
            throw new Error(errorMessage);
          }
        }
        
        // Si después de todos los reintentos no se pudo subir el fragmento, salir
        if (!fragmentUploaded) {
          throw new Error(`No se pudo subir el fragmento ${chunkIndex + 1} después de ${maxRetries} intentos`);
        }
      }
      
      // Si llegamos aquí, todos los fragmentos se han subido
      if (fileId) {
        return `/api/videos/${fileId}`;
      } else {
        throw new Error('Subida completada pero no se obtuvo un ID de archivo válido');
      }
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
          
          // Agregar más información de registro para diagnóstico
          console.log(`Detalles del archivo de video principal:`, {
            nombre: videoFile.name,
            tamaño: `${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`,
            tipo: videoFile.type,
            fragmentación: videoFile.size > 20 * 1024 * 1024 ? 'Sí (subida fragmentada)' : 'No (subida normal)'
          });
          
          try {
            videoPath = await uploadVideoFile(videoFile);
            console.log('Video principal subido correctamente a MongoDB GridFS:', videoPath);
          } catch (videoUploadError: any) {
            // Mejorar el manejo de errores con más detalles
            console.error('Error detallado al subir video principal:', videoUploadError);
            let errorInfo = {};
            
            try {
              errorInfo = {
                message: videoUploadError.message || 'Error desconocido',
                stack: videoUploadError.stack,
                name: videoUploadError.name,
                fileName: videoFile.name,
                fileSize: videoFile.size,
                fileType: videoFile.type
              };
              
              if (videoUploadError.response) {
                errorInfo['responseStatus'] = videoUploadError.response.status;
                errorInfo['responseData'] = videoUploadError.response.data;
              }
            } catch (e) {
              console.error('Error al extraer información del error:', e);
            }
            
            // Capturar específicamente errores de [object Object]
            if (videoUploadError.toString() === '[object Object]') {
              console.error('Error [object Object] detectado durante la subida del video principal');
              setError('Error durante la subida del video principal. Por favor, inténtalo de nuevo o contacta con soporte técnico.');
              setErrorDetails(JSON.stringify(errorInfo, null, 2));
            } else {
              setError(`Error al subir video principal: ${videoUploadError.message || 'Error desconocido'}`);
              setErrorDetails(JSON.stringify(errorInfo, null, 2));
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
          
          // Agregar más información de registro para diagnóstico
          console.log(`Detalles del archivo de vista previa:`, {
            nombre: videoPreviewFile.name,
            tamaño: `${(videoPreviewFile.size / (1024 * 1024)).toFixed(2)}MB`,
            tipo: videoPreviewFile.type,
            fragmentación: videoPreviewFile.size > 20 * 1024 * 1024 ? 'Sí (subida fragmentada)' : 'No (subida normal)'
          });
          
          try {
            videoPreviewPath = await uploadVideoFile(videoPreviewFile);
            console.log('Video de vista previa subido correctamente a MongoDB GridFS:', videoPreviewPath);
          } catch (previewUploadError: any) {
            // Mejorar el manejo de errores con más detalles
            console.error('Error detallado al subir video de vista previa:', previewUploadError);
            let errorInfo = {};
            
            try {
              errorInfo = {
                message: previewUploadError.message || 'Error desconocido',
                stack: previewUploadError.stack,
                name: previewUploadError.name,
                fileName: videoPreviewFile.name,
                fileSize: videoPreviewFile.size,
                fileType: videoPreviewFile.type
              };
              
              if (previewUploadError.response) {
                errorInfo['responseStatus'] = previewUploadError.response.status;
                errorInfo['responseData'] = previewUploadError.response.data;
              }
            } catch (e) {
              console.error('Error al extraer información del error:', e);
            }
            
            // Capturar específicamente errores de [object Object]
            if (previewUploadError.toString() === '[object Object]') {
              console.error('Error [object Object] detectado durante la subida del video de vista previa');
              setError('Error durante la subida del video de vista previa. Por favor, inténtalo de nuevo o contacta con soporte técnico.');
              setErrorDetails(JSON.stringify(errorInfo, null, 2));
            } else {
              setError(`Error al subir video de vista previa: ${previewUploadError.message || 'Error desconocido'}`);
              setErrorDetails(JSON.stringify(errorInfo, null, 2));
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

  // Función para limpiar sesiones de carga
  const clearUploadSessions = () => {
    try {
      localStorage.removeItem('uploadSession');
      setUploadSession({});
      console.log('Sesiones de carga eliminadas');
      setError('Sesiones de carga eliminadas correctamente. Puede iniciar nuevas cargas.');
      setTimeout(() => setError(''), 3000);
    } catch (e) {
      console.error('Error al eliminar sesiones de carga:', e);
      setError('Error al eliminar las sesiones de carga');
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
            
            {/* Botón para limpiar sesiones de carga */}
            {Object.keys(uploadSession).length > 0 && (
              <div className="mt-3 p-2 bg-blue-100 rounded">
                <p className="text-xs text-blue-700 mb-1">
                  <strong>Sesiones de carga activas:</strong> {Object.keys(uploadSession).length} archivo(s)
                </p>
                <button
                  type="button"
                  onClick={clearUploadSessions}
                  className="text-xs py-1 px-2 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-md transition"
                >
                  Limpiar sesiones de carga y comenzar de nuevo
                </button>
              </div>
            )}
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