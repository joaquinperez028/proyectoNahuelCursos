import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import { sendEmail } from '@/lib/email';

// Función para convertir ObjectId de MongoDB a string de forma segura
function safeToString(value: any): string {
  if (!value) return '';
  return typeof value.toString === 'function' ? value.toString() : String(value);
}

// Endpoint para obtener pagos por transferencia
export async function GET(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filtrar por pagos de transferencia y estatus
    const query = {
      paymentMethod: 'Transferencia',
      status
    };

    // Obtener el conteo total para la paginación
    const total = await Payment.countDocuments(query);

    // Obtener pagos con info del usuario y curso
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 }) // Más recientes primero
      .skip(skip)
      .limit(limit)
      .lean(); // Usar lean para mejor rendimiento

    // Obtener la información de usuarios y cursos
    const userIds = [...new Set(payments.map(p => p.userId))];
    const courseIds = [...new Set(payments.map(p => p.courseId))];

    const [users, courses] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      Course.find({ _id: { $in: courseIds } }).lean()
    ]);

    // Mapear usuarios y cursos por ID para acceso rápido
    const userMap: Record<string, any> = {};
    for (const user of users) {
      if (user && user._id) {
        const id = safeToString(user._id);
        userMap[id] = user;
      }
    }

    const courseMap: Record<string, any> = {};
    for (const course of courses) {
      if (course && course._id) {
        const id = safeToString(course._id);
        courseMap[id] = course;
      }
    }

    // Construir respuesta con datos enriquecidos
    const enrichedPayments = payments.map(payment => {
      const userId = safeToString(payment.userId);
      const courseId = safeToString(payment.courseId);
      
      return {
        ...payment,
        userName: userMap[userId]?.name || 'Usuario desconocido',
        userEmail: userMap[userId]?.email || 'correo@desconocido.com',
        courseTitle: courseMap[courseId]?.title || 'Curso desconocido'
      };
    });

    // Retornar pagos y datos de paginación
    return NextResponse.json({
      payments: enrichedPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener pagos por transferencia:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

// Endpoint para aprobar o rechazar pagos por transferencia
export async function POST(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener datos del cuerpo
    const { paymentId, action, rejectionReason } = await request.json();
    console.log(`[TRANSFER] Procesando ${action} para pago ID: ${paymentId}`);

    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Buscar el pago
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.log(`[TRANSFER] ERROR: Pago con ID ${paymentId} no encontrado`);
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    console.log(`[TRANSFER] Pago encontrado: ${payment._id}, método: ${payment.paymentMethod}, estado: ${payment.status}`);

    // Verificar que sea un pago por transferencia
    if (payment.paymentMethod !== 'Transferencia') {
      return NextResponse.json({ error: 'Este no es un pago por transferencia' }, { status: 400 });
    }

    // Verificar que está pendiente
    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Este pago ya fue procesado' }, { status: 400 });
    }

    // Procesar según la acción
    if (action === 'approve') {
      console.log(`[TRANSFER] Aprobando pago ID: ${payment._id} para curso: ${payment.courseId} y usuario: ${payment.userId}`);
      
      try {
        // Actualizar estado del pago
        payment.status = 'approved';
        payment.paymentDetails = {
          ...payment.paymentDetails,
          approvalStatus: 'approved',
          approvedBy: session.user.id,
          approvedAt: new Date()
        };
        await payment.save();
        console.log(`[TRANSFER] Estado del pago actualizado a: ${payment.status}`);
        
        // Dar acceso al curso
        const accessResult = await processCourseAccess(payment.courseId, payment.userId, payment._id, true);
        console.log(`[TRANSFER] Resultado de conceder acceso: ${accessResult ? 'Éxito' : 'Fallo'}`);

        // Enviar correo de confirmación
        try {
          const user = await User.findById(payment.userId);
          const course = await Course.findById(payment.courseId);
          
          if (user && user.email && course) {
            console.log(`[TRANSFER] Enviando correo de confirmación a: ${user.email} para curso: ${course.title}`);
            await sendConfirmationEmail(user.email, user.name, course.title);
          } else {
            console.log(`[TRANSFER] No se pudo enviar correo - Usuario o curso no encontrado: userId=${payment.userId}, courseId=${payment.courseId}`);
          }
        } catch (emailError) {
          console.error('[TRANSFER] Error al enviar correo de confirmación:', emailError);
          // No interrumpir el flujo si el correo falla
        }
      } catch (error) {
        console.error('[TRANSFER] Error al procesar aprobación:', error);
        return NextResponse.json({ error: 'Error al procesar la aprobación del pago' }, { status: 500 });
      }
    } else {
      // Actualizar estado del pago como rechazado
      payment.status = 'rejected';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        approvalStatus: 'rejected',
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || 'Pago rechazado por el administrador'
      };
      await payment.save();

      // Enviar correo de rechazo
      try {
        const user = await User.findById(payment.userId);
        const course = await Course.findById(payment.courseId);
        
        if (user && user.email && course) {
          await sendRejectionEmail(
            user.email, 
            user.name, 
            course.title, 
            rejectionReason || 'No se pudo verificar el pago'
          );
        }
      } catch (emailError) {
        console.error('Error al enviar correo de rechazo:', emailError);
        // No interrumpir el flujo si el correo falla
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Pago ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente` 
    });

  } catch (error) {
    console.error('Error al procesar acción en pago por transferencia:', error);
    return NextResponse.json({ error: 'Error al procesar la acción' }, { status: 500 });
  }
}

// Función para procesar el acceso al curso
async function processCourseAccess(courseId: string, userId: string, paymentId: string, grantAccess: boolean) {
  try {
    if (grantAccess) {
      console.log(`[ACCESS] Otorgando acceso al curso ${courseId} para el usuario ${userId}`);
      
      // Verificamos si ya existe un progreso para este usuario y curso
      const existingProgress = await Progress.findOne({
        courseId,
        userId
      });

      // Si no existe, creamos uno nuevo
      if (!existingProgress) {
        console.log(`[ACCESS] Creando nuevo registro de progreso para curso ${courseId} y usuario ${userId}`);
        
        // Crear el registro de acuerdo con el esquema del modelo
        const newProgress = new Progress({
          courseId,
          userId,
          totalProgress: 0,
          isCompleted: false,
          completedAt: null,
          certificateIssued: false,
          videoProgress: []
        });
        
        await newProgress.save();
        console.log(`[ACCESS] Registro de progreso creado correctamente con ID: ${newProgress._id}`);
      } else {
        console.log(`[ACCESS] El usuario ya tiene acceso al curso. ID de progreso: ${existingProgress._id}`);
      }
      
      // Actualizamos el estado del pago usando directamente el ID del pago
      const payment = await Payment.findById(paymentId);
      if (payment) {
        payment.paymentDetails = {
          ...payment.paymentDetails,
          accessGranted: true,
          accessGrantedAt: new Date()
        };
        await payment.save();
        console.log(`[ACCESS] Detalles de pago actualizados para ID: ${payment._id}`);
      } else {
        console.log(`[ACCESS] No se encontró el pago con ID ${paymentId} para actualizar detalles`);
      }
      
      return true;
    }
    
    return false;
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
      <p>Tu pago por transferencia para el curso <strong>${courseTitle}</strong> ha sido aprobado.</p>
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

// Función para enviar correo de rechazo
async function sendRejectionEmail(email: string, name: string, courseTitle: string, reason: string) {
  const subject = `Información sobre tu pago para ${courseTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h1 style="color: #e74c3c;">Información de pago</h1>
      <p>Hola ${name},</p>
      <p>Lamentamos informarte que tu pago por transferencia para el curso <strong>${courseTitle}</strong> no ha sido aprobado.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Si crees que esto es un error o necesitas ayuda adicional, por favor contáctanos respondiendo este correo.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contacto" style="background-color: #3498db; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          CONTACTAR SOPORTE
        </a>
      </div>
      <p>Puedes intentar nuevamente con otro método de pago o una nueva transferencia.</p>
    </div>
  `;
  
  try {
    await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error al enviar correo de rechazo:', error);
  }
} 