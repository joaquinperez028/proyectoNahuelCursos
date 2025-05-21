'use client';

import { useState, useEffect } from 'react';
import Lesson from './Lesson';

interface LessonData {
  _id: string;
  name: string;
  videoId: string;
  exerciseId: string;
  courseId: string;
  order: number;
}

interface LessonListProps {
  courseId: string;
}

export default function LessonList({ courseId }: LessonListProps) {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLessons = async () => {
      try {
        const response = await fetch(`/api/lessons?courseId=${courseId}`);
        if (!response.ok) throw new Error('Error al cargar lecciones');
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        setError('Error al cargar lecciones');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLessons();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-[var(--error)]">{error}</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-[var(--neutral-400)]">No hay lecciones disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lessons.map((lesson) => (
        <Lesson
          key={lesson._id}
          name={lesson.name}
          videoId={lesson.videoId}
          playbackId={lesson.videoId} // Asumiendo que el videoId es el playbackId
          exerciseId={lesson.exerciseId}
          courseId={lesson.courseId}
          order={lesson.order}
        />
      ))}
    </div>
  );
} 