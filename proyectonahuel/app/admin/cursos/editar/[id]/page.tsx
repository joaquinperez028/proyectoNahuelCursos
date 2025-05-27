'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  _id?: string; // ID de MongoDB opcional
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
  _id?: string; // ID de MongoDB opcional
}

interface PageProps<T = {}> {
  params: Promise<T>;
}

interface EditCourseParams {
  id: string;
}

export default function EditCoursePage({ params }: PageProps<EditCourseParams>) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [id, setId] = useState<string>('');
  
  // Estado para los campos del formulario
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [featured, setFeatured] = useState<boolean>(false);
  const [onSale, setOnSale] = useState<boolean>(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  
  // Estado para el manejo de videos
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideoTab, setActiveVideoTab] = useState<string | null>(null);
  
  // Estado para el manejo de ejercicios
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [activeExerciseTab, setActiveExerciseTab] = useState<string | null>(null);
  
  // Estado para el manejo de la UI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // 1. Estado combinado para la lista ordenable
  const [courseItems, setCourseItems] = useState<Array<{ type: 'video' | 'exercise', id: string }>>([]);

  // Sincronizar courseItems cada vez que videos o exercises cambian
  useEffect(() => {
    const all = [
      ...videos.map(v => ({ type: 'video' as const, id: v.id, order: v.order })),
      ...exercises.map(e => ({ type: 'exercise' as const, id: e.id, order: e.order }))
    ];
    all.sort((a, b) => a.order - b.order);
    setCourseItems(all);
  }, [videos, exercises]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) return;
    const updated = [...courseItems];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    let v = [...videos];
    let e = [...exercises];
    updated.forEach((item, idx) => {
      if (item.type === 'video') {
        v = v.map(vid => vid.id === item.id ? { ...vid, order: idx } : vid);
      } else {
        e = e.map(ex => ex.id === item.id ? { ...ex, order: idx } : ex);
      }
    });
    setVideos(v);
    setExercises(e);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Resolver el parámetro ID
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);
      } catch (err) {
        setError('Error al cargar los parámetros');
        setIsLoading(false);
      }
    };
    
    loadParams();
  }, [params]);

  // Comprobar autenticación y permisos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (session?.user?.role !== 'admin' && status === 'authenticated') {
      router.push('/');
    }
  }, [session, status, router]);

  // Cargar datos del curso cuando id esté disponible
  useEffect(() => {
    if (!id) return;
    
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el curso');
        }
        
        const course = await response.json();
        
        // Cargar datos básicos en el formulario
        setTitle(course.title || '');
        setDescription(course.description || '');
        setPrice(course.price || 0);
        setFeatured(course.featured || false);
        setOnSale(course.onSale || false);
        setDiscountPercentage(course.discountPercentage || 0);
        
        // Cargar videos existentes
        if (course.videos && Array.isArray(course.videos)) {
          const loadedVideos = course.videos.map((video: any, index: number) => ({
            id: `existing-video-${video._id || index}`,
            title: video.title || '',
            description: video.description || '',
            videoFile: null,
            videoId: video.videoId || null,
            playbackId: video.playbackId || null,
            uploadId: null,
            uploadStatus: 'ready',
            uploadProgress: 100,
            isUploading: false,
            error: null,
            order: video.order || index,
            _id: video._id // Guardar el ID original
          }));
          
          setVideos(loadedVideos);
          if (loadedVideos.length > 0) {
            setActiveVideoTab(loadedVideos[0].id);
          }
        }
        
        // Cargar ejercicios existentes
        if (course.exercises && Array.isArray(course.exercises)) {
          const loadedExercises = course.exercises.map((exercise: any, index: number) => ({
            id: `existing-exercise-${exercise._id || index}`,
            title: exercise.title || '',
            description: exercise.description || '',
            pdfFile: null,
            fileData: exercise.fileData || null,
            isUploading: false,
            error: null,
            order: exercise.order || index,
            _id: exercise._id // Guardar el ID original
          }));
          
          setExercises(loadedExercises);
          if (loadedExercises.length > 0) {
            setActiveExerciseTab(loadedExercises[0].id);
          }
        }
        
      } catch (error) {
        setError('Error al cargar el curso');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [id]);

  // Funciones para gestionar videos
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

  // Funciones para gestionar ejercicios
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

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    // Validación básica
    if (!title.trim()) {
      setError('El título del curso es obligatorio');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Preparar datos de videos
      const videosData = videos.map(video => ({
        title: video.title,
        description: video.description,
        videoId: video.videoId,
        playbackId: video.playbackId,
        order: video.order,
        _id: video._id // Incluir el ID original si existe
      }));
      
      // Preparar datos de ejercicios
      const exercisesData = exercises.map(exercise => ({
        title: exercise.title,
        description: exercise.description,
        fileData: exercise.fileData,
        order: exercise.order,
        _id: exercise._id // Incluir el ID original si existe
      }));
      
      const courseData = {
        title,
        description,
        price,
        featured,
        onSale,
        discountPercentage,
        videos: videosData,
        exercises: exercisesData
      };
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el curso');
      }
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/admin/cursos');
        router.refresh();
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Error al actualizar el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Editar curso</h1>
        <form onSubmit={handleSubmit} className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-900 text-red-300 border border-red-700 rounded-lg px-3 py-2 text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900 text-green-300 border border-green-700 rounded-lg px-3 py-2 text-sm mb-4">
              Curso actualizado correctamente. Redirigiendo...
            </div>
          )}
          <div className="space-y-4">
            <label htmlFor="title" className="block text-sm text-neutral-400 uppercase">Título del curso</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Programación con JavaScript avanzado"
            />
          </div>
          <div className="space-y-4">
            <label htmlFor="description" className="block text-sm text-neutral-400 uppercase">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe de qué trata el curso..."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm text-neutral-400 uppercase">Precio (USD)</label>
            <input
              type="number"
              id="price"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Precio del curso"
            />
            <p className="mt-1 text-xs text-neutral-500">Establecer a 0 para cursos gratuitos</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-neutral-700 rounded bg-neutral-800"
            />
            <label htmlFor="featured" className="text-sm text-neutral-400 uppercase">Destacar curso en la página principal</label>
          </div>
          <div className="border-t border-neutral-700 mt-6 pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Configuración de oferta</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="onSale"
                checked={onSale}
                onChange={(e) => setOnSale(e.target.checked)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-neutral-700 rounded bg-neutral-800"
              />
              <label htmlFor="onSale" className="text-sm text-neutral-400 uppercase">Activar oferta para este curso</label>
            </div>
            <div className="space-y-2">
              <label htmlFor="discountPercentage" className="block text-sm text-neutral-400 uppercase">Descuento (%)</label>
              <input
                type="number"
                id="discountPercentage"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Porcentaje de descuento"
              />
            </div>
          </div>
          <div className="border-t border-neutral-700 mt-6 pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Videos del curso</h3>
            <div className="space-y-4">
              {videos.map(video => (
                <div key={video.id} className={`bg-neutral-800 border border-neutral-700 rounded-lg p-4 ${activeVideoTab === video.id ? 'block' : 'hidden'}`}>
                  <div className="flex justify-between mb-4">
                    <h4 className="text-md font-semibold text-white">{video.title ? video.title : 'Nuevo video'}</h4>
                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-3 py-1 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-neutral-400 uppercase">Título del video*</label>
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Título del video"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-400 uppercase">Descripción</label>
                      <textarea
                        value={video.description}
                        onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                        rows={3}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe de qué trata este video"
                      />
                    </div>
                    {video.playbackId && (
                      <div className="mt-2 bg-green-900 text-green-300 border border-green-700 rounded-lg px-3 py-2 text-sm">
                        ✓ Video existente - Ya está subido y listo para reproducirse.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addVideo}
                className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-4 py-2 mt-2"
              >
                Añadir video
              </button>
            </div>
          </div>
          <div className="border-t border-neutral-700 mt-6 pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Ejercicios del curso</h3>
            <div className="space-y-4">
              {exercises.map(exercise => (
                <div key={exercise.id} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="text-md font-semibold text-white">{exercise.title ? exercise.title : 'Nuevo ejercicio'}</h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-3 py-1 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-neutral-400 uppercase">Título del ejercicio*</label>
                      <input
                        type="text"
                        value={exercise.title}
                        onChange={(e) => updateExercise(exercise.id, { title: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Título del ejercicio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-400 uppercase">Descripción</label>
                      <textarea
                        value={exercise.description}
                        onChange={(e) => updateExercise(exercise.id, { description: e.target.value })}
                        rows={3}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white/90 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe de qué trata este ejercicio"
                      />
                    </div>
                    {exercise.fileData && (
                      <div className="mt-2 bg-green-900 text-green-300 border border-green-700 rounded-lg px-3 py-2 text-sm">
                        ✓ PDF existente - Ya está subido y listo para descargar.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addExercise}
                className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-md px-4 py-2 mt-2"
              >
                Añadir ejercicio
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => router.push('/admin/cursos')}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center"
            >
              {isSubmitting ? 'Actualizando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 