'use client';

import { useState } from 'react';
import CourseViewer from './CourseViewer';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface LessonProps {
  name: string;
  videoId: string;
  playbackId: string;
  exerciseId: string;
  courseId: string;
  order: number;
}

export default function Lesson({ name, videoId, playbackId, exerciseId, courseId, order }: LessonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[var(--neutral-800)] rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Encabezado de la lección */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--neutral-700)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-[var(--accent)] font-semibold">Lección {order + 1}</span>
          <h3 className="text-[var(--neutral-100)] font-medium">{name}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <DocumentIcon className="w-5 h-5 text-[var(--neutral-400)]" />
          <svg 
            className={`w-5 h-5 text-[var(--neutral-400)] transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Video */}
          <div className="rounded-lg overflow-hidden">
            <CourseViewer
              playbackId={playbackId}
              videoId={videoId}
              courseId={courseId}
            />
          </div>

          {/* Ejercicio */}
          <div className="bg-[var(--neutral-900)] p-4 rounded-lg">
            <h4 className="text-[var(--neutral-100)] font-medium mb-3">Ejercicio</h4>
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-[var(--neutral-600)] rounded-lg">
              <a
                href={`/api/exercises/${exerciseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <DocumentIcon className="w-6 h-6" />
                <span>Descargar ejercicio</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 