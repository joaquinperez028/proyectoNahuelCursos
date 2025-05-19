import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Payment from '@/models/Payment';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';

// Interfaces para mejorar el tipado
interface CourseDocument {
  _id: any;
  title: string;
  [key: string]: any;
}

interface UserDocument {
  _id: any;
  name: string;
  email: string;
  [key: string]: any;
}

// Endpoint para verificar pagos que necesitan corrección
export async function GET(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Encontrar pagos aprobados
    const approvedPayments = await Payment.find({ status: 'approved' }).lean();
    console.log(`[FIX-ACCESS] Encontrados ${approvedPayments.length} pagos aprobados para analizar`);

    // Filtrar pagos que no tienen accessGranted
    const pendingAccessPayments = [];
    const problemPayments = [];
    
    for (const payment of approvedPayments) {
      const { _id, courseId, userId } = payment;
      
      // Buscar si existe progreso para este curso y usuario
      const progress = await Progress.findOne({ courseId, userId }).lean();
      
      if (!progress) {
        // Si no hay progreso, este es un problema
        const [courseDoc, userDoc] = await Promise.all([
          Course.findById(courseId).lean(),
          User.findById(userId).lean()
        ]);
        
        const course = courseDoc as CourseDocument | null;
        const user = userDoc as UserDocument | null;
        
        pendingAccessPayments.push({
          paymentId: _id,
          courseId,
          userId,
          courseName: course ? course.title : 'Curso desconocido',
          userName: user ? user.name : 'Usuario desconocido',
          userEmail: user ? user.email : 'Email desconocido',
          paymentDate: payment.createdAt,
          accessGranted: payment.paymentDetails?.accessGranted || false
        });
      } 
      else if (!payment.paymentDetails?.accessGranted) {
        // Si hay progreso pero el pago no está marcado como con acceso concedido
        const [courseDoc, userDoc] = await Promise.all([
          Course.findById(courseId).lean(),
          User.findById(userId).lean()
        ]);
        
        const course = courseDoc as CourseDocument | null;
        const user = userDoc as UserDocument | null;
        
        problemPayments.push({
          paymentId: _id,
          courseId,
          userId,
          courseName: course ? course.title : 'Curso desconocido',
          userName: user ? user.name : 'Usuario desconocido',
          userEmail: user ? user.email : 'Email desconocido',
          paymentDate: payment.createdAt,
          hasProgress: true,
          accessGranted: false
        });
      }
    }

    // Retornar resultados
    return NextResponse.json({
      totalApprovedPayments: approvedPayments.length,
      pendingAccessCount: pendingAccessPayments.length,
      problemPaymentsCount: problemPayments.length,
      pendingAccessPayments,
      problemPayments
    });

  } catch (error) {
    console.error('[FIX-ACCESS] Error al analizar pagos:', error);
    return NextResponse.json({ 
      error: 'Error al analizar pagos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Endpoint para ejecutar la corrección de acceso a cursos
export async function POST(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener parámetros opcionales
    const { paymentId } = await request.json().catch(() => ({}));

    // Resultados
    let totalPayments = 0;
    let fixedAccess = 0;
    let alreadyHadAccess = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    // Si se proporciona un ID de pago específico, procesar solo ese
    if (paymentId) {
      console.log(`[FIX-ACCESS] Procesando pago específico: ${paymentId}`);
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        return NextResponse.json({ error: `Pago con ID ${paymentId} no encontrado` }, { status: 404 });
      }
      
      if (payment.status === 'approved') {
        const result = await fixCourseAccess(payment);
        totalPayments = 1;
        
        if (result.success) {
          if (result.alreadyHadAccess) {
            alreadyHadAccess++;
          } else {
            fixedAccess++;
          }
        } else {
          errors++;
          errorDetails.push({
            paymentId: payment._id,
            error: result.error
          });
        }
      } else {
        return NextResponse.json({ 
          message: `El pago ${paymentId} no está aprobado. Estado actual: ${payment.status}` 
        }, { status: 400 });
      }
    } 
    // Si no se proporciona ID, procesar todos los pagos aprobados
    else {
      console.log('[FIX-ACCESS] Procesando todos los pagos aprobados');
      const approvedPayments = await Payment.find({ status: 'approved' });
      totalPayments = approvedPayments.length;
      
      console.log(`[FIX-ACCESS] Encontrados ${totalPayments} pagos aprobados para procesar`);
      
      for (const payment of approvedPayments) {
        const result = await fixCourseAccess(payment);
        
        if (result.success) {
          if (result.alreadyHadAccess) {
            alreadyHadAccess++;
          } else {
            fixedAccess++;
          }
        } else {
          errors++;
          errorDetails.push({
            paymentId: payment._id,
            error: result.error
          });
        }
      }
    }

    // Respuesta con resumen
    return NextResponse.json({
      success: true,
      summary: {
        totalPaymentsProcessed: totalPayments,
        accessesFixed: fixedAccess,
        alreadyHadAccess: alreadyHadAccess,
        errors: errors
      },
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    });

  } catch (error) {
    console.error('[FIX-ACCESS] Error al procesar la solicitud:', error);
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Función para arreglar el acceso a un curso basado en un pago
async function fixCourseAccess(payment: any) {
  try {
    const { _id, courseId, userId } = payment;
    
    console.log(`[FIX-ACCESS] Procesando pago ${_id} para curso ${courseId} y usuario ${userId}`);

    // Verificar si el curso y el usuario existen
    const [course, user] = await Promise.all([
      Course.findById(courseId),
      User.findById(userId)
    ]);

    if (!course) {
      return { 
        success: false, 
        error: `Curso con ID ${courseId} no encontrado` 
      };
    }

    if (!user) {
      return { 
        success: false, 
        error: `Usuario con ID ${userId} no encontrado` 
      };
    }

    // Verificar si ya existe un progreso para este usuario y curso
    const existingProgress = await Progress.findOne({
      courseId,
      userId
    });

    let progressCreated = false;
    
    // Si no existe progreso, creamos uno nuevo
    if (!existingProgress) {
      console.log(`[FIX-ACCESS] Creando nuevo registro de progreso para curso ${courseId} y usuario ${userId}`);
      
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
      progressCreated = true;
      console.log(`[FIX-ACCESS] Registro de progreso creado correctamente con ID: ${newProgress._id}`);
    } else {
      console.log(`[FIX-ACCESS] El usuario ya tiene registro de progreso. ID: ${existingProgress._id}`);
    }

    // Actualizar el pago para marcar que se otorgó acceso
    let paymentUpdated = false;
    let dateFixed = false;
    let invoiceAdded = false;

    // Verificar si hay fechas inválidas o nulas
    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : null;
    const createdAt = payment.createdAt ? new Date(payment.createdAt) : null;
    
    const isPaymentDateValid = paymentDate && !isNaN(paymentDate.getTime());
    const isCreatedAtValid = createdAt && !isNaN(createdAt.getTime());
    
    // Preparar actualizaciones
    const updates: any = {};

    // Corregir accessGranted en paymentDetails
    if (!payment.paymentDetails?.accessGranted) {
      updates.paymentDetails = {
        ...payment.paymentDetails,
        accessGranted: true,
        accessGrantedAt: new Date()
      };
      paymentUpdated = true;
    }

    // Corregir fechas inválidas
    if (!isPaymentDateValid) {
      updates.paymentDate = isCreatedAtValid ? payment.createdAt : new Date();
      dateFixed = true;
      console.log(`[FIX-ACCESS] Corrigiendo fecha de pago para ${_id}`);
    }

    // Generar o corregir datos de factura si es necesario
    if (!payment.invoiceId || !payment.invoiceData) {
      const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      updates.invoiceId = invoiceId;
      updates.invoiceData = {
        invoiceNumber: invoiceId,
        issuedDate: new Date(),
        items: [{
          description: `Curso: ${course.title}`,
          quantity: 1,
          price: payment.amount
        }],
        total: payment.amount,
        customer: {
          name: user.name,
          email: user.email,
          id: userId
        }
      };
      
      invoiceAdded = true;
      console.log(`[FIX-ACCESS] Generando datos de factura con ID: ${invoiceId}`);
    }

    // Aplicar actualizaciones si hay cambios
    if (paymentUpdated || dateFixed || invoiceAdded) {
      Object.assign(payment, updates);
      await payment.save();
      console.log(`[FIX-ACCESS] Pago ${_id} actualizado correctamente`);
    }

    return { 
      success: true, 
      progressCreated,
      paymentUpdated,
      dateFixed,
      invoiceAdded,
      alreadyHadAccess: existingProgress !== null && payment.paymentDetails?.accessGranted === true 
    };
    
  } catch (error) {
    console.error('[FIX-ACCESS] Error al procesar acceso para pago:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
} 