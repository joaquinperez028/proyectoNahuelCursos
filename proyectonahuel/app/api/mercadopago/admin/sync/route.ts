import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { connectToDB } from '@/lib/database';

// Configurar MercadoPago con la clave de acceso
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string 
});

export async function GET() {
  try {
    // Conectar a la base de datos
    await connectToDB();

    // Verificar que el usuario esté autenticado y sea administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Crear instancia del recurso Payment
    const paymentClient = new Payment(client);
    
    // Obtener pagos de MercadoPago (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Consultar pagos de MercadoPago
    const response = await paymentClient.search({
      options: {
        // En un ambiente real, filtrar por fecha
        // begin_date: thirtyDaysAgo.toISOString().split('T')[0],
        // end_date: new Date().toISOString().split('T')[0],
        limit: 50, // Limitar a 50 pagos
        offset: 0
      }
    });

    // En un ambiente real, estos datos se guardarían en la base de datos
    // para su posterior consulta en la interfaz de reportes
    
    // Verificar que existan resultados
    if (!response.results || !Array.isArray(response.results)) {
      return NextResponse.json({
        success: true,
        totalPayments: 0,
        totalAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
        payments: []
      });
    }
    
    // Transformar los resultados para la respuesta
    const payments = response.results.map((payment: any) => {
      // Extraer el courseId y userId de external_reference (si está disponible)
      let courseId = 'unknown';
      let userId = 'unknown';
      
      if (payment.external_reference) {
        const parts = payment.external_reference.split('-');
        if (parts.length >= 2) {
          courseId = parts[0];
          userId = parts[1];
        }
      }

      return {
        id: payment.id,
        date: payment.date_created || payment.date_approved,
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        paymentType: payment.payment_type_id,
        amount: payment.transaction_amount,
        currencyId: payment.currency_id,
        courseId,
        userId,
        installments: payment.installments,
        processingMode: payment.processing_mode,
        description: payment.description
      };
    });
    
    // Calcular algunas estadísticas básicas
    const totalAmount = payments
      .filter((p: any) => p.status === 'approved')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
      
    const pendingAmount = payments
      .filter((p: any) => p.status === 'pending')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
      
    const rejectedAmount = payments
      .filter((p: any) => p.status === 'rejected')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      totalPayments: payments.length,
      totalAmount,
      pendingAmount,
      rejectedAmount,
      payments
    });
    
  } catch (error) {
    console.error('Error al sincronizar con MercadoPago:', error);
    return NextResponse.json({ 
      error: 'Error al sincronizar datos con MercadoPago',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 