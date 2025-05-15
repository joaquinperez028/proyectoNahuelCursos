import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Payment from '@/models/Payment';
import Course from '@/models/Course';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  try {
    // Buscar pagos aprobados del usuario
    const payments = await Payment.find({
      status: 'approved',
      userId: session.user.id
    }).populate('courseId');

    const purchases = payments.map(payment => ({
      id: payment._id,
      courseTitle: payment.courseId?.title || 'Curso',
      date: payment.paymentDate || payment.createdAt,
      paymentMethod: payment.paymentMethod || 'No especificado',
      amount: payment.amount || 0,
      invoiceUrl: payment.invoiceUrl || null
    }));

    return new Response(JSON.stringify({ purchases }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener compras' }), { status: 500 });
  }
} 