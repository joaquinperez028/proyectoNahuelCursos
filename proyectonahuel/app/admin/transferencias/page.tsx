'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useNotifications } from '@/components/Notification';
import FixCourseAccessButton from '@/components/FixCourseAccessButton';

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
    receiptData?: string;  // Dato base64 del comprobante
    fileType?: string;     // Tipo MIME del archivo
    fileName?: string;     // Nombre del archivo
    fileSize?: number;     // Tamaño del archivo
    uploadDate?: string;   // Fecha de subida
    receiptUrl?: string;   // Campo legacy para compatibilidad
    publicId?: string;     // Campo legacy para compatibilidad
    approvalStatus: string;
  };
  userName: string;
  userEmail: string;
  courseTitle: string;
  createdAt: string;
}

// Tipos de notificación
type NotificationType = 'success' | 'error' | 'info';

// Interfaz para la notificación
interface Notification {
  message: string;
  type: NotificationType;
  id: number;
}

export default function TransferPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showNotification } = useNotifications();
  
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
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
        showNotification('Error al cargar datos de pagos por transferencia', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTransferPayments();
  }, [status, session, selectedStatus, pagination.page, pagination.limit, showNotification]);

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
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      // Si el pago tiene datos en el nuevo formato (base64), usarlos
      if (payment.paymentDetails.receiptData) {
        // Validar que los datos base64 sean válidos
        if (payment.paymentDetails.receiptData.length > 0) {
          // Comprobar si los datos son demasiado grandes (más de 10MB)
          if (payment.paymentDetails.receiptData.length > 14000000) { // ~10MB en base64
            // En lugar de fallar, mostrar una versión reducida o un mensaje
            setPreviewImage(null);
            setPreviewError('El comprobante es demasiado grande para visualizarse. Puede descargar el archivo para verlo.');
          } else {
            // Asegurarnos de que el tipo de archivo es válido
            const fileType = payment.paymentDetails.fileType || 'image/jpeg';
            setPreviewImage(`data:${fileType};base64,${payment.paymentDetails.receiptData}`);
          }
        } else {
          setPreviewImage(null);
          setPreviewError('Los datos del comprobante están dañados');
        }
      } 
      // Si no, usar la URL de Cloudinary (para pagos anteriores)
      else if (payment.paymentDetails.receiptUrl) {
        setPreviewImage(payment.paymentDetails.receiptUrl);
      } else {
        // Si no hay imagen, mostrar un mensaje
        setPreviewImage(null);
        setPreviewError('No se encontró ningún comprobante adjunto');
      }
    } catch (error) {
      console.error('Error al procesar el comprobante:', error);
      setPreviewError('Error al procesar el comprobante');
      setPreviewImage(null);
    } finally {
      setPreviewLoading(false);
    }
    
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
      
      // Mostrar mensaje de éxito con el hook global
      showNotification('Pago aprobado correctamente', 'success');
      
    } catch (error) {
      console.error('Error al aprobar pago:', error);
      showNotification('Error al aprobar el pago', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Procesar rechazo
  const handleReject = async () => {
    if (!selectedPayment) return;
    
    if (!rejectionReason.trim()) {
      showNotification('Por favor, ingresa un motivo de rechazo', 'error');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      showNotification('El motivo de rechazo debe tener al menos 10 caracteres', 'error');
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
          rejectionReason: rejectionReason.trim()
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al rechazar el pago');
      }
      
      // Actualizar la lista sin necesidad de recargar
      setPayments(payments.filter(p => p._id !== selectedPayment._id));
      setShowModal(false);
      setRejectionReason(''); // Limpiar la razón
      
      // Mostrar mensaje de éxito con el hook global
      showNotification('Pago rechazado correctamente', 'success');
      
    } catch (error) {
      console.error('Error al rechazar pago:', error);
      showNotification('Error al rechazar el pago', 'error');
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
    <div className="min-h-screen bg-[#1E1E2F] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Gestión de Pagos por Transferencia</h1>
          <p className="mt-2 text-[#B4B4C0]">
            Administra las solicitudes de pago por transferencia bancaria
          </p>
        </div>

        {/* Herramienta de corrección de acceso */}
        <FixCourseAccessButton />
        
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              selectedStatus === 'pending'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] hover:bg-[#3A3A4C]'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => handleStatusChange('approved')}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              selectedStatus === 'approved'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] hover:bg-[#3A3A4C]'
            }`}
          >
            Aprobados
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              selectedStatus === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-[#2A2A3C] text-[#B4B4C0] border border-[#3A3A4C] hover:bg-[#3A3A4C]'
            }`}
          >
            Rechazados
          </button>
        </div>

        {/* Lista de pagos */}
        <div className="bg-[#2A2A3C] rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#4CAF50] border-t-transparent rounded-full"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#B4B4C0]">
                No hay pagos {selectedStatus === 'pending' ? 'pendientes' : selectedStatus === 'approved' ? 'aprobados' : 'rechazados'} por transferencia
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#3A3A4C]">
                <thead className="bg-[#1E1E2F]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Producto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#8A8A9A] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#2A2A3C] divide-y divide-[#3A3A4C]">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-[#3A3A4C] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{payment.userName}</div>
                        <div className="text-sm text-[#B4B4C0]">{payment.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{payment.courseTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{formatAmount(payment.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#B4B4C0]">{formatDate(payment.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${
                          payment.status === 'pending'
                            ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                            : payment.status === 'approved'
                            ? 'bg-green-500 bg-opacity-20 text-green-400'
                            : 'bg-red-500 bg-opacity-20 text-red-400'
                        }`}>
                          {payment.status === 'pending' ? 'Pendiente' : payment.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewReceipt(payment)}
                          className="text-[#4CAF50] hover:text-[#45a049] mr-4"
                        >
                          Ver comprobante
                        </button>
                        
                        {selectedStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveConfirm(payment)}
                              className="text-[#4CAF50] hover:text-[#45a049] mr-4"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectClick(payment)}
                              className="text-red-500 hover:text-red-600"
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
            <div className="bg-[#2A2A3C] px-4 py-3 flex items-center justify-between border-t border-[#3A3A4C] sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-[#4CAF50] text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? 'bg-[#1E1E2F] text-[#8A8A9A]'
                      : 'bg-[#2A2A3C] text-[#B4B4C0] hover:bg-[#3A3A4C]'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-[#4CAF50] text-sm font-medium rounded-md ${
                    pagination.page === pagination.totalPages
                      ? 'bg-[#1E1E2F] text-[#8A8A9A]'
                      : 'bg-[#2A2A3C] text-[#B4B4C0] hover:bg-[#3A3A4C]'
                  }`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#B4B4C0]">
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
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#4CAF50] bg-[#2A2A3C] text-sm font-medium ${
                        pagination.page === 1
                          ? 'text-[#8A8A9A] cursor-not-allowed'
                          : 'text-[#B4B4C0] hover:bg-[#3A3A4C]'
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
                            ? 'z-10 bg-[#4CAF50] border-[#4CAF50] text-white'
                            : 'bg-[#2A2A3C] border-[#3A3A4C] text-[#B4B4C0] hover:bg-[#3A3A4C]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#4CAF50] bg-[#2A2A3C] text-sm font-medium ${
                        pagination.page === pagination.totalPages
                          ? 'text-[#8A8A9A] cursor-not-allowed'
                          : 'text-[#B4B4C0] hover:bg-[#3A3A4C]'
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#2A2A3C] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-[#3A3A4C]">
            <div className="p-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRejectionReason('');
                }}
                className="absolute top-4 right-4 text-[#8A8A9A] hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-[#3A3A4C]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {modalType === 'receipt' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Comprobante de Pago</h3>
                  
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 border border-[#3A3A4C] rounded-lg bg-[#1E1E2F]">
                      <div className="animate-spin h-10 w-10 border-4 border-[#4CAF50] border-t-transparent rounded-full mb-2"></div>
                      <p className="text-[#8A8A9A]">Cargando comprobante...</p>
                    </div>
                  ) : previewError ? (
                    <div className="flex flex-col items-center justify-center h-96 border border-[#3A3A4C] rounded-lg bg-[#1E1E2F]">
                      <svg className="w-12 h-12 text-[#8A8A9A] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-[#8A8A9A] text-center">{previewError}</p>
                    </div>
                  ) : previewImage ? (
                    <div className="border border-[#3A3A4C] rounded-lg overflow-hidden bg-[#1E1E2F]">
                      <img 
                        src={previewImage} 
                        alt="Comprobante de pago"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-[#3A3A4C] rounded-lg overflow-hidden bg-[#1E1E2F]">
                      {selectedPayment?.paymentDetails.receiptData && (
                        <iframe
                          src={`data:${selectedPayment.paymentDetails.fileType || 'application/pdf'};base64,${selectedPayment.paymentDetails.receiptData}`}
                          className="w-full h-96"
                          title="Comprobante de pago"
                        />
                      )}
                    </div>
                  )}
                  
                  {selectedPayment?.paymentDetails.fileName && (
                    <div className="mt-2 p-3 bg-[#1E1E2F] rounded-lg border border-[#3A3A4C]">
                      <p className="text-sm font-medium text-white">
                        <span className="text-[#B4B4C0]">Archivo:</span> {selectedPayment.paymentDetails.fileName} 
                        {selectedPayment.paymentDetails.fileSize && (
                          <span className="text-[#B4B4C0]"> ({(selectedPayment.paymentDetails.fileSize / 1024 < 1000 
                            ? Math.round(selectedPayment.paymentDetails.fileSize / 1024) + " KB" 
                            : (selectedPayment.paymentDetails.fileSize / (1024 * 1024)).toFixed(2) + " MB")})</span>
                        )}
                      </p>
                      {selectedPayment.paymentDetails.uploadDate && (
                        <p className="text-xs text-[#B4B4C0]">
                          Subido el {new Date(selectedPayment.paymentDetails.uploadDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {modalType === 'confirm' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Confirmar Aprobación</h3>
                  <div className="p-4 bg-[#1E1E2F] rounded-lg border border-[#3A3A4C]">
                    <p className="text-[#B4B4C0] mb-2">
                      ¿Estás seguro de que deseas aprobar este pago?
                    </p>
                    {selectedPayment && (
                      <div className="space-y-2 text-sm">
                        <p><span className="text-white">Usuario:</span> <span className="text-[#B4B4C0]">{selectedPayment.userName}</span></p>
                        <p><span className="text-white">Producto:</span> <span className="text-[#B4B4C0]">{selectedPayment.courseTitle}</span></p>
                        <p><span className="text-white">Monto:</span> <span className="text-[#B4B4C0]">{formatAmount(selectedPayment.amount)}</span></p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-green-900 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg">
                    <p className="text-green-100 text-sm">
                      Al aprobar este pago, el usuario recibirá acceso inmediato al producto y se le enviará un correo de confirmación.
                    </p>
                  </div>
                </div>
              )}

              {modalType === 'reject' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Rechazar Pago</h3>
                  <div className="p-4 bg-[#1E1E2F] rounded-lg border border-[#3A3A4C]">
                    <p className="text-[#B4B4C0] mb-2">
                      ¿Estás seguro de que deseas rechazar este pago?
                    </p>
                    {selectedPayment && (
                      <div className="space-y-2 text-sm">
                        <p><span className="text-white">Usuario:</span> <span className="text-[#B4B4C0]">{selectedPayment.userName}</span></p>
                        <p><span className="text-white">Producto:</span> <span className="text-[#B4B4C0]">{selectedPayment.courseTitle}</span></p>
                        <p><span className="text-white">Monto:</span> <span className="text-[#B4B4C0]">{formatAmount(selectedPayment.amount)}</span></p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">
                      Motivo del rechazo <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className={`w-full p-3 bg-[#1E1E2F] border rounded-lg text-white placeholder-[#8A8A9A] focus:outline-none resize-none transition-colors duration-200 ${
                          rejectionReason.trim().length < 10 && rejectionReason.trim().length > 0
                            ? 'border-red-500 focus:border-red-400'
                            : rejectionReason.trim().length >= 10
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-[#3A3A4C] focus:border-[#4CAF50]'
                        }`}
                        rows={4}
                        placeholder="Explica el motivo del rechazo. Este mensaje será enviado al usuario por correo electrónico."
                        maxLength={500}
                        required
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-[#8A8A9A]">
                        <span className={rejectionReason.trim().length >= 10 ? 'text-green-400' : rejectionReason.trim().length > 0 ? 'text-red-400' : ''}>
                          {rejectionReason.length}
                        </span>
                        /500
                      </div>
                    </div>
                    <p className={`text-xs transition-colors duration-200 ${
                      rejectionReason.trim().length >= 10 
                        ? 'text-green-400' 
                        : rejectionReason.trim().length > 0 
                        ? 'text-red-400' 
                        : 'text-[#B4B4C0]'
                    }`}>
                      {rejectionReason.trim().length >= 10 
                        ? '✓ Motivo válido' 
                        : `Mínimo 10 caracteres (${Math.max(0, 10 - rejectionReason.trim().length)} restantes). Sé específico para ayudar al usuario.`
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
                    <p className="text-red-100 text-sm">
                      Al rechazar este pago, el usuario recibirá un correo electrónico con el motivo del rechazo.
                    </p>
                  </div>
                </div>
              )}

              {/* Botones del modal */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#3A3A4C]">
                {modalType === 'receipt' && (
                  <>
                    {selectedPayment?.paymentDetails.receiptData && !previewError && (
                      <button
                        onClick={() => {
                          const fileType = selectedPayment.paymentDetails.fileType || 'application/octet-stream';
                          const fileName = selectedPayment.paymentDetails.fileName || 'comprobante.pdf';
                          const link = document.createElement('a');
                          link.href = `data:${fileType};base64,${selectedPayment.paymentDetails.receiptData}`;
                          link.download = fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar
                      </button>
                    )}
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-[#3A3A4C] hover:bg-[#4A4A5C] text-[#B4B4C0] rounded-lg font-medium transition-all duration-200"
                    >
                      Cerrar
                    </button>
                  </>
                )}

                {modalType === 'confirm' && (
                  <>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-[#3A3A4C] hover:bg-[#4A4A5C] text-[#B4B4C0] rounded-lg font-medium transition-all duration-200"
                      disabled={actionLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprobar Pago
                        </>
                      )}
                    </button>
                  </>
                )}

                {modalType === 'reject' && (
                  <>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-[#3A3A4C] hover:bg-[#4A4A5C] text-[#B4B4C0] rounded-lg font-medium transition-all duration-200"
                      disabled={actionLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading || !rejectionReason.trim() || rejectionReason.trim().length < 10}
                    >
                      {actionLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rechazar Pago
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 