import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Progress from '@/models/Progress';
import Payment from '@/models/Payment';
import { sendEmail } from '@/lib/email';

// Configurar MercadoPago con la clave de acceso
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string 
});

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectToDB();

    // Obtener los datos de la notificación
    const data = await request.json();

    // Verificar si es una notificación de pago
    if (data.type === 'payment') {
      const paymentId = data.data.id;

      // Crear instancia del recurso Payment
      const paymentClient = new MPPayment(client);
      
      // Obtener los detalles del pago
      const mpPayment = await paymentClient.get({ id: paymentId });
      
      // Obtener la referencia externa (que contiene el ID del curso y usuario)
      const externalReference = mpPayment.external_reference as string;
      if (!externalReference) {
        console.error('Referencia externa no encontrada en el pago:', paymentId);
        return NextResponse.json({ error: 'Referencia externa no encontrada' }, { status: 400 });
      }

      const [courseId, userId] = externalReference.split('-');
      if (!courseId || !userId) {
        console.error('Formato de referencia externa inválido:', externalReference);
        return NextResponse.json({ error: 'Formato de referencia externa inválido' }, { status: 400 });
      }
      
      // Obtener el estado del pago
      const paymentStatus = mpPayment.status as string;
      
      // Verificar si ya existe un registro para este pago
      const existingPayment = await Payment.findOne({ transactionId: paymentId });
      
      if (existingPayment) {
        // Actualizar el estado si ya existe
        existingPayment.status = paymentStatus;
        await existingPayment.save();
      } else {
        // Obtener información del curso y usuario para los detalles del pago
        const course = await Course.findById(courseId);
        const user = await User.findById(userId);

        if (!course || !user) {
          console.error('Curso o usuario no encontrado:', { courseId, userId });
          return NextResponse.json({ error: 'Curso o usuario no encontrado' }, { status: 404 });
        }

        // Crear un nuevo registro de pago
        await Payment.create({
          userId,
          courseId,
          amount: mpPayment.transaction_amount,
          paymentMethod: 'MercadoPago',
          paymentDate: mpPayment.date_approved || mpPayment.date_created,
          status: paymentStatus,
          transactionId: paymentId,
          paymentDetails: {
            paymentMethodId: mpPayment.payment_method_id,
            paymentTypeId: mpPayment.payment_type_id,
            installments: mpPayment.installments
          },
          currency: mpPayment.currency_id,
          installments: mpPayment.installments
        });
      }
      
      // Procesar según el estado del pago
      if (paymentStatus === 'approved') {
        // Pago aprobado, dar acceso al curso
        await processCourseAccess(courseId, userId, true);
        
        // Enviar correo de confirmación
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);
        
        if (user && user.email && course) {
          await sendConfirmationEmail(user.email, user.name, course.title);
        }
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        // Pago rechazado o cancelado
        await processCourseAccess(courseId, userId, false);
      }
      // Si está pendiente, no hacemos nada hasta recibir confirmación
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al procesar webhook de MercadoPago:', error);
    return NextResponse.json({ error: 'Error al procesar la notificación' }, { status: 500 });
  }
}

// Función para procesar el acceso al curso
async function processCourseAccess(courseId: string, userId: string, grantAccess: boolean) {
  try {
    if (grantAccess) {
      // Verificamos si ya existe un progreso para este usuario y curso
      const existingProgress = await Progress.findOne({
        courseId,
        userId
      });

      // Si no existe, creamos uno nuevo
      if (!existingProgress) {
        await Progress.create({
          courseId,
          userId,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        });
      }
    } else {
      // Si el pago fue rechazado o cancelado, podríamos eliminar el progreso temporal
      // o marcar el intento de pago como fallido en caso de que tengamos una tabla de transacciones
    }
  } catch (error) {
    console.error('Error al procesar acceso al curso:', error);
    throw error;
  }
}

// Función para enviar correo de confirmación
async function sendConfirmationEmail(email: string, name: string, courseTitle: string) {
  const subject = `¡Compra exitosa! Acceso a ${courseTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h1 style="color: #4CAF50;">¡Felicitaciones, ${name}!</h1>
      <p>Tu compra del curso <strong>${courseTitle}</strong> ha sido confirmada.</p>
      <p>Ya puedes acceder a todo el contenido del curso desde tu perfil en nuestra plataforma.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-cursos" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          VER MIS CURSOS
        </a>
      </div>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>¡Esperamos que disfrutes tu experiencia de aprendizaje!</p>
    </div>
  `;
  
  try {
    await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error al enviar correo de confirmación:', error);
  }
} 