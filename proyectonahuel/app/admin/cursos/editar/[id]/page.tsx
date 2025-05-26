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
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar curso</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">Curso actualizado correctamente. Redirigiendo...</p>
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
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Precio del curso"
            />
            <p className="mt-1 text-sm text-gray-500">Establecer a 0 para cursos gratuitos</p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700">
                Destacar curso en la página principal
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-6">
              Los cursos destacados aparecerán en secciones especiales para mayor visibilidad
            </p>
          </div>
          
          {/* Sección de ofertas */}
          <div className="border rounded-lg p-6 mb-8 bg-white shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de oferta</h3>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onSale"
                  checked={onSale}
                  onChange={(e) => setOnSale(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="onSale" className="ml-2 block text-sm font-medium text-gray-700">
                  Activar oferta para este curso
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                Los cursos en oferta mostrarán el precio original y el precio con descuento
              </p>
            </div>
            
            {onSale && (
              <div className="mt-4">
                <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de descuento
                </label>
                <div className="flex items-center">
                  <select
                    id="discountPercentage"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="rounded-md border border-gray-300 py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                  </select>
                  
                  {price > 0 && (
                    <div className="ml-4 p-2 bg-green-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        Precio original: <span className="font-medium">${price}</span>
                      </p>
                      <p className="text-sm text-green-700">
                        Precio con descuento: <span className="font-medium">${(price - (price * (discountPercentage / 100))).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Sección de videos */}
          <div className="border rounded-lg p-6 mb-8 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Videos del curso</h3>
              <button
                type="button"
                onClick={addVideo}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Añadir video
              </button>
            </div>
            
            {videos.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500">
                  No hay videos añadidos. Haz clic en "Añadir video" para comenzar.
                </p>
              </div>
            ) : (
              <div>
                {/* Pestañas de videos */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-2 overflow-x-auto">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => setActiveVideoTab(video.id)}
                        className={`py-2 px-3 border-b-2 whitespace-nowrap ${
                          activeVideoTab === video.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                      <h4 className="text-md font-medium text-gray-900">
                        {video.title ? video.title : 'Nuevo video'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeVideo(video.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Título del video */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título del video*
                        </label>
                        <input
                          type="text"
                          value={video.title}
                          onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Título del video"
                        />
                      </div>
                      
                      {/* Descripción del video */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={video.description}
                          onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe de qué trata este video"
                        />
                      </div>
                      
                      {/* Estado del video */}
                      {video.playbackId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">
                            <span className="font-medium">✓ Video existente</span> - Ya está subido y listo para reproducirse.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sección de ejercicios */}
          <div className="border rounded-lg p-6 mb-8 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ejercicios del curso</h3>
              <button
                type="button"
                onClick={addExercise}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Añadir ejercicio
              </button>
            </div>
            
            {exercises.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500">
                  No hay ejercicios añadidos. Haz clic en "Añadir ejercicio" para comenzar.
                </p>
              </div>
            ) : (
              <div>
                {/* Pestañas de ejercicios */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-2 overflow-x-auto">
                    {exercises.map((exercise, index) => (
                      <button
                        key={exercise.id}
                        onClick={() => setActiveExerciseTab(exercise.id)}
                        className={`py-2 px-3 border-b-2 whitespace-nowrap ${
                          activeExerciseTab === exercise.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                      <h4 className="text-md font-medium text-gray-900">
                        {exercise.title ? exercise.title : 'Nuevo ejercicio'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Título del ejercicio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título del ejercicio*
                        </label>
                        <input
                          type="text"
                          value={exercise.title}
                          onChange={(e) => updateExercise(exercise.id, { title: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Título del ejercicio"
                        />
                      </div>
                      
                      {/* Descripción del ejercicio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={exercise.description}
                          onChange={(e) => updateExercise(exercise.id, { description: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe de qué trata este ejercicio"
                        />
                      </div>
                      
                      {/* Estado del PDF */}
                      {exercise.fileData && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">
                            <span className="font-medium">✓ PDF existente</span> - Ya está subido y listo para descargar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Orden de aparición en el curso</h3>
            <p className="text-sm text-gray-500 mb-4">Arrastrá para reordenar/intercalar videos y ejercicios. Así se verá el curso para los alumnos.</p>
            <ul>
              {courseItems.map((item, idx) => {
                let label = '';
                if (item.type === 'video') {
                  const v = videos.find(v => v.id === item.id);
                  label = `Video ${idx + 1}: ${v?.title || ''}`;
                } else {
                  const ex = exercises.find(e => e.id === item.id);
                  label = `Ejercicio ${idx + 1}: ${ex?.title || ''}`;
                }
                return (
                  <li
                    key={item.type + '-' + item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className="mb-2 p-3 bg-gray-100 border border-gray-300 rounded-md cursor-move flex items-center gap-2"
                  >
                    <span className="font-semibold">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/cursos"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 