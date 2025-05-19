'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface TransferPayment {
  _id: string;
  userId: string;
  courseId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  transactionId: string;
  paymentDetails: {
    receiptUrl: string;
    publicId: string;
    approvalStatus: string;
  };
  userName: string;
  userEmail: string;
  courseTitle: string;
  createdAt: string;
}

export default function TransferPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<TransferPayment[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0
  });
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<TransferPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'receipt' | 'reject' | 'confirm'>('receipt');

  // Redireccionar si no es administrador
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/perfil');
    }
  }, [status, session, router]);

  // Cargar pagos por transferencia
  useEffect(() => {
    const fetchTransferPayments = async () => {
      if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
      
      setLoading(true);
      
      try {
        const params = new URLSearchParams();
        params.append('status', selectedStatus);
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
        
        const response = await fetch(`/api/admin/transfer-payments?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.status}`);
        }
        
        const data = await response.json();
        
        setPayments(data.payments || []);
        setPagination(data.pagination || pagination);
        
      } catch (error) {
        console.error('Error al cargar pagos por transferencia:', error);
        alert('Error al cargar datos de pagos por transferencia');
      } finally {
        setLoading(false);
      }
    };

    fetchTransferPayments();
  }, [status, session, selectedStatus, pagination.page, pagination.limit]);

  // Cambiar filtro de estado
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Abrir modal para ver comprobante
  const handleViewReceipt = (payment: TransferPayment) => {
    setSelectedPayment(payment);
    setPreviewImage(payment.paymentDetails.receiptUrl);
    setModalType('receipt');
    setShowModal(true);
  };

  // Abrir modal de confirmación para aprobar
  const handleApproveConfirm = (payment: TransferPayment) => {
    setSelectedPayment(payment);
    setModalType('confirm');
    setShowModal(true);
  };

  // Abrir modal de rechazo
  const handleRejectClick = (payment: TransferPayment) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setModalType('reject');
    setShowModal(true);
  };

  // Procesar aprobación
  const handleApprove = async () => {
    if (!selectedPayment) return;
    
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/admin/transfer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPayment._id,
          action: 'approve'
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aprobar el pago');
      }
      
      // Actualizar la lista sin necesidad de recargar
      setPayments(payments.filter(p => p._id !== selectedPayment._id));
      setShowModal(false);
      
      // Mostrar mensaje de éxito
      alert('Pago aprobado correctamente');
      
    } catch (error) {
      console.error('Error al aprobar pago:', error);
      alert('Error al aprobar el pago');
    } finally {
      setActionLoading(false);
    }
  };

  // Procesar rechazo
  const handleReject = async () => {
    if (!selectedPayment) return;
    
    if (!rejectionReason.trim()) {
      alert('Por favor, ingresa un motivo de rechazo');
      return;
    }
    
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/admin/transfer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPayment._id,
          action: 'reject',
          rejectionReason
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al rechazar el pago');
      }
      
      // Actualizar la lista sin necesidad de recargar
      setPayments(payments.filter(p => p._id !== selectedPayment._id));
      setShowModal(false);
      
      // Mostrar mensaje de éxito
      alert('Pago rechazado correctamente');
      
    } catch (error) {
      console.error('Error al rechazar pago:', error);
      alert('Error al rechazar el pago');
    } finally {
      setActionLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formatear monto
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--neutral-800)]">Gestión de Pagos por Transferencia</h1>
          <p className="mt-2 text-[var(--neutral-600)]">
            Administra las solicitudes de pago por transferencia bancaria
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedStatus === 'pending'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white text-[var(--neutral-700)] border border-[var(--neutral-200)]'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => handleStatusChange('approved')}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedStatus === 'approved'
                ? 'bg-[var(--success)] text-white'
                : 'bg-white text-[var(--neutral-700)] border border-[var(--neutral-200)]'
            }`}
          >
            Aprobados
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedStatus === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-white text-[var(--neutral-700)] border border-[var(--neutral-200)]'
            }`}
          >
            Rechazados
          </button>
        </div>

        {/* Lista de pagos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--neutral-500)]">
                No hay pagos {selectedStatus === 'pending' ? 'pendientes' : selectedStatus === 'approved' ? 'aprobados' : 'rechazados'} por transferencia
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--neutral-200)]">
                <thead className="bg-[var(--neutral-100)]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Curso
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[var(--neutral-200)]">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-[var(--neutral-50)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[var(--neutral-900)]">{payment.userName}</div>
                        <div className="text-sm text-[var(--neutral-500)]">{payment.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[var(--neutral-900)]">{payment.courseTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[var(--neutral-900)]">{formatAmount(payment.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[var(--neutral-500)]">{formatDate(payment.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${
                          payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payment.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'pending' ? 'Pendiente' : payment.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewReceipt(payment)}
                          className="text-[var(--primary)] hover:text-[var(--primary-dark)] mr-4"
                        >
                          Ver comprobante
                        </button>
                        
                        {selectedStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveConfirm(payment)}
                              className="text-[var(--success)] hover:text-[var(--success-dark)] mr-4"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectClick(payment)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && payments.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-[var(--neutral-200)] sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-[var(--neutral-300)] text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? 'bg-[var(--neutral-100)] text-[var(--neutral-400)]'
                      : 'bg-white text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-[var(--neutral-300)] text-sm font-medium rounded-md ${
                    pagination.page === pagination.totalPages
                      ? 'bg-[var(--neutral-100)] text-[var(--neutral-400)]'
                      : 'bg-white text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]'
                  }`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-700)]">
                    Mostrando <span className="font-medium">{payments.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de <span className="font-medium">{pagination.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-[var(--neutral-300)] bg-white text-sm font-medium ${
                        pagination.page === 1
                          ? 'text-[var(--neutral-400)] cursor-not-allowed'
                          : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-50)]'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* Números de página */}
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === i + 1
                            ? 'z-10 bg-[var(--primary)] border-[var(--primary)] text-white'
                            : 'bg-white border-[var(--neutral-300)] text-[var(--neutral-500)] hover:bg-[var(--neutral-50)]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-[var(--neutral-300)] bg-white text-sm font-medium ${
                        pagination.page === pagination.totalPages
                          ? 'text-[var(--neutral-400)] cursor-not-allowed'
                          : 'text-[var(--neutral-500)] hover:bg-[var(--neutral-50)]'
                      }`}
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para ver comprobante, aprobar o rechazar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[var(--neutral-500)] hover:text-[var(--neutral-800)]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {modalType === 'receipt' && previewImage && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--neutral-800)]">Comprobante de Pago</h3>
                <div className="relative w-full h-96">
                  <Image
                    src={previewImage}
                    alt="Comprobante de pago"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-[var(--neutral-200)] hover:bg-[var(--neutral-300)] text-[var(--neutral-800)] py-2 px-4 rounded-lg font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {modalType === 'confirm' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--neutral-800)]">Confirmar Aprobación</h3>
                <p className="text-[var(--neutral-600)]">
                  ¿Estás seguro de que deseas aprobar el pago por transferencia para el curso <strong>{selectedPayment?.courseTitle}</strong>?
                </p>
                <p className="text-[var(--neutral-600)]">
                  Al aprobar, el usuario <strong>{selectedPayment?.userName}</strong> tendrá acceso inmediato al curso.
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-[var(--neutral-200)] hover:bg-[var(--neutral-300)] text-[var(--neutral-800)] py-2 px-4 rounded-lg font-medium"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApprove}
                    className="bg-[var(--success)] hover:bg-[var(--success-dark)] text-white py-2 px-4 rounded-lg font-medium flex items-center"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : 'Aprobar Pago'}
                  </button>
                </div>
              </div>
            )}

            {modalType === 'reject' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--neutral-800)]">Rechazar Pago</h3>
                <p className="text-[var(--neutral-600)]">
                  Por favor, indica el motivo por el cual rechazas este pago para el curso <strong>{selectedPayment?.courseTitle}</strong>.
                </p>
                <p className="text-[var(--neutral-600)]">
                  Esta información será enviada al usuario <strong>{selectedPayment?.userName}</strong>.
                </p>
                <div className="mt-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-[var(--neutral-700)]">
                    Motivo del rechazo
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={3}
                    className="mt-1 block w-full border border-[var(--neutral-300)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                    placeholder="Ej: No se puede verificar el pago, la transferencia no coincide con el monto, etc."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-[var(--neutral-200)] hover:bg-[var(--neutral-300)] text-[var(--neutral-800)] py-2 px-4 rounded-lg font-medium"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center"
                    disabled={actionLoading || !rejectionReason.trim()}
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : 'Rechazar Pago'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 