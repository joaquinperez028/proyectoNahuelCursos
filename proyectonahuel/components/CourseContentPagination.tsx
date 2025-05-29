'use client';

import { useState } from 'react';
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
          return (
            <div key={item._id} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] transition-all duration-300 hover:border-[var(--primary)] hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full ${item.tipo === 'video' ? 'bg-[var(--primary-dark)]' : 'bg-[var(--secondary-dark)]'} text-[var(--neutral-100)] flex items-center justify-center font-medium mr-3 flex-shrink-0`}>
                    {globalIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--neutral-100)]">
                      {item.tipo === 'video' ? `Video: ${item.title}` : `Ejercicio: ${item.title}`}
                    </h3>
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
          </p>
        </div>
      )}
    </section>
  );
} 