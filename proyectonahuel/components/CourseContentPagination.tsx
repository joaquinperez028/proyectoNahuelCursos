'use client';

import { useState, useEffect } from 'react';
import CourseViewer from './CourseViewer';

interface VideoType {
  _id: string;
  title: string;
  description: string;
  videoId: string;
  playbackId: string;
  order: number;
  duration?: number;
}

interface ExerciseType {
  _id: string;
  title: string;
  description: string;
  fileData: {
    data: string;
    contentType: string;
  };
  order: number;
}

interface ItemType {
  _id: string;
  title: string;
  description: string;
  order: number;
  tipo: 'video' | 'ejercicio';
  videoId?: string;
  playbackId?: string;
}

interface VideoProgressType {
  videoId: string;
  completed: boolean;
  watchedSeconds: number;
  lastPosition: number;
}

interface CourseProgressType {
  totalProgress: number;
  isCompleted: boolean;
  videoProgress: VideoProgressType[];
}

interface CourseContentPaginationProps {
  items: ItemType[];
  courseId: string;
  videoTokens: { [key: string]: string };
  userHasCourse: boolean;
  itemsPerPage?: number;
}

export default function CourseContentPagination({ 
  items, 
  courseId, 
  videoTokens, 
  userHasCourse,
  itemsPerPage = 10 
}: CourseContentPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [courseProgress, setCourseProgress] = useState<CourseProgressType | null>(null);

  useEffect(() => {
    if (userHasCourse && courseId) {
      fetchCourseProgress();
    }
  }, [courseId, userHasCourse]);

  const fetchCourseProgress = async () => {
    try {
      const response = await fetch(`/api/progress/check?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.progress) {
          setCourseProgress(data.progress);
        }
      }
    } catch (error) {
      console.error('Error al cargar progreso del curso:', error);
    }
  };

  const isVideoCompleted = (videoId: string): boolean => {
    if (!courseProgress?.videoProgress) return false;
    const videoProgress = courseProgress.videoProgress.find(vp => vp.videoId === videoId);
    return videoProgress?.completed || false;
  };

  const getVideoProgress = (videoId: string): number => {
    if (!courseProgress?.videoProgress) return 0;
    const videoProgress = courseProgress.videoProgress.find(vp => vp.videoId === videoId);
    return videoProgress?.watchedSeconds || 0;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll hacia arriba cuando cambie de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <section>
      <hr className="border-[var(--border)] my-8" />
      <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-4">Contenido del curso</h2>
      <div className="space-y-4">
        {paginatedItems.map((item, index) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + index;
          const isCompleted = item.tipo === 'video' && item.videoId ? isVideoCompleted(item.videoId) : false;
          
          return (
            <div key={item._id} className={`border rounded-xl p-4 bg-[var(--card)] transition-all duration-300 hover:border-[var(--primary)] hover:shadow-lg ${
              isCompleted ? 'border-green-500/30' : 'border-[var(--border)]'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full ${item.tipo === 'video' ? 'bg-[var(--primary-dark)]' : 'bg-[var(--secondary-dark)]'} text-[var(--neutral-100)] flex items-center justify-center font-medium mr-3 flex-shrink-0 relative`}>
                    {globalIndex + 1}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-[var(--neutral-100)]">
                        {item.tipo === 'video' ? `Video: ${item.title}` : `Ejercicio: ${item.title}`}
                      </h3>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completado
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[var(--neutral-400)] mt-1 text-sm">{item.description}</p>
                    )}
                  </div>
                </div>
                {/* Botón de descarga solo para ejercicios */}
                {item.tipo === 'ejercicio' && userHasCourse && (
                  <a 
                    href={`/api/course-exercise?id=${item._id}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-[var(--neutral-100)] bg-[var(--secondary)] hover:bg-[var(--secondary-dark)] transition-colors duration-300 shadow-sm"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar PDF
                  </a>
                )}
              </div>
              {/* Render de video o mensaje de ejercicio */}
              {item.tipo === 'video' ? (
                <div className="mt-4">
                  <CourseViewer 
                    playbackId={item.playbackId || ''} 
                    videoId={item.videoId || ''}
                    courseId={courseId}
                    token={videoTokens[item.playbackId || ''] || ''} 
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Controles de paginación */}
      {items.length > itemsPerPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-sm text-[var(--neutral-400)]">
            <span>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, items.length)} de {items.length} elementos
            </span>
            {courseProgress && (
              <span className="ml-4 text-[var(--primary)]">
                • Progreso total: {Math.round(courseProgress.totalProgress)}%
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botón anterior */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-[var(--neutral-800)] text-[var(--neutral-500)] cursor-not-allowed'
                  : 'bg-[var(--neutral-700)] text-[var(--neutral-200)] hover:bg-[var(--primary)] hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Números de página - Solo mostrar algunos para evitar overflow */}
            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              // Ajustar startPage si estamos cerca del final
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              const pages = [];
              
              // Primera página si no está visible
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-[var(--neutral-700)] text-[var(--neutral-200)] hover:bg-[var(--primary)] hover:text-white"
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="dots1" className="px-2 text-[var(--neutral-400)]">...</span>);
                }
              }
              
              // Páginas visibles
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === i
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--neutral-700)] text-[var(--neutral-200)] hover:bg-[var(--primary)] hover:text-white'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              
              // Última página si no está visible
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="dots2" className="px-2 text-[var(--neutral-400)]">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-[var(--neutral-700)] text-[var(--neutral-200)] hover:bg-[var(--primary)] hover:text-white"
                  >
                    {totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}
            
            {/* Botón siguiente */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-[var(--neutral-800)] text-[var(--neutral-500)] cursor-not-allowed'
                  : 'bg-[var(--neutral-700)] text-[var(--neutral-200)] hover:bg-[var(--primary)] hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Información adicional */}
      {items.length > itemsPerPage && (
        <div className="mt-4 text-center">
          <p className="text-sm text-[var(--neutral-400)]">
            Página {currentPage} de {totalPages} • {items.length} elementos en total
            {courseProgress && courseProgress.isCompleted && (
              <span className="ml-2 text-green-500 font-medium">🎉 Curso completado</span>
            )}
          </p>
        </div>
      )}
    </section>
  );
} 