'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from './Notification';

// Interfaces para los datos
interface CourseOption {
  _id: string;
  title: string;
  price: number;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export default function AssignCourseButton() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [createPaymentRecord, setCreatePaymentRecord] = useState(true);
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
      const response = await fetch('/api/admin/assign-course-access');
      
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

  // Asignar curso al usuario
  const handleAssignCourse = async () => {
    if (!selectedUserId || !selectedCourseId) {
      showNotification('Debes seleccionar un usuario y un curso', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/assign-course-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          courseId: selectedCourseId,
          createPaymentRecord
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar curso');
      }

      if (data.alreadyHasAccess) {
        showNotification('El usuario ya tiene acceso a este curso', 'info');
      } else {
        showNotification('Curso asignado correctamente', 'success');
      }
      
      // Cerrar modal y reiniciar valores
      setIsModalOpen(false);
      setSelectedUserId('');
      setSelectedCourseId('');
      setSearchUser('');
      setSearchCourse('');
    } catch (error) {
      console.error('Error al asignar curso:', error);
      showNotification('Error al asignar curso. Inténtalo de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Asignar Curso
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Asignar Curso a Usuario</h3>
                <button 
                  className="text-gray-400 hover:text-gray-500"
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Selector de usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar usuario por nombre o email"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                    {searchUser && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${selectedUserId === user._id ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                setSelectedUserId(user._id);
                                setSearchUser(`${user.name} (${user.email})`);
                              }}
                            >
                              <div className="flex items-center">
                                <span className="font-medium block truncate">{user.name}</span>
                                <span className="text-gray-500 ml-2 block truncate">{user.email}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curso
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar curso por título"
                      value={searchCourse}
                      onChange={(e) => setSearchCourse(e.target.value)}
                    />
                    {searchCourse && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                        {filteredCourses.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredCourses.map((course) => (
                            <div
                              key={course._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${selectedCourseId === course._id ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                setSelectedCourseId(course._id);
                                setSearchCourse(course.title);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium block truncate">{course.title}</span>
                                <span className="text-gray-500 ml-2 block truncate">
                                  ${course.price ? course.price.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Opción para crear registro de pago */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="createPayment"
                      name="createPayment"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={createPaymentRecord}
                      onChange={(e) => setCreatePaymentRecord(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="createPayment" className="font-medium text-gray-700">
                      Crear registro de pago
                    </label>
                    <p className="text-gray-500">
                      Crea un registro de pago administrativo para este acceso al curso
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                onClick={handleAssignCourse}
                disabled={submitting || !selectedUserId || !selectedCourseId}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Asignando...
                  </div>
                ) : (
                  'Asignar Curso'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 