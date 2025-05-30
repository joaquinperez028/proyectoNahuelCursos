'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PaymentData {
  _id: string;
  courseId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
  transactionId: string;
}

interface Stats {
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  totalTransactions: number;
  approvedTransactions: number;
  pendingTransactions: number;
  rejectedTransactions: number;
  pendingTransferTransactions: number;
  monthlyData: Array<{
    year: number;
    month: number;
    total: number;
    count: number;
    label: string;
  }>;
  paymentMethods: Record<string, { total: number; count: number }>;
  coursesSold: number;
  topProducts: Array<{
    _id: string;
    count: number;
    total: number;
    title: string;
    type: 'course' | 'pack';
  }>;
}

export default function ReportesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentsData, setPaymentsData] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [filter, setFilter] = useState({
    dateRange: 'todos',
    startDate: '',
    endDate: '',
    paymentMethod: 'todos',
    status: 'todos',
  });

  const [exportLoading, setExportLoading] = useState(false);
  const exportLinkRef = useRef<HTMLAnchorElement | null>(null);

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
      if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
      
      setLoading(true);
      
      try {
        // Construir los parámetros de consulta
        const params = new URLSearchParams();
        if (filter.startDate) params.append('startDate', filter.startDate);
        if (filter.endDate) params.append('endDate', filter.endDate);
        if (filter.paymentMethod !== 'todos') params.append('paymentMethod', filter.paymentMethod);
        if (filter.status !== 'todos') params.append('status', filter.status);
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
        
        const response = await fetch(`/api/admin/payments?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.status}`);
        }
        
        const data = await response.json();
        
        setPaymentsData(data.payments || []);
        setFilteredPayments(data.payments || []);
        setPagination(data.pagination || pagination);
        setStats(data.stats || null);
        
      } catch (error) {
        console.error('Error al cargar datos de pagos:', error);
        alert('Error al cargar datos de pagos');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsData();
  }, [status, session, pagination.page, pagination.limit, filter]);

  // Configurar filtro por rango de fechas predefinido
  useEffect(() => {
    if (filter.dateRange === 'todos') {
      setFilter(prev => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date();

    if (filter.dateRange === 'hoy') {
      startDate = today;
    } else if (filter.dateRange === 'semana') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (filter.dateRange === 'mes') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    } else if (filter.dateRange === 'anio') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    }

    setFilter(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }));
  }, [filter.dateRange]);

  // Cambiar filtro
  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Volver a la primera página al filtrar
  };

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Exportar a CSV
  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.paymentMethod !== 'todos') params.append('paymentMethod', filter.paymentMethod);
      if (filter.status !== 'todos') params.append('status', filter.status);
      params.append('limit', '1000'); // Obtener más registros para el CSV
      
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos para exportar: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Preparar datos para CSV
      const csvRows = [];
      
      // Cabecera
      const headers = ['ID', 'Fecha', 'Curso', 'Usuario', 'Email', 'Método', 'Monto', 'Estado'];
      csvRows.push(headers.join(','));
      
      // Datos
      for (const payment of data.payments) {
        const row = [
          payment.transactionId,
          new Date(payment.paymentDate).toLocaleString('es-AR'),
          `"${payment.courseTitle.replace(/"/g, '""')}"`, // Escapar comillas en strings
          `"${payment.userName.replace(/"/g, '""')}"`,
          payment.userEmail,
          payment.paymentMethod,
          payment.amount.toString(),
          payment.status
        ];
        csvRows.push(row.join(','));
      }
      
      // Crear el blob y enlace de descarga
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      if (exportLinkRef.current) {
        exportLinkRef.current.href = url;
        exportLinkRef.current.download = `reporte-pagos-${new Date().toISOString().split('T')[0]}.csv`;
        exportLinkRef.current.click();
      }
      
    } catch (error) {
      console.error('Error al exportar datos:', error);
      alert('Error al exportar datos');
    } finally {
      setExportLoading(false);
    }
  };

  // Sincronizar con MercadoPago
  const syncWithMercadoPago = async () => {
    try {
      const response = await fetch('/api/mercadopago/admin/sync');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al sincronizar con MercadoPago');
      }
      
      alert('Sincronización con MercadoPago completada');
      
      // Recargar datos
      window.location.reload();
    } catch (error) {
      console.error('Error al sincronizar con MercadoPago:', error);
      alert('Error al sincronizar con MercadoPago');
    }
  };

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

  // Configuración de gráficos
  const lineChartData = {
    labels: stats?.monthlyData.map(item => item.label) || [],
    datasets: [
      {
        label: 'Ingresos Mensuales',
        data: stats?.monthlyData.map(item => item.total) || [],
        fill: true,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 1)',
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: stats?.monthlyData.map(item => item.label) || [],
    datasets: [
      {
        label: 'Productos Vendidos',
        data: stats?.monthlyData.map(item => item.count) || [],
        backgroundColor: 'rgba(33, 150, 243, 0.6)',
      },
    ],
  };

  // Configuración para productos más vendidos
  const topProductsData = {
    labels: stats?.topProducts.map(product => 
      `${product.title} (${product.type === 'course' ? 'Curso' : 'Pack'})`
    ) || [],
    datasets: [
      {
        label: 'Ventas',
        data: stats?.topProducts.map(product => product.count) || [],
        backgroundColor: stats?.topProducts.map(product => 
          product.type === 'course' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(156, 39, 176, 0.8)'
        ) || [],
        borderColor: stats?.topProducts.map(product => 
          product.type === 'course' ? 'rgba(76, 175, 80, 1)' : 'rgba(156, 39, 176, 1)'
        ) || [],
        borderWidth: 1,
      },
    ],
  };

  const paymentMethodsData = {
    labels: stats ? Object.keys(stats.paymentMethods).map(key => {
      switch(key) {
        case 'MercadoPago': return 'MercadoPago';
        case 'PayPal': return 'PayPal';
        case 'Transferencia': return 'Transferencia';
        default: return key;
      }
    }) : [],
    datasets: [
      {
        data: stats ? Object.values(stats.paymentMethods).map(item => item.total) : [],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(255, 152, 0, 0.8)',
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(255, 152, 0, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Ir a la página de transferencias pendientes
  const goToPendingTransfers = () => {
    router.push('/admin/transferencias');
  };

  // Estadísticas generales
  const renderGeneralStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Ingresos Totales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-[var(--neutral-500)] mb-2">Ingresos Totales</h3>
          <p className="text-3xl font-bold text-[var(--neutral-800)]">
            {formatCurrency(stats.totalAmount)}
          </p>
          <div className="mt-2 flex items-center text-[var(--neutral-500)]">
            <span className="text-sm">
              {stats.totalTransactions} transacciones
            </span>
          </div>
        </div>

        {/* Ingresos Aprobados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-[var(--neutral-500)] mb-2">Ingresos Aprobados</h3>
          <p className="text-3xl font-bold text-[var(--success)]">
            {formatCurrency(stats.approvedAmount)}
          </p>
          <div className="mt-2 flex items-center text-[var(--neutral-500)]">
            <span className="text-sm">
              {stats.approvedTransactions} transacciones
            </span>
          </div>
        </div>

        {/* Ingresos Pendientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-[var(--neutral-500)] mb-2">Ingresos Pendientes</h3>
          <p className="text-3xl font-bold text-[var(--warning)]">
            {formatCurrency(stats.pendingAmount)}
          </p>
          <div className="mt-2 flex items-center text-[var(--neutral-500)]">
            <span className="text-sm">
              {stats.pendingTransactions} transacciones
            </span>
          </div>
        </div>

        {/* Cursos Vendidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-[var(--neutral-500)] mb-2">Cursos Vendidos</h3>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {stats.coursesSold}
          </p>
        </div>
      </div>
    );
  };

  // Nuevo componente para alerta de transferencias pendientes
  const renderPendingTransfersAlert = () => {
    if (!stats || stats.pendingTransferTransactions === 0) return null;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Tienes <span className="font-medium">{stats.pendingTransferTransactions}</span> pagos por transferencia pendientes de aprobación.
            </p>
            <div className="mt-2">
              <button
                onClick={goToPendingTransfers}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-600 underline"
              >
                Ver transferencias pendientes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Distribución de métodos de pago
  const renderPaymentMethodsChart = () => {
    if (!stats || !stats.paymentMethods) return null;

    const paymentMethods = stats.paymentMethods;
    const labels = Object.keys(paymentMethods).map(key => 
      key === 'MercadoPago' ? 'MercadoPago' : 
      key === 'Transferencia' ? 'Transferencia' : 
      key === 'PayPal' ? 'PayPal' : 
      'Otro'
    );
    const data = Object.values(paymentMethods).map(item => item.count);
    const backgroundColor = [
      '#8B5CF6', // Primary (MercadoPago)
      '#10B981', // Success (PayPal)
      '#4CAF50', // Transferencia
      '#6B7280', // Other
    ];

    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            boxWidth: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 col-span-1">
        <h3 className="text-lg font-medium text-[var(--neutral-500)] mb-4">Métodos de Pago</h3>
        <div className="h-64">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-[var(--neutral-100)]">Reporte de Ingresos</h1>
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
        
        {renderGeneralStats()}
        
        {renderPendingTransfersAlert()}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Ingresos Mensuales</h2>
            <div className="h-80">
              {stats && stats.monthlyData && stats.monthlyData.length > 0 ? (
                <Line data={lineChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[var(--neutral-400)]">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Productos Vendidos Este Mes</h2>
            <div className="h-80">
              {stats && stats.monthlyData && stats.monthlyData.length > 0 ? (
                <Bar data={barChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[var(--neutral-400)]">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Productos Más Vendidos</h2>
            <div className="h-80 mb-6">
              {stats && stats.topProducts && stats.topProducts.length > 0 ? (
                <Bar data={topProductsData} options={{
                  ...chartOptions,
                  indexAxis: 'y',
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[var(--neutral-400)]">No hay datos disponibles</p>
                </div>
              )}
            </div>
            
            {/* Detalles de productos */}
            {stats && stats.topProducts && stats.topProducts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[var(--neutral-200)] mb-3">Detalles de Ventas</h3>
                {stats.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between bg-[var(--background)] p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        product.type === 'course' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-[var(--neutral-100)] truncate max-w-xs">
                          {product.title}
                        </p>
                        <p className="text-xs text-[var(--neutral-400)]">
                          {product.type === 'course' ? 'Curso' : 'Pack'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--neutral-100)]">
                        {product.count} ventas
                      </p>
                      <p className="text-xs text-[var(--neutral-400)]">
                        {formatCurrency(product.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Ventas Totales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderPaymentMethodsChart()}
              
              <div className="flex flex-col justify-center">
                {stats && stats.paymentMethods && Object.entries(stats.paymentMethods).map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-[var(--neutral-300)]">{key}</span>
                      <span className="text-sm font-medium text-[var(--neutral-100)]">
                        {formatCurrency(value.total)}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--neutral-800)] rounded-full h-2.5">
                      <div 
                        className="bg-[#4CAF50] h-2.5 rounded-full" 
                        style={{ 
                          width: `${value.total / stats.approvedAmount * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-[var(--neutral-400)] mt-1">
                      {value.count} transacciones ({(value.total / stats.approvedAmount * 100).toFixed(1)}%)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[var(--card)] rounded-lg overflow-hidden border border-[var(--border)] mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Filtros</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Período predefinido
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
                  <option value="anio">Último año</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full bg-[var(--background)] text-[var(--neutral-300)] border border-[var(--border)] rounded-md py-2 px-3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full bg-[var(--background)] text-[var(--neutral-300)] border border-[var(--border)] rounded-md py-2 px-3"
                />
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
                  <option value="Otro">Otro</option>
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
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de transacciones */}
        <div className="bg-[var(--card)] rounded-lg overflow-hidden border border-[var(--border)]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[var(--neutral-100)] mb-4">Transacciones</h2>
            
            {filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--neutral-400)] uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-300)]">
                          {payment.transactionId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--neutral-300)]">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">
                          {payment.courseTitle}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">
                          {payment.userName}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">
                          {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--neutral-300)]">
                          {formatCurrency(payment.amount)}
                        </td>
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
                              : payment.status === 'cancelled'
                              ? 'Cancelado'
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
          
          {/* Paginación */}
          {pagination.totalPages > 0 && (
            <div className="bg-[var(--background)] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--neutral-400)] mb-4 sm:mb-0">
                Mostrando {filteredPayments.length} de {pagination.total} transacciones
              </p>
              
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 border border-[var(--border)] rounded text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 border border-[var(--border)] rounded text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                
                <span className="text-sm text-[var(--neutral-300)]">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-2 py-1 border border-[var(--border)] rounded text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-2 py-1 border border-[var(--border)] rounded text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>
          )}
          
          {/* Acciones */}
          <div className="bg-[var(--neutral-900)] px-6 py-3 flex items-center justify-between">
            <div>
              <a ref={exportLinkRef} className="hidden"></a>
              <button 
                onClick={exportToCSV}
                disabled={exportLoading}
                className="px-4 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--neutral-300)] hover:bg-[var(--neutral-800)] disabled:opacity-50 flex items-center"
              >
                {exportLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--neutral-300)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exportando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Exportar a CSV
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={syncWithMercadoPago}
              className="px-4 py-2 bg-[#4CAF50] text-white rounded-md text-sm hover:bg-[#45a049] flex items-center"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Sincronizar con MercadoPago.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 