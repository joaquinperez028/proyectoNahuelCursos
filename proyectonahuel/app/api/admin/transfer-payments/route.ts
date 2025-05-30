import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import { sendEmail, getUserConfirmationTemplate, getRejectionTemplate } from '@/lib/email';
import Pack from '@/models/Pack';

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

    // Obtener la información de usuarios, cursos y packs
    const userIds = [...new Set(payments.map(p => p.userId))];
    const courseIds = [...new Set(payments.map(p => p.courseId).filter(Boolean))];
    const packIds = [...new Set(payments.map(p => p.packId).filter(Boolean))];

    const [users, courses, packs] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      courseIds.length > 0 ? Course.find({ _id: { $in: courseIds } }).lean() : [],
      packIds.length > 0 ? Pack.find({ _id: { $in: packIds } }).lean() : []
    ]);

    // Mapear usuarios, cursos y packs por ID para acceso rápido
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

    const packMap: Record<string, any> = {};
    for (const pack of packs) {
      if (pack && pack._id) {
        const id = safeToString(pack._id);
        packMap[id] = pack;
      }
    }

    // Construir respuesta con datos enriquecidos
    const enrichedPayments = payments.map(payment => {
      const userId = safeToString(payment.userId);
      const courseId = safeToString(payment.courseId);
      const packId = safeToString(payment.packId);
      
      let itemTitle = 'Producto desconocido';
      
      if (packId && packMap[packId]) {
        itemTitle = `Pack: ${packMap[packId].name}`;
      } else if (courseId && courseMap[courseId]) {
        itemTitle = courseMap[courseId].title;
      }
      
      return {
        ...payment,
        userName: userMap[userId]?.name || 'Usuario desconocido',
        userEmail: userMap[userId]?.email || 'correo@desconocido.com',
        courseTitle: itemTitle
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
      console.log(`[TRANSFER] Aprobando pago ID: ${payment._id}`);
      
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
        
        // Dar acceso al curso o pack
        const accessResult = await processCourseAccess(
          payment.courseId || null,
          payment.userId,
          payment._id,
          true,
          payment.packId
        );
        console.log(`[TRANSFER] Resultado de conceder acceso: ${accessResult ? 'Éxito' : 'Fallo'}`);

        // Enviar correo de confirmación
        try {
          const user = await User.findById(payment.userId);
          let itemTitle = '';

          if (payment.packId) {
            const pack = await Pack.findById(payment.packId);
            itemTitle = pack ? `Pack: ${pack.name}` : 'Pack desconocido';
          } else {
            const course = await Course.findById(payment.courseId);
            itemTitle = course ? course.title : 'Curso desconocido';
          }
          
          if (user && user.email) {
            console.log(`[TRANSFER] Enviando correo de confirmación a: ${user.email} para: ${itemTitle}`);
            await sendConfirmationEmail(user.email, user.name || 'Usuario', itemTitle);
          } else {
            console.log(`[TRANSFER] No se pudo enviar correo - Usuario no encontrado: userId=${payment.userId}`);
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
        let itemTitle = '';

        if (payment.packId) {
          const pack = await Pack.findById(payment.packId);
          itemTitle = pack ? `Pack: ${pack.name}` : 'Pack desconocido';
        } else if (payment.courseId) {
          const course = await Course.findById(payment.courseId);
          itemTitle = course ? course.title : 'Curso desconocido';
        }
        
        if (user && user.email && itemTitle) {
          await sendRejectionEmail(
            user.email, 
            user.name, 
            itemTitle, 
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
async function processCourseAccess(courseId: string | null, userId: string, paymentId: string, grantAccess: boolean, packId?: string) {
  try {
    if (grantAccess) {
      if (packId) {
        // Si es un pack, obtener todos los cursos del pack
        const pack = await Pack.findById(packId).populate('courses');
        if (!pack) {
          console.error(`[ACCESS] Pack ${packId} no encontrado`);
          return false;
        }

        // Procesar cada curso del pack
        for (const course of pack.courses) {
          // Verificar si ya existe un progreso para este curso y usuario
          const existingProgress = await Progress.findOne({
            courseId: course._id,
            userId
          });

          // Si no existe, creamos uno nuevo
          if (!existingProgress) {
            console.log(`[ACCESS] Creando nuevo registro de progreso para curso ${course._id} y usuario ${userId}`);
            
            const newProgress = new Progress({
              courseId: course._id,
              userId,
              totalProgress: 0,
              isCompleted: false,
              completedAt: null,
              certificateIssued: false,
              videoProgress: []
            });
            
            await newProgress.save();
          }

          // Actualizar el array de cursos del usuario
          await User.findByIdAndUpdate(
            userId,
            { $addToSet: { courses: course._id } },
            { new: true }
          );
        }
      } else if (courseId) {
        // Si es un curso individual
        const existingProgress = await Progress.findOne({
          courseId,
          userId
        });

        // Si no existe, creamos uno nuevo
        if (!existingProgress) {
          console.log(`[ACCESS] Creando nuevo registro de progreso para curso ${courseId} y usuario ${userId}`);
          
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
        }

        // Actualizar el array de cursos del usuario
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { courses: courseId } },
          { new: true }
        );
      }

      // Actualizar el estado del pago
      const payment = await Payment.findById(paymentId);
      if (payment) {
        payment.paymentDetails = {
          ...payment.paymentDetails,
          accessGranted: true,
          accessGrantedAt: new Date()
        };
        await payment.save();
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
  const htmlContent = getUserConfirmationTemplate(name, courseTitle);
  
  try {
    await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error al enviar correo de confirmación:', error);
  }
}

// Función para enviar correo de rechazo
async function sendRejectionEmail(email: string, name: string, courseTitle: string, reason: string) {
  const subject = `ℹ️ Información sobre tu pago para ${courseTitle}`;
  const htmlContent = getRejectionTemplate(name, courseTitle, reason);
  
  try {
    await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error al enviar correo de rechazo:', error);
  }
} 