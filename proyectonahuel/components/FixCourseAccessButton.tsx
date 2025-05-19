'use client';

import { useState } from 'react';
import { useNotifications } from '@/components/Notification';

interface FixAccessResult {
  success: boolean;
  summary?: {
    totalPaymentsProcessed: number;
    accessesFixed: number;
    alreadyHadAccess: number;
    errors: number;
  };
  errorDetails?: Array<{
    paymentId: string;
    error: string;
  }>;
  // Propiedades adicionales para el diagnóstico
  pendingAccessCount?: number;
  problemPaymentsCount?: number;
  pendingAccessPayments?: Array<{
    paymentId: string;
    userName: string;
    courseName: string;
    [key: string]: any;
  }>;
  problemPayments?: Array<{
    paymentId: string;
    userName: string;
    courseName: string;
    [key: string]: any;
  }>;
}

export default function FixCourseAccessButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixAccessResult | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { showNotification } = useNotifications();

  // Ejecutar la corrección de todos los pagos
  const handleFixAllPayments = async () => {
    if (loading) return;
    
    if (!confirm('¿Estás seguro de que deseas corregir el acceso para TODOS los pagos aprobados? Este proceso puede tardar varios minutos.')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    setShowSummary(false);
    
    try {
      const response = await fetch('/api/admin/fix-course-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
      
      setResult(data);
      setShowSummary(true);
      
      if (data.success) {
        showNotification(`Proceso completado. Se actualizaron ${data.summary.accessesFixed} pagos.`, 'success');
      } else {
        showNotification('El proceso finalizó con errores. Revisa el resumen para más detalles.', 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar la corrección:', error);
      showNotification('Error al procesar la solicitud. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Ver diagnóstico previo
  const handleCheckPayments = async () => {
    if (loading) return;
    
    setLoading(true);
    setResult(null);
    setShowSummary(false);
    
    try {
      const response = await fetch('/api/admin/fix-course-access');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
      
      const summaryData = {
        success: true,
        summary: {
          totalPaymentsProcessed: data.totalApprovedPayments,
          accessesFixed: 0,
          alreadyHadAccess: data.totalApprovedPayments - data.pendingAccessCount - data.problemPaymentsCount,
          errors: 0
        },
        pendingAccessCount: data.pendingAccessCount,
        problemPaymentsCount: data.problemPaymentsCount,
        pendingAccessPayments: data.pendingAccessPayments,
        problemPayments: data.problemPayments
      };
      
      setResult(summaryData);
      setShowSummary(true);
      
      if (data.pendingAccessCount > 0 || data.problemPaymentsCount > 0) {
        showNotification(`Se encontraron ${data.pendingAccessCount + data.problemPaymentsCount} pagos que requieren atención.`, 'info');
      } else {
        showNotification('Todos los pagos están correctamente configurados. No se requieren acciones.', 'success');
      }
    } catch (error) {
      console.error('Error al verificar pagos:', error);
      showNotification('Error al procesar la solicitud. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white shadow p-4 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-3">Corregir Acceso a Cursos</h2>
      <p className="text-sm text-gray-500 mb-4">
        Esta herramienta ayuda a corregir problemas con pagos aprobados que no otorgaron correctamente
        el acceso a los cursos, o que tienen fechas o facturas incorrectas.
      </p>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCheckPayments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
              </>
            ) : (
              'Diagnosticar Problemas'
            )}
          </button>
          
          <button
            onClick={handleFixAllPayments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Corrigiendo...
              </>
            ) : (
              'Corregir Todos los Pagos'
            )}
          </button>
        </div>
        
        {showSummary && result && (
          <div className="mt-4 border rounded-md p-4 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Resumen del Diagnóstico</h3>
            
            {result.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xs text-gray-500">Total de Pagos</div>
                  <div className="text-xl font-medium">{result.summary.totalPaymentsProcessed}</div>
                </div>
                
                {result.pendingAccessCount !== undefined && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Necesitan Acceso</div>
                    <div className="text-xl font-medium text-orange-600">{result.pendingAccessCount}</div>
                  </div>
                )}
                
                {result.problemPaymentsCount !== undefined && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Con Problemas</div>
                    <div className="text-xl font-medium text-red-600">{result.problemPaymentsCount}</div>
                  </div>
                )}
                
                {result.summary.accessesFixed !== undefined && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Corregidos</div>
                    <div className="text-xl font-medium text-green-600">{result.summary.accessesFixed}</div>
                  </div>
                )}
                
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xs text-gray-500">Correctos</div>
                  <div className="text-xl font-medium text-green-600">{result.summary.alreadyHadAccess}</div>
                </div>
                
                {result.summary.errors !== undefined && result.summary.errors > 0 && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Errores</div>
                    <div className="text-xl font-medium text-red-600">{result.summary.errors}</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Lista de pagos con problemas si estamos en modo diagnóstico */}
            {result.pendingAccessPayments && result.pendingAccessPayments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Pagos sin Acceso al Curso</h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.pendingAccessPayments.map((payment: any) => (
                        <tr key={payment.paymentId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{payment.userName}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{payment.courseName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Errores de corrección si los hay */}
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2 text-red-600">Errores de Corrección</h4>
                <div className="max-h-60 overflow-y-auto bg-red-50 border border-red-200 rounded p-2">
                  <ul className="list-disc list-inside space-y-1">
                    {result.errorDetails.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        <span className="font-mono">{error.paymentId}</span>: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 