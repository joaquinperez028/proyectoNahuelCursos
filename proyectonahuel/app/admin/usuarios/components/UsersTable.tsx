'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Tipo para los usuarios
interface UserCourse {
  id: string;
  title: string;
  price: number;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  purchaseDate: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  courses: UserCourse[];
  createdAt: string;
  [key: string]: any; // Para permitir indexación por string
}

export default function UsersTable() {
  // Estados del componente
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'name', 
    direction: 'asc' 
  });
  const [filter, setFilter] = useState<string>('all'); // 'all', 'admin', 'user'
  
  const usersPerPage = 10;
  
  // Cargar usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUsers(data.users || []);
        setError(null);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar usuarios');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Función para solicitar ordenación
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrar usuarios según término de búsqueda y filtro de rol
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'admin' && user.role === 'admin') || 
      (filter === 'user' && user.role === 'user');
    
    return matchesSearch && matchesFilter;
  });

  // Ordenar usuarios
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any = null;
    let bValue: any = null;
    
    if (sortConfig.key === 'courses') {
      aValue = a.courses.length;
      bValue = b.courses.length;
    } else if (sortConfig.key === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else {
      aValue = a[sortConfig.key as keyof User];
      bValue = b[sortConfig.key as keyof User];
    }
    
    if (aValue === null || bValue === null) return 0;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Cambiar página
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full bg-[var(--neutral-900)] rounded-lg shadow-xl overflow-hidden">
      {/* Cabecera y filtros */}
      <div className="px-6 py-4 border-b border-[var(--neutral-800)] flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-[var(--neutral-100)]">
          Usuarios de la plataforma
          {!loading && (
            <span className="ml-2 text-sm font-normal text-[var(--neutral-400)]">
              ({filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'})
            </span>
          )}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Filtro de rol */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm border border-r-0 rounded-l-md ${
                filter === 'all'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] border-[var(--neutral-700)] hover:bg-[var(--neutral-700)]'
              } transition-colors`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-3 py-2 text-sm border ${
                filter === 'admin'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] border-[var(--neutral-700)] hover:bg-[var(--neutral-700)]'
              } transition-colors`}
            >
              Administradores
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-3 py-2 text-sm border border-l-0 rounded-r-md ${
                filter === 'user'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] border-[var(--neutral-700)] hover:bg-[var(--neutral-700)]'
              } transition-colors`}
            >
              Alumnos
            </button>
          </div>
          
          {/* Buscador */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-[var(--neutral-800)] text-[var(--neutral-300)] pl-10 pr-4 py-2 rounded-lg border border-[var(--neutral-700)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--neutral-200)] mb-2">
            Error al cargar usuarios
          </h3>
          <p className="text-[var(--neutral-400)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de usuarios */}
      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--neutral-800)]">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)]"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Usuario</span>
                    {sortConfig.key === 'name' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortConfig.direction === 'asc' 
                          ? "M5 15l7-7 7 7" 
                          : "M19 9l-7 7-7-7"}>
                        </path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)]"
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Rol</span>
                    {sortConfig.key === 'role' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortConfig.direction === 'asc' 
                          ? "M5 15l7-7 7 7" 
                          : "M19 9l-7 7-7-7"}>
                        </path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)]"
                  onClick={() => requestSort('courses')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cursos</span>
                    {sortConfig.key === 'courses' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortConfig.direction === 'asc' 
                          ? "M5 15l7-7 7 7" 
                          : "M19 9l-7 7-7-7"}>
                        </path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)]"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Registrado</span>
                    {sortConfig.key === 'createdAt' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortConfig.direction === 'asc' 
                          ? "M5 15l7-7 7 7" 
                          : "M19 9l-7 7-7-7"}>
                        </path>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neutral-800)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-8 w-8 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-[var(--neutral-400)]">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--neutral-400)]">
                    <svg className="mx-auto h-12 w-12 text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p className="mt-2 text-[var(--neutral-400)]">
                      No se encontraron usuarios {searchTerm ? `para "${searchTerm}"` : ''}.
                    </p>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--neutral-800)] transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {user.image ? (
                            <Image 
                              src={user.image} 
                              alt={user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--neutral-900)] ${
                            user.isActive ? 'bg-green-500' : 'bg-gray-500'
                          }`}></span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[var(--neutral-200)]">{user.name}</div>
                          <div className="text-sm text-[var(--neutral-400)]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-900/30 text-purple-200' 
                          : 'bg-blue-900/30 text-blue-200'
                      }`}>
                        {user.role === 'admin' ? (
                          <svg className="mr-1.5 h-2 w-2 text-purple-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        ) : (
                          <svg className="mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        )}
                        {user.role === 'admin' ? 'Administrador' : 'Alumno'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative group">
                        {user.courses.length === 0 ? (
                          <span className="text-sm text-[var(--neutral-500)]">
                            Sin cursos
                          </span>
                        ) : (
                          <>
                            <div className="flex -space-x-2 overflow-hidden">
                              {user.courses.slice(0, 3).map((course, index) => (
                                <div 
                                  key={index}
                                  className="inline-block h-8 w-8 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-xs flex items-center justify-center text-white font-medium ring-2 ring-[var(--neutral-900)]"
                                  title={course.title}
                                >
                                  {course.title.charAt(0)}
                                </div>
                              ))}
                              {user.courses.length > 3 && (
                                <div className="inline-block h-8 w-8 rounded-full bg-[var(--neutral-700)] text-xs flex items-center justify-center text-white ring-2 ring-[var(--neutral-900)]">
                                  +{user.courses.length - 3}
                                </div>
                              )}
                            </div>
                            
                            {/* Tooltip con detalles de cursos */}
                            <div className="absolute z-10 w-64 px-4 py-3 right-0 mt-2 bg-[var(--neutral-800)] rounded-lg shadow-lg 
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                              <div className="text-sm font-medium text-[var(--neutral-200)] mb-2">
                                Cursos adquiridos:
                              </div>
                              <ul className="space-y-1">
                                {user.courses.map((course, index) => (
                                  <li key={index} className="text-xs text-[var(--neutral-400)] flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] mr-2"></span>
                                    <span>{course.title}</span>
                                    <span className="ml-auto text-[var(--neutral-500)]">
                                      {course.isCompleted ? (
                                        <span className="text-green-400">Completado</span>
                                      ) : (
                                        <span>{course.progress}%</span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-[var(--neutral-800)]"></div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-400)]">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                          title="Ver detalles"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        <button 
                          className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                          title="Editar usuario"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        {user.role !== 'admin' && (
                          <button 
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar usuario"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && totalPages > 1 && (
        <div className="px-6 py-4 bg-[var(--neutral-800)] border-t border-[var(--neutral-700)] flex items-center justify-between">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-[var(--neutral-700)] text-[var(--neutral-300)] disabled:opacity-50 hover:bg-[var(--neutral-600)] transition-colors"
          >
            Anterior
          </button>
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              // Mostrar los primeros 2, los últimos 2 y los cercanos a la página actual
              .filter(num => 
                num <= 2 || 
                num > totalPages - 2 || 
                (num >= currentPage - 1 && num <= currentPage + 1)
              )
              .map((number, index, array) => (
                <React.Fragment key={number}>
                  {index > 0 && array[index - 1] !== number - 1 && (
                    <span className="w-8 h-8 flex items-center justify-center text-[var(--neutral-500)]">...</span>
                  )}
                  <button
                    onClick={() => paginate(number)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                      currentPage === number 
                        ? 'bg-[var(--primary)] text-white' 
                        : 'bg-[var(--neutral-700)] text-[var(--neutral-300)] hover:bg-[var(--neutral-600)]'
                    }`}
                  >
                    {number}
                  </button>
                </React.Fragment>
              ))
            }
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-[var(--neutral-700)] text-[var(--neutral-300)] disabled:opacity-50 hover:bg-[var(--neutral-600)] transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
} 