import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';

export async function GET() {
  try {
    // Verificar autenticación y rol admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectToDatabase();

    // Total de usuarios (rol user)
    const totalUsers = await User.countDocuments({ role: 'user' });
    // Total de cursos
    const totalCourses = await Course.countDocuments();

    // Ventas totales (pagos aprobados)
    const totalSalesAgg = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    // Ventas del mes actual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySalesAgg = await Payment.aggregate([
      { $match: {
          status: 'approved',
          paymentDate: { $gte: firstDay, $lte: now }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlySales = monthlySalesAgg[0]?.total || 0;

    return NextResponse.json({
      totalUsers,
      totalCourses,
      totalSales,
      monthlySales
    });
  } catch (error) {
    console.error('Error en /api/admin/stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas admin' }, { status: 500 });
  }
} 