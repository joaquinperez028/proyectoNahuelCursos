import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Progress from '@/models/Progress';
import Payment from '@/models/Payment';
import Pack from '@/models/Pack';
import { sendEmail } from '@/lib/email';

// Configurar MercadoPago con la clave de acceso
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string 
});

/**
 * Procesa el acceso a un curso para un usuario
 */
async function processCourseAccess(courseId: string, userId: string, approved: boolean) {
  try {
    // Verificar si ya existe un progreso para este curso y usuario
    let progress = await Progress.findOne({ courseId, userId });
    
    if (approved) {
      if (!progress) {
        // Crear nuevo progreso si no existe
        progress = await Progress.create({
          userId,
          courseId,
          completed: false,
          lastAccessed: new Date(),
          progress: 0,
          totalTime: 0
        });
      } else {
        // Actualizar último acceso si ya existe
        progress.lastAccessed = new Date();
        await progress.save();
      }
    } else if (progress) {
      // Si el pago fue rechazado y existe un progreso, lo eliminamos
      await progress.deleteOne();
    }
    
    return true;
  } catch (error) {
    console.error('Error al procesar acceso al curso:', error);
    return false;
  }
}

/**
 * Envía un correo de confirmación de compra
 */
async function sendConfirmationEmail(email: string, name: string, itemName: string) {
  try {
    const htmlContent = `
      <h1>¡Gracias por tu compra!</h1>
      <p>Hola ${name},</p>
      <p>Tu compra de "${itemName}" ha sido confirmada.</p>
      <p>Ya puedes acceder a tu contenido desde la plataforma.</p>
      <p>¡Que disfrutes aprendiendo!</p>
    `;
    
    await sendEmail(
      email,
      '¡Compra confirmada!',
      htmlContent
    );
  } catch (error) {
    console.error('Error al enviar correo de confirmación:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectToDB();

    // Obtener los datos de la notificación
    const data = await request.json();
    console.log('Webhook recibido:', data);

    // Verificar si es una notificación de pago
    if (data.type === 'payment') {
      const paymentId = data.data.id;
      console.log('ID de pago:', paymentId);

      // Crear instancia del recurso Payment
      const paymentClient = new MPPayment(client);
      
      // Obtener los detalles del pago
      const mpPayment = await paymentClient.get({ id: paymentId });
      console.log('Detalles del pago:', mpPayment);
      
      // Obtener la referencia externa (que contiene el ID del curso/pack y usuario)
      const externalReference = mpPayment.external_reference as string;
      if (!externalReference) {
        console.error('Referencia externa no encontrada en el pago:', paymentId);
        return NextResponse.json({ error: 'Referencia externa no encontrada' }, { status: 400 });
      }

      // Soporta referencia de curso: "course-courseId-userId" y de pack: "pack-packId-userId"
      const [type, itemId, userId] = externalReference.split('-');
      
      if (!type || !itemId || !userId) {
        console.error('Formato de referencia externa inválido:', externalReference);
        return NextResponse.json({ error: 'Formato de referencia externa inválido' }, { status: 400 });
      }

      const isPack = type === 'pack';
      
      // Obtener el estado del pago
      const paymentStatus = mpPayment.status as string;
      console.log('Estado del pago:', paymentStatus);
      
      // Verificar si ya existe un registro para este pago
      const existingPayment = await Payment.findOne({ transactionId: paymentId });
      
      if (existingPayment) {
        // Actualizar el estado si ya existe
        existingPayment.status = paymentStatus;
        await existingPayment.save();
        console.log('Pago existente actualizado:', existingPayment._id);
      } else {
        // Crear un nuevo registro de pago
        const paymentData: any = {
          userId,
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
        };

        // Agregar el ID del curso o pack según corresponda
        if (isPack) {
          paymentData.packId = itemId;
        } else {
          paymentData.courseId = itemId;
        }

        const payment = await Payment.create(paymentData);
        console.log('Nuevo pago creado:', payment._id);
      }
      
      // Procesar según el estado del pago
      if (paymentStatus === 'approved') {
        if (isPack) {
          // Pago de pack aprobado, asignar todos los cursos del pack
          const pack = await Pack.findById(itemId).populate('courses');
          if (!pack) {
            console.error('Pack no encontrado:', itemId);
            return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
          }

          console.log('Procesando acceso a pack:', pack._id);
          if (pack.courses && Array.isArray(pack.courses)) {
            for (const course of pack.courses) {
              await processCourseAccess(course._id.toString(), userId, true);
            }
          }

          // Enviar correo de confirmación de pack
          const user = await User.findById(userId);
          if (user && user.email && pack) {
            await sendConfirmationEmail(user.email, user.name || 'Usuario', `Pack: ${pack.name}`);
          }
        } else {
          // Pago de curso individual aprobado
          await processCourseAccess(itemId, userId, true);
          
          // Enviar correo de confirmación
          const user = await User.findById(userId);
          const course = await Course.findById(itemId);
          if (user && user.email && course) {
            await sendConfirmationEmail(user.email, user.name || 'Usuario', course.title);
          }
        }

        console.log('Acceso procesado correctamente');
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        if (isPack) {
          const pack = await Pack.findById(itemId).populate('courses');
          if (pack && pack.courses && Array.isArray(pack.courses)) {
            for (const course of pack.courses) {
              await processCourseAccess(course._id.toString(), userId, false);
            }
          }
        } else {
          await processCourseAccess(itemId, userId, false);
        }
        console.log('Acceso denegado por pago rechazado/cancelado');
      }
      // Si está pendiente, no hacemos nada hasta recibir confirmación
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al procesar webhook de MercadoPago:', error);
    return NextResponse.json({ error: 'Error al procesar la notificación' }, { status: 500 });
  }
} 