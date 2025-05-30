import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Payment from '@/models/Payment';
import Course from '@/models/Course';
import User from '@/models/User';
import Pack from '@/models/Pack';

export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol de administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conexión a la base de datos
    await connectToDB();

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const paymentMethod = url.searchParams.get('paymentMethod');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const page = parseInt(url.searchParams.get('page') || '1');

    // Construir filtros para la consulta
    const filters: any = {};
    
    // Filtrar por fechas
    if (startDate || endDate) {
      filters.paymentDate = {};
      if (startDate) filters.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // Final del día
        filters.paymentDate.$lte = endDateObj;
      }
    }
    
    // Filtrar por método de pago
    if (paymentMethod && paymentMethod !== 'todos') {
      filters.paymentMethod = paymentMethod;
    }
    
    // Filtrar por estado
    if (status && status !== 'todos') {
      filters.status = status;
    }

    // Calcular el skip para la paginación
    const skip = (page - 1) * limit;

    // Obtener pagos con paginación
    const payments = await Payment.find(filters)
      .sort({ paymentDate: -1 }) // Ordenar por fecha descendente
      .skip(skip)
      .limit(limit);
    
    // Contar el total de registros para la paginación
    const totalPayments = await Payment.countDocuments(filters);
    
    // Calcular estadísticas
    const stats = await calculatePaymentStats(filters);

    // Obtener información adicional (nombre del curso/pack y del usuario)
    const enrichedPayments = await Promise.all(payments.map(async (payment) => {
      const paymentObj = payment.toObject();
      
      // Obtener información del curso o pack
      let itemTitle = 'Producto no encontrado';
      
      if (paymentObj.packId) {
        const pack = await Pack.findById(paymentObj.packId);
        itemTitle = pack ? `Pack: ${pack.name}` : 'Pack no encontrado';
      } else if (paymentObj.courseId) {
        const course = await Course.findById(paymentObj.courseId);
        itemTitle = course ? course.title : 'Curso no encontrado';
      }
      
      paymentObj.courseTitle = itemTitle;
      
      // Obtener información del usuario
      const user = await User.findById(paymentObj.userId);
      paymentObj.userName = user ? user.name : 'Usuario no encontrado';
      paymentObj.userEmail = user ? user.email : 'Email no encontrado';
      
      return paymentObj;
    }));

    return NextResponse.json({
      success: true,
      payments: enrichedPayments,
      pagination: {
        total: totalPayments,
        page,
        limit,
        totalPages: Math.ceil(totalPayments / limit)
      },
      stats
    });
    
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return NextResponse.json({ 
      error: 'Error al obtener datos de pagos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Función para calcular estadísticas de pagos
async function calculatePaymentStats(filters: any) {
  // Base de filtros para los distintos cálculos
  const approvedFilter = { ...filters, status: 'approved' };
  const pendingFilter = { ...filters, status: 'pending' };
  const rejectedFilter = { ...filters, status: { $in: ['rejected', 'cancelled'] } };
  const mpFilter = { ...filters, paymentMethod: 'MercadoPago' };
  
  // Pipeline para obtener la suma de montos por estado
  const sumPipeline = [
    { $match: filters },
    { $group: {
      _id: '$status',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }}
  ] as any[];
  
  // Pipeline para agrupar por mes
  const currentDate = new Date();
  const lastYear = new Date();
  lastYear.setFullYear(currentDate.getFullYear() - 1);
  
  const monthlyPipeline = [
    { 
      $match: { 
        ...approvedFilter,
        paymentDate: { $gte: lastYear }
      } 
    },
    { 
      $group: {
        _id: { 
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      } 
    },
    { 
      $sort: { 
        '_id.year': 1, 
        '_id.month': 1 
      } 
    }
  ] as any[];

  // Calcular totales
  const totalAmount = await Payment.aggregate([
    { $match: approvedFilter },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ] as any[]);

  // Obtener resultados por estado
  const statusResults = await Payment.aggregate(sumPipeline);

  // Obtener datos mensuales
  const monthlyData = await Payment.aggregate(monthlyPipeline);

  // Obtener ventas por método de pago
  const paymentMethodResults = await Payment.aggregate([
    { $match: approvedFilter },
    { $group: {
      _id: '$paymentMethod',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }}
  ] as any[]);

  // Obtener conteo de cursos vendidos
  const coursesSold = await Payment.aggregate([
    { $match: approvedFilter },
    { $group: {
      _id: '$courseId',
      count: { $sum: 1 },
      total: { $sum: '$amount' }
    }},
    { $count: 'totalCourses' }
  ] as any[]);

  // Formatear resultados
  const statusMap: Record<string, { total: number, count: number }> = {};
  statusResults.forEach(item => {
    statusMap[item._id] = { 
      total: item.total || 0, 
      count: item.count || 0 
    };
  });
  
  // Formatear datos mensuales para gráficos
  const formattedMonthlyData = monthlyData.map(item => ({
    year: item._id.year,
    month: item._id.month,
    total: item.total,
    count: item.count,
    label: `${item._id.month}/${item._id.year}`
  }));

  // Formatear métodos de pago
  const paymentMethodMap: Record<string, { total: number, count: number }> = {};
  paymentMethodResults.forEach(item => {
    paymentMethodMap[item._id] = { 
      total: item.total || 0, 
      count: item.count || 0 
    };
  });

  return {
    totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
    approvedAmount: statusMap.approved ? statusMap.approved.total : 0,
    pendingAmount: statusMap.pending ? statusMap.pending.total : 0,
    rejectedAmount: statusMap.rejected ? statusMap.rejected.total : 0,
    totalTransactions: Object.values(statusMap).reduce((sum, item) => sum + (item.count || 0), 0),
    approvedTransactions: statusMap.approved ? statusMap.approved.count : 0,
    pendingTransactions: statusMap.pending ? statusMap.pending.count : 0,
    rejectedTransactions: statusMap.rejected ? statusMap.rejected.count : 0,
    monthlyData: formattedMonthlyData,
    paymentMethods: paymentMethodMap,
    coursesSold: coursesSold.length > 0 ? coursesSold[0].totalCourses : 0
  };
} 