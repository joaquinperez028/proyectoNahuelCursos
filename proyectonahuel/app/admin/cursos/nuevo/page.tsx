'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Interfaces para videos y ejercicios
interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoFile: File | null;
  videoId: string | null;
  playbackId: string | null;
  uploadId: string | null;
  uploadStatus: string | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  order: number;
}

interface ExerciseItem {
  id: string;
  title: string;
  description: string;
  pdfFile: File | null;
  fileData: any | null;
  isUploading: boolean;
  error: string | null;
  order: number;
}

export default function NewCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const introFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  
  // Estados para la imagen de miniatura
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<{ data: string, contentType: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
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
  
  // Estados para videos adicionales
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideoTab, setActiveVideoTab] = useState<string | null>(null);
  
  // Estados para ejercicios PDF
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [activeExerciseTab, setActiveExerciseTab] = useState<string | null>(null);
  
  // Funciones para gestionar videos adicionales
  const addVideo = () => {
    const newId = `video-${Date.now()}`;
    const newVideo: VideoItem = {
      id: newId,
      title: '',
      description: '',
      videoFile: null,
      videoId: null,
      playbackId: null,
      uploadId: null,
      uploadStatus: null,
      uploadProgress: 0,
      isUploading: false,
      error: null,
      order: videos.length
    };
    setVideos([...videos, newVideo]);
    setActiveVideoTab(newId);
  };

  const updateVideo = (id: string, updates: Partial<VideoItem>) => {
    setVideos(videos.map(video => 
      video.id === id ? { ...video, ...updates } : video
    ));
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(video => video.id !== id));
    if (activeVideoTab === id) {
      setActiveVideoTab(videos.length > 1 ? videos[0].id : null);
    }
  };

  const handleVideoFileChange = (id: string, file: File | null) => {
    if (file) {
      updateVideo(id, { videoFile: file });
    }
  };

  const uploadVideoFile = async (id: string) => {
    const videoIndex = videos.findIndex(v => v.id === id);
    if (videoIndex === -1 || !videos[videoIndex].videoFile) return;
    
    const videoFile = videos[videoIndex].videoFile;
    console.log(`Iniciando carga del video ${id}:`, videos[videoIndex].title);
    
    const updatedVideos = [...videos];
    updatedVideos[videoIndex] = {
      ...updatedVideos[videoIndex],
      isUploading: true, 
      uploadProgress: 0,
      error: null
    };
    setVideos(updatedVideos);
    
    try {
      // 1. Solicitar una URL de carga directa
      console.log('Solicitando URL de carga directa a MUX...');
      const directUploadResponse = await fetch('/api/mux-direct-upload', {
        method: 'POST',
      });
      
      console.log('Respuesta de la API de carga directa:', directUploadResponse.status);
      
      if (!directUploadResponse.ok) {
        const errorData = await directUploadResponse.json();
        console.error('Error en respuesta de MUX direct upload:', errorData);
        throw new Error(errorData.error || 'Error al obtener URL de carga');
      }
      
      const directUploadData = await directUploadResponse.json();
      console.log('URL de carga obtenida:', directUploadData.uploadUrl);
      
      const uploadId = directUploadData.uploadId; // Guardar uploadId localmente
      
      const videosWithUploadId = [...videos];
      const currentIndex = videosWithUploadId.findIndex(v => v.id === id);
      if (currentIndex !== -1) {
        videosWithUploadId[currentIndex] = {
          ...videosWithUploadId[currentIndex],
          uploadId: uploadId,
          uploadProgress: 10
        };
        setVideos(videosWithUploadId);
      }
      
      // 2. Subir el archivo directamente a MUX usando XMLHttpRequest para mejor seguimiento
      console.log('Subiendo archivo a MUX usando XMLHttpRequest...', directUploadData.uploadUrl);
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Configurar eventos de seguimiento
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Calcular el progreso (10-70%)
            const progress = 10 + Math.round((event.loaded / event.total) * 60);
            
            const progressVideos = [...videos];
            const idx = progressVideos.findIndex(v => v.id === id);
            if (idx !== -1) {
              progressVideos[idx] = {
                ...progressVideos[idx],
                uploadProgress: progress
              };
              setVideos(progressVideos);
            }
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Archivo subido exitosamente a MUX');
            
            const successVideos = [...videos];
            const idx = successVideos.findIndex(v => v.id === id);
            if (idx !== -1) {
              successVideos[idx] = {
                ...successVideos[idx],
                uploadProgress: 70,
                uploadStatus: 'waiting'
              };
              setVideos(successVideos);
            }
            
            resolve();
          } else {
            console.error('Error al subir a MUX:', xhr.status, xhr.statusText);
            reject(new Error(`Error al subir archivo: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => {
          console.error('Error de red al subir archivo a MUX');
          reject(new Error('Error de red al intentar subir el archivo'));
        };
        
        xhr.onabort = () => {
          console.warn('Carga abortada');
          reject(new Error('Carga abortada'));
        };
        
        // Iniciar la solicitud
        xhr.open('PUT', directUploadData.uploadUrl, true);
        if (videoFile) {
          xhr.setRequestHeader('Content-Type', videoFile.type);
          xhr.send(videoFile);
        } else {
          reject(new Error('No se encontró el archivo de video'));
        }
      });
      
      // 3. Iniciar verificación de estado - pasando directamente el uploadId
      console.log('Iniciando verificación de estado para el video:', id, 'con uploadId:', uploadId);
      checkVideoUploadStatusWithId(id, uploadId);
      
    } catch (error) {
      console.error(`Error al subir video ${id}:`, error);
      
      const errorVideos = [...videos];
      const idx = errorVideos.findIndex(v => v.id === id);
      
      if (idx !== -1) {
        errorVideos[idx] = {
          ...errorVideos[idx],
          error: error instanceof Error ? error.message : 'Error al subir el video',
          isUploading: false
        };
        setVideos(errorVideos);
      }
    }
  };

  // Nueva función que recibe directamente el uploadId
  const checkVideoUploadStatusWithId = async (id: string, uploadId: string) => {
    const videoIndex = videos.findIndex(v => v.id === id);
    if (videoIndex === -1) {
      console.error('No se puede verificar estado: video no encontrado', id);
      return;
    }
    
    console.log(`Verificando estado para video ${id} con uploadId ${uploadId} (pasado directamente)`);
    
    // Contador de intentos
    let attempts = 0;
    const maxAttempts = 40; // 2 minutos (3s * 40)
    
    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`Intento ${attempts}/${maxAttempts}: verificando estado de ${uploadId}`);
        
        const response = await fetch(`/api/mux-asset-status?uploadId=${uploadId}`);
        
        if (!response.ok) {
          console.error('Error en respuesta de verificación:', response.status, response.statusText);
          throw new Error('Error al verificar el estado de la carga');
        }
        
        const data = await response.json();
        console.log('Estado de la carga:', data);
        
        // Obtener el estado actual del video para asegurarnos de que estamos trabajando con la última versión
        const currentVideos = [...videos];
        const currentVideoIndex = currentVideos.findIndex(v => v.id === id);
        
        if (currentVideoIndex === -1) {
          console.error('Video no encontrado en el estado actual');
          return true; // Detener verificación
        }
        
        let updates: Partial<VideoItem> = { uploadStatus: data.status };
        
        if (data.assetId) {
          console.log('Asset ID recibido:', data.assetId);
          updates.videoId = data.assetId;
        }
        
        if (data.playbackId) {
          console.log('Playback ID recibido:', data.playbackId);
          updates.playbackId = data.playbackId;
          updates.uploadProgress = 100;
          updates.isUploading = false;
          
          // Actualizar el estado directamente
          const updatedVideos = [...currentVideos];
          updatedVideos[currentVideoIndex] = {
            ...updatedVideos[currentVideoIndex],
            ...updates
          };
          setVideos(updatedVideos);
          return true; // Carga completa
        } else if (data.status === 'asset_created') {
          updates.uploadProgress = 90;
        } else if (data.status === 'preparing') {
          updates.uploadProgress = 80;
        } else if (data.status === 'ready') {
          updates.uploadProgress = 70;
        }
        
        // Actualizar el estado directamente
        const updatedVideos = [...currentVideos];
        updatedVideos[currentVideoIndex] = {
          ...updatedVideos[currentVideoIndex],
          ...updates
        };
        setVideos(updatedVideos);
        
        // Si ya intentamos demasiadas veces, detener
        if (attempts >= maxAttempts) {
          console.warn(`Máximo de intentos (${maxAttempts}) alcanzado para el video ${id}`);
          const errorVideos = [...updatedVideos];
          errorVideos[currentVideoIndex] = {
            ...errorVideos[currentVideoIndex],
            error: 'Tiempo de espera agotado para la creación del asset',
            isUploading: false
          };
          setVideos(errorVideos);
          return true;
        }
        
        return false; // Carga no completada
      } catch (error) {
        console.error(`Error al verificar estado del video ${id} (intento ${attempts}):`, error);
        
        // Si ya intentamos demasiadas veces, detener
        if (attempts >= maxAttempts) {
          const currentVideos = [...videos];
          const currentVideoIndex = currentVideos.findIndex(v => v.id === id);
          
          if (currentVideoIndex !== -1) {
            const errorVideos = [...currentVideos];
            errorVideos[currentVideoIndex] = {
              ...errorVideos[currentVideoIndex],
              error: 'Demasiados errores al verificar el estado',
              isUploading: false
            };
            setVideos(errorVideos);
          }
          return true;
        }
        
        return false;
      }
    };
    
    // Función que maneja el intervalo de verificación
    const startStatusCheck = () => {
      console.log(`Iniciando verificación periódica para video ${id} con uploadId ${uploadId}`);
      
      const intervalCheck = async () => {
        const completed = await checkStatus();
        
        if (completed) {
          console.log(`Verificación completada para video ${id}, deteniendo intervalo`);
          clearInterval(interval);
          return;
        }
      };
      
      // Verificar inmediatamente la primera vez
      intervalCheck();
      
      // Luego, verificar cada 3 segundos
      const interval = setInterval(intervalCheck, 3000);
      
      // Configurar un timeout global como respaldo
      setTimeout(() => {
        console.log(`Timeout global alcanzado para video ${id}`);
        clearInterval(interval);
        
        // Verificar si el video ya tiene playbackId
        const currentVideos = [...videos];
        const currentVideoIndex = currentVideos.findIndex(v => v.id === id);
        
        if (currentVideoIndex !== -1 && 
            !currentVideos[currentVideoIndex].playbackId && 
            currentVideos[currentVideoIndex].isUploading) {
          console.warn(`El video ${id} no completó el proceso en el tiempo máximo`);
          
          const errorVideos = [...currentVideos];
          errorVideos[currentVideoIndex] = {
            ...errorVideos[currentVideoIndex],
            error: 'Tiempo de espera agotado para la creación del asset',
            isUploading: false
          };
          setVideos(errorVideos);
        }
      }, 120000); // 2 minutos
    };
    
    // Iniciar la verificación
    startStatusCheck();
  };

  // Mantener la función original para compatibilidad
  const checkVideoUploadStatus = async (id: string) => {
    const videoIndex = videos.findIndex(v => v.id === id);
    if (videoIndex === -1 || !videos[videoIndex].uploadId) {
      console.error('No se puede verificar estado: video no encontrado o sin uploadId', id);
      return;
    }
    
    const uploadId = videos[videoIndex].uploadId;
    checkVideoUploadStatusWithId(id, uploadId);
  };

  // Funciones para gestionar ejercicios PDF
  const addExercise = () => {
    const newId = `exercise-${Date.now()}`;
    const newExercise: ExerciseItem = {
      id: newId,
      title: '',
      description: '',
      pdfFile: null,
      fileData: null,
      isUploading: false,
      error: null,
      order: exercises.length
    };
    setExercises([...exercises, newExercise]);
    setActiveExerciseTab(newId);
  };

  const updateExercise = (id: string, updates: Partial<ExerciseItem>) => {
    setExercises(exercises.map(exercise => 
      exercise.id === id ? { ...exercise, ...updates } : exercise
    ));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(exercise => exercise.id !== id));
    if (activeExerciseTab === id) {
      setActiveExerciseTab(exercises.length > 1 ? exercises[0].id : null);
    }
  };

  const handlePdfFileChange = (id: string, file: File | null) => {
    if (file) {
      updateExercise(id, { pdfFile: file });
    }
  };

  const uploadPdfFile = async (id: string) => {
    const exercise = exercises.find(e => e.id === id);
    if (!exercise || !exercise.pdfFile) return;
    
    updateExercise(id, { 
      isUploading: true,
      error: null
    });
    
    try {
      const formData = new FormData();
      formData.append('pdf', exercise.pdfFile);
      
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir el PDF');
      }
      
      const data = await response.json();
      updateExercise(id, { 
        fileData: data.fileData,
        isUploading: false
      });
      
    } catch (error) {
      console.error(`Error al subir PDF ${id}:`, error);
      if (error instanceof Error) {
        updateExercise(id, { 
          error: error.message,
          isUploading: false
        });
      } else {
        updateExercise(id, { 
          error: 'Error al subir el PDF',
          isUploading: false
        });
      }
    }
  };
  
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      
      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadImage = async () => {
    if (!thumbnailFile) return null;
    
    setIsUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', thumbnailFile);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la imagen');
      }
      
      const data = await response.json();
      setThumbnailImage(data.imageData);
      setIsUploadingImage(false);
      
      return data.imageData;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al subir la imagen');
      }
      setIsUploadingImage(false);
      return null;
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
    
    if (!category) {
      setError('Debes seleccionar una categoría');
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
    
    // Validar videos adicionales
    for (const video of videos) {
      if (!video.title.trim()) {
        setError(`El título del video "${video.id}" es obligatorio`);
        setActiveVideoTab(video.id);
        return;
      }
      
      if (!video.playbackId) {
        setError(`Debe subir el archivo de video para "${video.title}"`);
        setActiveVideoTab(video.id);
        return;
      }
    }
    
    // Validar ejercicios
    for (const exercise of exercises) {
      if (!exercise.title.trim()) {
        setError(`El título del ejercicio "${exercise.id}" es obligatorio`);
        setActiveExerciseTab(exercise.id);
        return;
      }
      
      if (!exercise.fileData) {
        setError(`Debe subir el archivo PDF para "${exercise.title}"`);
        setActiveExerciseTab(exercise.id);
        return;
      }
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
      
      // Subir la imagen si existe
      let thumbnailData = {};
      if (thumbnailFile) {
        if (thumbnailImage) {
          thumbnailData = {
            thumbnailImage
          };
        } else {
          const uploadedImage = await uploadImage();
          if (uploadedImage) {
            thumbnailData = {
              thumbnailImage: uploadedImage
            };
          }
        }
      }
      
      // Preparar datos de videos adicionales
      const videosData = videos.map(video => ({
        title: video.title,
        description: video.description,
        videoId: video.videoId,
        playbackId: video.playbackId,
        order: video.order
      }));
      
      // Preparar datos de ejercicios
      const exercisesData = exercises.map(exercise => ({
        title: exercise.title,
        description: exercise.description,
        fileData: exercise.fileData,
        order: exercise.order
      }));
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          videoUrl: finalVideoUrl,
          ...introVideoData,
          ...thumbnailData,
          videos: videosData,
          exercises: exercisesData
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
        <h1 className="text-3xl font-bold text-[var(--neutral-100)] mb-6">Crear nuevo curso</h1>
        
        <form onSubmit={handleSubmit} className="bg-[var(--card)] shadow-md rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
              Título del curso
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
              placeholder="Ej: Programación con JavaScript avanzado"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
              placeholder="Describe de qué trata el curso..."
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
              Precio (USD)
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
              placeholder="Ej: 49.99"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
              Categoría
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            >
              <option value="" disabled>Selecciona una categoría</option>
              <option value="Análisis Técnico">Análisis Técnico</option>
              <option value="Análisis Fundamental">Análisis Fundamental</option>
              <option value="Estrategias de Trading">Estrategias de Trading</option>
              <option value="Finanzas Personales">Finanzas Personales</option>
            </select>
            <p className="mt-1 text-xs text-[var(--neutral-400)]">
              Esta categoría determinará dónde aparecerá tu curso en la página principal
            </p>
          </div>
          
          {/* Imagen de miniatura */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-3">Imagen de miniatura</h3>
            <p className="text-sm text-[var(--neutral-300)] mb-4">
              Esta imagen se mostrará como vista previa del curso en la página principal
            </p>
            
            <div className="flex items-start space-x-4">
              <div className="mt-1 flex-grow">
                <input
                  type="file"
                  id="thumbnailImage"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={isUploadingImage || !!thumbnailImage}
                />
                <label
                  htmlFor="thumbnailImage"
                  className={`relative cursor-pointer bg-[var(--neutral-800)] py-2 px-3 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium ${
                    isUploadingImage || !!thumbnailImage ? 'bg-[var(--neutral-700)] text-[var(--neutral-400)]' : 'text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]`}
                >
                  <span>{thumbnailImage ? 'Imagen lista' : 'Seleccionar imagen'}</span>
                </label>
                <span className="ml-3 text-sm text-[var(--neutral-400)]">
                  {thumbnailFile ? thumbnailFile.name : thumbnailImage ? 'Imagen procesada correctamente' : 'Ningún archivo seleccionado'}
                </span>
                
                {!isUploadingImage && !thumbnailImage && thumbnailFile && (
                  <button
                    type="button"
                    onClick={uploadImage}
                    className="ml-3 px-3 py-1 bg-[var(--primary)] text-white text-sm rounded-md hover:bg-[var(--primary-dark)]"
                  >
                    Subir ahora
                  </button>
                )}
                
                <p className="mt-2 text-xs text-[var(--neutral-400)]">
                  Formatos aceptados: JPG, PNG, WEBP, GIF. Tamaño máximo: 5MB.
                </p>
              </div>
              
              {thumbnailPreview && (
                <div className="relative w-32 h-32 border rounded-md overflow-hidden shadow-sm">
                  <Image
                    src={thumbnailPreview}
                    alt="Vista previa de la imagen"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            
            {isUploadingImage && (
              <div className="mt-2">
                <div className="bg-[var(--neutral-600)] rounded-full h-2.5">
                  <div 
                    className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-[var(--neutral-300)]">
                  Procesando imagen...
                </p>
              </div>
            )}
            
            {thumbnailImage && (
              <div className="mt-2 p-2 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-md">
                <p className="text-sm text-[var(--success)]">
                  <span className="font-medium">✓ Imagen lista</span> - Procesada correctamente.
                </p>
              </div>
            )}
          </div>
          
          {/* Sección de videos adicionales */}
          <div className="border rounded-lg p-6 mb-8 bg-[var(--card-hovered)] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[var(--neutral-100)]">Videos del curso</h3>
              <button
                type="button"
                onClick={addVideo}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)]"
              >
                Añadir video
              </button>
            </div>
            
            {videos.length === 0 ? (
              <div className="text-center py-8 bg-[var(--neutral-800)] border border-dashed border-[var(--border)] rounded-md">
                <p className="text-[var(--neutral-400)]">
                  No hay videos añadidos. Haz clic en "Añadir video" para comenzar.
                </p>
              </div>
            ) : (
              <div>
                {/* Pestañas de videos */}
                <div className="border-b border-[var(--border)]">
                  <nav className="-mb-px flex space-x-2 overflow-x-auto">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => setActiveVideoTab(video.id)}
                        className={`py-2 px-3 border-b-2 whitespace-nowrap ${
                          activeVideoTab === video.id
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-[var(--neutral-400)] hover:text-[var(--neutral-200)] hover:border-[var(--neutral-600)]'
                        }`}
                        type="button"
                      >
                        {video.title ? video.title : `Video ${index + 1}`}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Contenido de video activo */}
                {videos.map(video => (
                  <div
                    key={video.id}
                    className={`pt-4 ${activeVideoTab === video.id ? 'block' : 'hidden'}`}
                  >
                    <div className="flex justify-between mb-4">
                      <h4 className="text-md font-medium text-[var(--neutral-100)]">
                        {video.title ? video.title : 'Nuevo video'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeVideo(video.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Título del video */}
                      <div className="mb-4">
                        <label htmlFor={`video-title-${video.id}`} className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Título del video
                        </label>
                        <input
                          type="text"
                          id={`video-title-${video.id}`}
                          value={video.title}
                          onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                          className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
                          placeholder="Ej: Introducción a JavaScript"
                        />
                      </div>
                      
                      {/* Descripción del video */}
                      <div className="mb-4">
                        <label htmlFor={`video-desc-${video.id}`} className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Descripción
                        </label>
                        <textarea
                          id={`video-desc-${video.id}`}
                          value={video.description}
                          onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                          rows={3}
                          className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
                          placeholder="Descripción breve del contenido del video..."
                        />
                      </div>
                      
                      {/* Upload de video */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Archivo de video*
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="file"
                            id={`video-file-${video.id}`}
                            onChange={(e) => handleVideoFileChange(video.id, e.target.files?.[0] || null)}
                            accept="video/*"
                            className="sr-only"
                            disabled={video.isUploading || !!video.playbackId}
                          />
                          <label
                            htmlFor={`video-file-${video.id}`}
                            className={`relative cursor-pointer bg-[var(--neutral-800)] py-2 px-3 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium ${
                              video.isUploading || !!video.playbackId ? 'bg-[var(--neutral-700)] text-[var(--neutral-400)]' : 'text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]`}
                          >
                            <span>{video.playbackId ? 'Video listo' : 'Seleccionar archivo'}</span>
                          </label>
                          <span className="ml-3 text-sm text-[var(--neutral-400)]">
                            {video.videoFile ? video.videoFile.name : video.playbackId ? 'Video procesado correctamente' : 'Ningún archivo seleccionado'}
                          </span>
                          
                          {!video.isUploading && !video.playbackId && video.videoFile && (
                            <button
                              type="button"
                              onClick={() => uploadVideoFile(video.id)}
                              className="ml-3 px-3 py-1 bg-[var(--primary)] text-white text-sm rounded-md hover:bg-[var(--primary-dark)]"
                            >
                              Subir ahora
                            </button>
                          )}
                        </div>
                        
                        {video.isUploading && (
                          <div className="mt-2">
                            <div className="bg-[var(--neutral-600)] rounded-full h-2.5">
                              <div 
                                className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${video.uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="mt-1 text-sm text-[var(--neutral-300)]">
                              {video.uploadProgress < 70 ? (
                                `Subiendo archivo... ${video.uploadProgress}%`
                               ) : video.uploadStatus === 'waiting' ? 'Esperando procesamiento...' :
                                 video.uploadStatus === 'asset_created' ? 'Procesando video...' :
                                 video.uploadStatus === 'ready' ? 'Finalizando...' :
                                 video.uploadStatus === 'preparing' ? 'Preparando video...' :
                                 video.uploadStatus === 'error' ? 'Error en la carga' :
                                 `Estado: ${video.uploadStatus || 'procesando'}`}
                            </p>
                          </div>
                        )}
                        
                        {video.error && (
                          <p className="mt-2 text-sm text-red-500">{video.error}</p>
                        )}
                        
                        {video.playbackId && (
                          <div className="mt-2 p-2 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-md">
                            <p className="text-sm text-[var(--success)]">
                              <span className="font-medium">✓ Video listo</span> - Procesado correctamente.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sección de ejercicios */}
          <div className="border rounded-lg p-6 mb-8 bg-[var(--card-hovered)] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[var(--neutral-100)]">Ejercicios del curso</h3>
              <button
                type="button"
                onClick={addExercise}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)]"
              >
                Añadir ejercicio
              </button>
            </div>
            
            {exercises.length === 0 ? (
              <div className="text-center py-8 bg-[var(--neutral-800)] border border-dashed border-[var(--border)] rounded-md">
                <p className="text-[var(--neutral-400)]">
                  No hay ejercicios añadidos. Haz clic en "Añadir ejercicio" para comenzar.
                </p>
              </div>
            ) : (
              <div>
                {/* Pestañas de ejercicios */}
                <div className="border-b border-[var(--border)]">
                  <nav className="-mb-px flex space-x-2 overflow-x-auto">
                    {exercises.map((exercise, index) => (
                      <button
                        key={exercise.id}
                        onClick={() => setActiveExerciseTab(exercise.id)}
                        className={`py-2 px-3 border-b-2 whitespace-nowrap ${
                          activeExerciseTab === exercise.id
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-[var(--neutral-400)] hover:text-[var(--neutral-200)] hover:border-[var(--neutral-600)]'
                        }`}
                        type="button"
                      >
                        {exercise.title ? exercise.title : `Ejercicio ${index + 1}`}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Contenido de ejercicio activo */}
                {exercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className={`pt-4 ${activeExerciseTab === exercise.id ? 'block' : 'hidden'}`}
                  >
                    <div className="flex justify-between mb-4">
                      <h4 className="text-md font-medium text-[var(--neutral-100)]">
                        {exercise.title ? exercise.title : 'Nuevo ejercicio'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Título del ejercicio */}
                      <div className="mb-4">
                        <label htmlFor={`exercise-title-${exercise.id}`} className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Título del ejercicio
                        </label>
                        <input
                          type="text"
                          id={`exercise-title-${exercise.id}`}
                          value={exercise.title}
                          onChange={(e) => updateExercise(exercise.id, { title: e.target.value })}
                          className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
                          placeholder="Ej: Ejercicio práctico 1"
                        />
                      </div>
                      
                      {/* Descripción del ejercicio */}
                      <div className="mb-4">
                        <label htmlFor={`exercise-desc-${exercise.id}`} className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Descripción
                        </label>
                        <textarea
                          id={`exercise-desc-${exercise.id}`}
                          value={exercise.description}
                          onChange={(e) => updateExercise(exercise.id, { description: e.target.value })}
                          rows={3}
                          className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
                          placeholder="Instrucciones para el ejercicio..."
                        />
                      </div>
                      
                      {/* Upload de PDF */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                          Archivo PDF*
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="file"
                            id={`pdf-file-${exercise.id}`}
                            onChange={(e) => handlePdfFileChange(exercise.id, e.target.files?.[0] || null)}
                            accept="application/pdf"
                            className="sr-only"
                            disabled={exercise.isUploading || !!exercise.fileData}
                          />
                          <label
                            htmlFor={`pdf-file-${exercise.id}`}
                            className={`relative cursor-pointer bg-[var(--neutral-800)] py-2 px-3 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium ${
                              exercise.isUploading || !!exercise.fileData ? 'bg-[var(--neutral-700)] text-[var(--neutral-400)]' : 'text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]`}
                          >
                            <span>{exercise.fileData ? 'PDF listo' : 'Seleccionar archivo'}</span>
                          </label>
                          <span className="ml-3 text-sm text-[var(--neutral-400)]">
                            {exercise.pdfFile ? exercise.pdfFile.name : exercise.fileData ? 'PDF procesado correctamente' : 'Ningún archivo seleccionado'}
                          </span>
                          
                          {!exercise.isUploading && !exercise.fileData && exercise.pdfFile && (
                            <button
                              type="button"
                              onClick={() => uploadPdfFile(exercise.id)}
                              className="ml-3 px-3 py-1 bg-[var(--primary)] text-white text-sm rounded-md hover:bg-[var(--primary-dark)]"
                            >
                              Subir ahora
                            </button>
                          )}
                        </div>
                        
                        {exercise.isUploading && (
                          <div className="mt-2">
                            <div className="bg-[var(--neutral-600)] rounded-full h-2.5">
                              <div 
                                className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <p className="mt-1 text-sm text-[var(--neutral-300)]">
                              Procesando PDF...
                            </p>
                          </div>
                        )}
                        
                        {exercise.error && (
                          <p className="mt-2 text-sm text-red-500">{exercise.error}</p>
                        )}
                        
                        {exercise.fileData && (
                          <div className="mt-2 p-2 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-md">
                            <p className="text-sm text-[var(--success)]">
                              <span className="font-medium">✓ PDF listo</span> - {exercise.fileData.name || 'Procesado correctamente'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Video de introducción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-3">Video de introducción</h3>
            <p className="text-sm text-[var(--neutral-300)] mb-4">
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
                className={`relative cursor-pointer bg-[var(--neutral-800)] py-2 px-3 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium ${
                  isIntroUploading || !!introPlaybackId ? 'bg-[var(--neutral-700)] text-[var(--neutral-400)]' : 'text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]`}
              >
                <span>{introPlaybackId ? 'Video listo' : 'Seleccionar video de introducción'}</span>
              </label>
              <span className="ml-3 text-sm text-[var(--neutral-400)]">
                {introVideoFile ? introVideoFile.name : introPlaybackId ? 'Video procesado correctamente' : 'Ningún archivo seleccionado'}
              </span>
              
              {!isIntroUploading && !introPlaybackId && introVideoFile && (
                <button
                  type="button"
                  onClick={uploadIntroFile}
                  className="ml-3 px-3 py-1 bg-[var(--primary)] text-white text-sm rounded-md hover:bg-[var(--primary-dark)]"
                >
                  Subir ahora
                </button>
              )}
            </div>
            
            {isIntroUploading && (
              <div className="mt-2">
                <div className="bg-[var(--neutral-600)] rounded-full h-2.5">
                  <div 
                    className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${introUploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-[var(--neutral-300)]">
                  {getIntroUploadStatusText()} {introUploadProgress}%
                </p>
              </div>
            )}
            
            {introPlaybackId && (
              <div className="mt-2 p-2 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-md">
                <p className="text-sm text-[var(--success)]">
                  <span className="font-medium">✓ Video de introducción listo</span> - Procesado correctamente en MUX.
                </p>
              </div>
            )}
          </div>
          
          {/* Video principal del curso */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-[var(--neutral-100)] mb-3">Video principal del curso</h3>
            
            <div className="flex space-x-4 mb-4">
              <div className="flex items-center">
                <input
                  id="urlOption"
                  name="uploadMethod"
                  type="radio"
                  checked={uploadMethod === 'url'}
                  onChange={() => setUploadMethod('url')}
                  className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="urlOption" className="ml-2 block text-sm text-[var(--neutral-300)]">
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
                  className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="fileOption" className="ml-2 block text-sm text-[var(--neutral-300)]">
                  Subir archivo
                </label>
              </div>
            </div>
            
            {uploadMethod === 'url' ? (
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                  URL del video
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--neutral-800)] text-[var(--neutral-100)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--neutral-400)]"
                  placeholder="https://example.com/video.mp4"
                />
                <p className="mt-1 text-sm text-[var(--neutral-400)]">
                  Ingresa una URL pública accesible del video. Se procesará a través de MUX para streaming adaptativo.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="videoFile" className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
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
                    className={`relative cursor-pointer bg-[var(--neutral-800)] py-2 px-3 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium ${
                      isUploading || !!playbackId ? 'bg-[var(--neutral-700)] text-[var(--neutral-400)]' : 'text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]`}
                  >
                    <span>{playbackId ? 'Video listo' : 'Seleccionar archivo'}</span>
                  </label>
                  <span className="ml-3 text-sm text-[var(--neutral-400)]">
                    {videoFile ? videoFile.name : playbackId ? 'Video procesado correctamente' : 'Ningún archivo seleccionado'}
                  </span>
                  
                  {!isUploading && !playbackId && videoFile && (
                    <button
                      type="button"
                      onClick={uploadFile}
                      className="ml-3 px-3 py-1 bg-[var(--primary)] text-white text-sm rounded-md hover:bg-[var(--primary-dark)]"
                    >
                      Subir ahora
                    </button>
                  )}
                </div>
                
                {isUploading && (
                  <div className="mt-2">
                    <div className="bg-[var(--neutral-600)] rounded-full h-2.5">
                      <div 
                        className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-[var(--neutral-300)]">
                      {getUploadStatusText()} {uploadProgress}%
                    </p>
                  </div>
                )}
                
                {playbackId && (
                  <div className="mt-2 p-2 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-md">
                    <p className="text-sm text-[var(--success)]">
                      <span className="font-medium">✓ Video listo</span> - Procesado correctamente en MUX.
                    </p>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-[var(--neutral-400)]">
                  Sube un archivo de video. Se cargará directamente a MUX para streaming adaptativo.
                </p>
                <p className="mt-1 text-xs text-amber-500">
                  El procesamiento del video en MUX puede tomar algunos minutos después de la carga.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-[var(--neutral-700)] text-[var(--neutral-200)] rounded-md hover:bg-[var(--neutral-600)]"
              onClick={() => router.push('/admin/cursos')}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isUploading || isIntroUploading || videos.some(v => v.isUploading)}
            >
              {isSubmitting ? 'Creando curso...' : 'Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 