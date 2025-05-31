'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from './Notification';

// Interfaces para los datos
interface CourseOption {
  _id: string;
  title: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export default function CreateFakeReviewButton({ onReviewCreated }: { onReviewCreated: () => void }) {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchCourse, setSearchCourse] = useState('');
  
  const { showNotification } = useNotifications();

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isModalOpen) {
      fetchData();
    }
  }, [isModalOpen]);

  // Función para obtener cursos y usuarios
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-fake-review');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
      const data = await response.json();
      setCourses(data.courses || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showNotification('Error al cargar datos. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios según la búsqueda
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchUser.toLowerCase()) || 
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Filtrar cursos según la búsqueda
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchCourse.toLowerCase())
  );

  // Crear reseña falsa
  const handleCreateFakeReview = async () => {
    if (!selectedUserId || !selectedCourseId || !comment.trim() || rating < 1 || rating > 5) {
      showNotification('Debes completar todos los campos correctamente', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/create-fake-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          courseId: selectedCourseId,
          rating,
          comment: comment.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reseña');
      }

      showNotification('Reseña falsa creada correctamente', 'success');
      
      // Cerrar modal y reiniciar valores
      setIsModalOpen(false);
      setSelectedUserId('');
      setSelectedCourseId('');
      setRating(5);
      setComment('');
      setSearchUser('');
      setSearchCourse('');
      
      // Llamar callback para refrescar la lista
      onReviewCreated();
    } catch (error) {
      console.error('Error al crear reseña falsa:', error);
      showNotification(error instanceof Error ? error.message : 'Error al crear reseña. Inténtalo de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        onClick={interactive ? () => setRating(index + 1) : undefined}
        className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
          index < currentRating ? 'text-yellow-400' : 'text-gray-400'
        }`}
        disabled={!interactive}
      >
        ★
      </button>
    ));
  };

  const selectedUser = users.find(user => user._id === selectedUserId);
  const selectedCourse = courses.find(course => course._id === selectedCourseId);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Crear Reseña
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
            <div className="p-6 border-b border-neutral-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Crear Reseña Falsa</h3>
                <button 
                  className="text-neutral-400 hover:text-white transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Selector de usuario */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Usuario (autor de la reseña)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-neutral-600 rounded-md shadow-sm bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Buscar usuario por nombre o email"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                    {searchUser && (
                      <div className="absolute z-10 mt-1 w-full bg-neutral-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-neutral-700">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-neutral-400">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-neutral-700 ${selectedUserId === user._id ? 'bg-neutral-700' : ''}`}
                              onClick={() => {
                                setSelectedUserId(user._id);
                                setSearchUser(`${user.name} (${user.email})`);
                              }}
                            >
                              <div className="flex items-center">
                                <span className="font-medium block truncate text-white">{user.name}</span>
                                <span className="text-neutral-400 ml-2 block truncate">{user.email}</span>
                              </div>
                              {user.role === 'admin' && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de curso */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Curso
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-neutral-600 rounded-md shadow-sm bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Buscar curso por título"
                      value={searchCourse}
                      onChange={(e) => setSearchCourse(e.target.value)}
                    />
                    {searchCourse && (
                      <div className="absolute z-10 mt-1 w-full bg-neutral-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-neutral-700">
                        {filteredCourses.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-neutral-400">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredCourses.map((course) => (
                            <div
                              key={course._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-neutral-700 ${selectedCourseId === course._id ? 'bg-neutral-700' : ''}`}
                              onClick={() => {
                                setSelectedCourseId(course._id);
                                setSearchCourse(course.title);
                              }}
                            >
                              <span className="font-medium block truncate text-white">{course.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de calificación */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Calificación
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderStars(rating, true)}
                    <span className="ml-3 text-neutral-400 text-sm">
                      {rating === 1 && 'Muy malo'}
                      {rating === 2 && 'Malo'}
                      {rating === 3 && 'Regular'}
                      {rating === 4 && 'Bueno'}
                      {rating === 5 && 'Excelente'}
                    </span>
                  </div>
                </div>

                {/* Comentario */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Comentario de la reseña
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe el comentario de la reseña falsa..."
                    className="w-full px-3 py-2 border border-neutral-600 rounded-md shadow-sm bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={4}
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    {comment.length} caracteres
                  </p>
                </div>

                {/* Vista previa */}
                {selectedUser && selectedCourse && comment && (
                  <div className="bg-neutral-700 rounded-lg p-4 border border-neutral-600">
                    <h4 className="text-sm font-medium text-white mb-2">Vista previa:</h4>
                    <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">{renderStars(rating)}</div>
                        <span className="text-neutral-400 text-xs">Ahora</span>
                      </div>
                      <div className="text-white font-medium mb-1">
                        {selectedUser.name} en <span className="text-blue-300">{selectedCourse.title}</span>
                      </div>
                      <div className="text-neutral-200">{comment}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="px-6 py-4 bg-neutral-700 flex justify-end space-x-3 border-t border-neutral-600">
              <button
                className="px-4 py-2 border border-neutral-600 rounded-md shadow-sm text-sm font-medium text-white bg-neutral-600 hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateFakeReview}
                disabled={submitting || !selectedUserId || !selectedCourseId || !comment.trim()}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </div>
                ) : (
                  'Crear Reseña'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 