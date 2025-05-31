'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from './Notification';

// Interfaces para los datos
interface PackOption {
  _id: string;
  name: string;
  price: number;
  courses: { _id: string; title: string }[];
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export default function AssignPackButton() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [createPaymentRecord, setCreatePaymentRecord] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchPack, setSearchPack] = useState('');
  
  const { showNotification } = useNotifications();

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isModalOpen) {
      fetchData();
    }
  }, [isModalOpen]);

  // Función para obtener packs y usuarios
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/assign-pack-access');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
      const data = await response.json();
      setPacks(data.packs || []);
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

  // Filtrar packs según la búsqueda
  const filteredPacks = packs.filter(pack => 
    pack.name.toLowerCase().includes(searchPack.toLowerCase())
  );

  // Asignar pack al usuario
  const handleAssignPack = async () => {
    if (!selectedUserId || !selectedPackId) {
      showNotification('Debes seleccionar un usuario y un pack', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/assign-pack-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          packId: selectedPackId,
          createPaymentRecord
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar pack');
      }

      if (data.alreadyHasAccess) {
        showNotification('El usuario ya tiene acceso a algunos cursos de este pack', 'info');
      } else {
        showNotification('Pack asignado correctamente', 'success');
      }
      
      // Cerrar modal y reiniciar valores
      setIsModalOpen(false);
      setSelectedUserId('');
      setSelectedPackId('');
      setSearchUser('');
      setSearchPack('');
    } catch (error) {
      console.error('Error al asignar pack:', error);
      showNotification('Error al asignar pack. Inténtalo de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPack = packs.find(pack => pack._id === selectedPackId);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Asignar Pack
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--neutral-100)]">Asignar Pack a Usuario</h3>
                <button 
                  className="text-[var(--neutral-400)] hover:text-[var(--neutral-100)] transition-colors"
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Selector de usuario */}
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                    Usuario
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-md shadow-sm bg-[var(--neutral-800)] text-[var(--neutral-100)] placeholder-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Buscar usuario por nombre o email"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                    {searchUser && (
                      <div className="absolute z-10 mt-1 w-full bg-[var(--card)] shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-[var(--border)]">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-[var(--neutral-400)]">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[var(--neutral-700)] ${selectedUserId === user._id ? 'bg-[var(--neutral-700)]' : ''}`}
                              onClick={() => {
                                setSelectedUserId(user._id);
                                setSearchUser(`${user.name} (${user.email})`);
                              }}
                            >
                              <div className="flex items-center">
                                <span className="font-medium block truncate text-[var(--neutral-100)]">{user.name}</span>
                                <span className="text-[var(--neutral-400)] ml-2 block truncate">{user.email}</span>
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

                {/* Selector de pack */}
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-100)] mb-1">
                    Pack
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-md shadow-sm bg-[var(--neutral-800)] text-[var(--neutral-100)] placeholder-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Buscar pack por nombre"
                      value={searchPack}
                      onChange={(e) => setSearchPack(e.target.value)}
                    />
                    {searchPack && (
                      <div className="absolute z-10 mt-1 w-full bg-[var(--card)] shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-[var(--border)]">
                        {filteredPacks.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-[var(--neutral-400)]">
                            No se encontraron resultados
                          </div>
                        ) : (
                          filteredPacks.map((pack) => (
                            <div
                              key={pack._id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[var(--neutral-700)] ${selectedPackId === pack._id ? 'bg-[var(--neutral-700)]' : ''}`}
                              onClick={() => {
                                setSelectedPackId(pack._id);
                                setSearchPack(pack.name);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium block truncate text-[var(--neutral-100)]">{pack.name}</span>
                                  <span className="text-xs text-[var(--neutral-400)]">
                                    {pack.courses.length} curso{pack.courses.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-[var(--neutral-400)] ml-2 block truncate">
                                  ${(pack.price / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalle del pack seleccionado */}
                {selectedPack && (
                  <div className="bg-[var(--neutral-800)] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[var(--neutral-100)] mb-2">Cursos incluidos en el pack:</h4>
                    <ul className="space-y-1">
                      {selectedPack.courses.map((course) => (
                        <li key={course._id} className="text-sm text-[var(--neutral-300)] flex items-center">
                          <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {course.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opción para crear registro de pago */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="createPayment"
                      name="createPayment"
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 border-[var(--border)] rounded focus:ring-purple-500 bg-[var(--neutral-800)]"
                      checked={createPaymentRecord}
                      onChange={(e) => setCreatePaymentRecord(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="createPayment" className="font-medium text-[var(--neutral-100)]">
                      Crear registro de pago
                    </label>
                    <p className="text-[var(--neutral-400)]">
                      Crea un registro de pago administrativo para este acceso al pack
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 bg-[var(--neutral-800)] flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium text-[var(--neutral-100)] bg-[var(--neutral-700)] hover:bg-[var(--neutral-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAssignPack}
                disabled={submitting || !selectedUserId || !selectedPackId}
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
                  'Asignar Pack'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 