'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaymentData {
  id: string;
  courseTitle: string;
  date: string;
  status: string;
  paymentMethod: string;
  amount: number;
  userName: string;
  userEmail: string;
}

export default function ReportesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentsData, setPaymentsData] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [filter, setFilter] = useState({
    dateRange: 'todos',
    paymentMethod: 'todos',
    status: 'todos',
  });
  const [statistics, setStatistics] = useState({
    totalVentas: 0,
    ventasMes: 0,
    ventasSemana: 0,
    ventasHoy: 0,
    totalMercadoPago: 0,
    totalAprobados: 0,
    totalPendientes: 0,
    totalRechazados: 0
  });

  // Redireccionar si no es administrador
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/perfil');
    }
  }, [status, session, router]);

  // Cargar datos de pagos
  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        // En un entorno real, aquí se haría la llamada a la API
        // const response = await fetch('/api/admin/payments');
        // const data = await response.json();
        
        // Para fines de demostración, usamos datos simulados
        const mockData: PaymentData[] = [
          {
            id: 'mp_12345',
            courseTitle: 'Desarrollo Web Fullstack',
            date: '2023-10-15T12:30:00Z',
            status: 'approved',
            paymentMethod: 'MercadoPago',
            amount: 24999,
            userName: 'Juan Pérez',
            userEmail: 'juan@example.com'
          },
          {
            id: 'mp_12346',
            courseTitle: 'Diseño UX/UI Avanzado',
            date: '2023-10-20T14:15:00Z',
            status: 'approved',
            paymentMethod: 'MercadoPago',
            amount: 18999,
            userName: 'María García',
            userEmail: 'maria@example.com'
          },
          {
            id: 'mp_12347',
            courseTitle: 'Marketing Digital',
            date: '2023-11-05T09:45:00Z',
            status: 'pending',
            paymentMethod: 'MercadoPago',
            amount: 15999,
            userName: 'Carlos Rodríguez',
            userEmail: 'carlos@example.com'
          },
          {
            id: 'mp_12348',
            courseTitle: 'Desarrollo Mobile con React Native',
            date: '2023-11-10T16:20:00Z',
            status: 'rejected',
            paymentMethod: 'MercadoPago',
            amount: 22999,
            userName: 'Ana López',
            userEmail: 'ana@example.com'
          },
          {
            id: 'pp_54321',
            courseTitle: 'Python para Data Science',
            date: '2023-11-12T10:10:00Z',
            status: 'approved',
            paymentMethod: 'PayPal',
            amount: 19999,
            userName: 'Luis Martínez',
            userEmail: 'luis@example.com'
          }
        ];

        setPaymentsData(mockData);
        setFilteredPayments(mockData);
        calculateStatistics(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos de pagos:', error);
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchPaymentsData();
    }
  }, [status, session]);

  // Calcular estadísticas
  const calculateStatistics = (payments: PaymentData[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();

    let totalVentas = 0;
    let ventasMes = 0;
    let ventasSemana = 0;
    let ventasHoy = 0;
    let totalMercadoPago = 0;
    let totalAprobados = 0;
    let totalPendientes = 0;
    let totalRechazados = 0;

    payments.forEach(payment => {
      const paymentDate = new Date(payment.date).getTime();
      
      // Total ventas
      totalVentas += payment.amount;
      
      // Por período
      if (paymentDate >= oneMonthAgo) ventasMes += payment.amount;
      if (paymentDate >= oneWeekAgo) ventasSemana += payment.amount;
      if (paymentDate >= today) ventasHoy += payment.amount;
      
      // Por método de pago
      if (payment.paymentMethod === 'MercadoPago') totalMercadoPago += payment.amount;
      
      // Por estado
      if (payment.status === 'approved') totalAprobados += payment.amount;
      if (payment.status === 'pending') totalPendientes += payment.amount;
      if (payment.status === 'rejected') totalRechazados += payment.amount;
    });

    setStatistics({
      totalVentas,
      ventasMes,
      ventasSemana,
      ventasHoy,
      totalMercadoPago,
      totalAprobados,
      totalPendientes,
      totalRechazados
    });
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...paymentsData];
    
    // Filtrar por método de pago
    if (filter.paymentMethod !== 'todos') {
      filtered = filtered.filter(payment => payment.paymentMethod === filter.paymentMethod);
    }
    
    // Filtrar por estado
    if (filter.status !== 'todos') {
      filtered = filtered.filter(payment => payment.status === filter.status);
    }
    
    // Filtrar por rango de fechas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (filter.dateRange === 'hoy') {
      filtered = filtered.filter(payment => new Date(payment.date).getTime() >= today);
    } else if (filter.dateRange === 'semana') {
      const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(payment => new Date(payment.date).getTime() >= oneWeekAgo);
    } else if (filter.dateRange === 'mes') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      filtered = filtered.filter(payment => new Date(payment.date).getTime() >= oneMonthAgo);
    }
    
    setFilteredPayments(filtered);
  };

  // Cambiar filtro
  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [filter]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-16 h-16 rounded-full animate-spin border-y-2 border-solid border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null; // El useEffect ya redirigirá
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)]">Reportes de Ventas</h1>
          <Link
            href="/perfil"
            className="flex items-center px-4 py-2 bg-[var(--neutral-800)] hover:bg-[var(--neutral-700)] text-[var(--neutral-200)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver al Perfil
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--neutral-400)]">Total de Ventas</p>
            <h3 className="text-2xl font-bold text-[var(--neutral-100)]">{formatCurrency(statistics.totalVentas)}</h3>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--neutral-400)]">Ventas del Mes</p>
            <h3 className="text-2xl font-bold text-[var(--neutral-100)]">{formatCurrency(statistics.ventasMes)}</h3>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--neutral-400)]">Ventas por MercadoPago</p>
            <h3 className="text-2xl font-bold text-[var(--neutral-100)]">{formatCurrency(statistics.totalMercadoPago)}</h3>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--neutral-400)]">Pagos Aprobados</p>
            <h3 className="text-2xl font-bold text-[var(--neutral-100)]">{formatCurrency(statistics.totalAprobados)}</h3>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-lg overflow-hidden border border-[var(--border)] mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Período
                </label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full bg-[var(--background)] text-[var(--neutral-300)] border border-[var(--border)] rounded-md py-2 px-3"
                >
                  <option value="todos">Todos los períodos</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Método de pago
                </label>
                <select
                  value={filter.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full bg-[var(--background)] text-[var(--neutral-300)] border border-[var(--border)] rounded-md py-2 px-3"
                >
                  <option value="todos">Todos los métodos</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Estado
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-[var(--background)] text-[var(--neutral-300)] border border-[var(--border)] rounded-md py-2 px-3"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="approved">Aprobados</option>
                  <option value="pending">Pendientes</option>
                  <option value="rejected">Rechazados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-lg overflow-hidden border border-[var(--border)]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Transacciones de MercadoPago</h2>
            
            {filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Curso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-300)]">{payment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-300)]">{formatDate(payment.date)}</td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">{payment.courseTitle}</td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">{payment.userName}</td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">{payment.paymentMethod}</td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payment.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status === 'approved' 
                              ? 'Aprobado' 
                              : payment.status === 'pending'
                              ? 'Pendiente'
                              : 'Rechazado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--neutral-400)]">No se encontraron transacciones con los filtros aplicados.</p>
              </div>
            )}
          </div>
          
          <div className="bg-[var(--background)] px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-[var(--neutral-400)]">
              Mostrando {filteredPayments.length} de {paymentsData.length} transacciones
            </p>
            
            <div className="flex items-center space-x-2">
              <button 
                className="px-4 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)]"
              >
                Exportar a CSV
              </button>
              
              <Link
                href="/api/mercadopago/admin/sync"
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-md text-sm hover:bg-[#45a049]"
              >
                Sincronizar con MercadoPago
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 