'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Lesson {
  _id: string;
  name: string;
  videoId: string;
  exerciseId: string;
  courseId: string;
  order: number;
}

interface LessonManagerProps {
  courseId: string;
}

export default function LessonManager({ courseId }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    videoId: '',
    exerciseId: '',
    order: 0
  });

  // Cargar lecciones
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

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para crear/editar
  const openModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        name: lesson.name,
        videoId: lesson.videoId,
        exerciseId: lesson.exerciseId,
        order: lesson.order
      });
    } else {
      setEditingLesson(null);
      setFormData({
        name: '',
        videoId: '',
        exerciseId: '',
        order: lessons.length
      });
    }
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
    setFormData({
      name: '',
      videoId: '',
      exerciseId: '',
      order: 0
    });
  };

  // Guardar lección
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLesson 
        ? `/api/lessons?id=${editingLesson._id}`
        : '/api/lessons';
      
      const method = editingLesson ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          courseId
        }),
      });

      if (!response.ok) throw new Error('Error al guardar lección');
      
      await loadLessons();
      closeModal();
    } catch (err) {
      setError('Error al guardar lección');
      console.error(err);
    }
  };

  // Eliminar lección
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta lección?')) return;
    
    try {
      const response = await fetch(`/api/lessons?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar lección');
      
      await loadLessons();
    } catch (err) {
      setError('Error al eliminar lección');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[var(--neutral-100)]">
          Lecciones del Curso
        </h2>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nueva Lección</span>
        </button>
      </div>

      {/* Lista de lecciones */}
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <div
            key={lesson._id}
            className="bg-[var(--neutral-800)] rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="text-[var(--neutral-100)] font-medium">
                {lesson.name}
              </h3>
              <p className="text-sm text-[var(--neutral-400)]">
                Orden: {lesson.order + 1}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openModal(lesson)}
                className="p-2 text-[var(--neutral-400)] hover:text-[var(--accent)] transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(lesson._id)}
                className="p-2 text-[var(--neutral-400)] hover:text-[var(--error)] transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[var(--neutral-800)] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">
              {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-300)] mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[var(--neutral-900)] border border-[var(--neutral-700)] rounded-lg text-[var(--neutral-100)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-300)] mb-1">
                  ID del Video
                </label>
                <input
                  type="text"
                  name="videoId"
                  value={formData.videoId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[var(--neutral-900)] border border-[var(--neutral-700)] rounded-lg text-[var(--neutral-100)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-300)] mb-1">
                  ID del Ejercicio
                </label>
                <input
                  type="text"
                  name="exerciseId"
                  value={formData.exerciseId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[var(--neutral-900)] border border-[var(--neutral-700)] rounded-lg text-[var(--neutral-100)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-300)] mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[var(--neutral-900)] border border-[var(--neutral-700)] rounded-lg text-[var(--neutral-100)]"
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-[var(--neutral-300)] hover:text-[var(--neutral-100)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  {editingLesson ? 'Guardar Cambios' : 'Crear Lección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-[var(--error)] text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
} 