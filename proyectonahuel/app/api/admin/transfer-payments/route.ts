import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import { sendEmail } from '@/lib/email';

// Tipos para los objetos de MongoDB
interface MongoDBDocument {
  _id: {
    toString(): string;
  };
  [key: string]: any;
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
    const userMap = users.reduce<Record<string, MongoDBDocument>>((map, user) => {
      if (user && user._id) {
        map[user._id.toString()] = user;
      }
      return map;
    }, {});

    const courseMap = courses.reduce<Record<string, MongoDBDocument>>((map, course) => {
      if (course && course._id) {
        map[course._id.toString()] = course;
      }
      return map;
    }, {});

    // Construir respuesta con datos enriquecidos
    const enrichedPayments = payments.map(payment => {
      const userId = payment.userId.toString();
      const courseId = payment.courseId.toString();
      
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

    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Buscar el pago
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

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
      // Actualizar estado del pago
      payment.status = 'approved';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        approvalStatus: 'approved',
        approvedBy: session.user.id,
        approvedAt: new Date()
      };
      await payment.save();
      
      // Dar acceso al curso
      await processCourseAccess(payment.courseId, payment.userId, true);

      // Enviar correo de confirmación
      try {
        const user = await User.findById(payment.userId);
        const course = await Course.findById(payment.courseId);
        
        if (user && user.email && course) {
          await sendConfirmationEmail(user.email, user.name, course.title);
        }
      } catch (emailError) {
        console.error('Error al enviar correo de confirmación:', emailError);
        // No interrumpir el flujo si el correo falla
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