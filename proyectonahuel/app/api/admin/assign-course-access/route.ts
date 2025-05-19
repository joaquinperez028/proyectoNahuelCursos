import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Progress from '@/models/Progress';
import Payment from '@/models/Payment';

// Endpoint para asignar un curso a un usuario manualmente (solo administradores)
export async function POST(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener datos del cuerpo de la solicitud
    const { userId, courseId, createPaymentRecord = true } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Se requiere ID de usuario y curso' }, { status: 400 });
    }

    // Verificar si el usuario y el curso existen
    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId)
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe un progreso para este usuario y curso
    const existingProgress = await Progress.findOne({
      userId,
      courseId,
    });

    if (existingProgress) {
      return NextResponse.json({
        success: true,
        message: 'El usuario ya tiene acceso a este curso',
        alreadyHasAccess: true,
        progressId: existingProgress._id
      });
    }

    // Crear un nuevo registro de progreso
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
    console.log(`[ASSIGN-COURSE] Acceso concedido al curso ${courseId} para el usuario ${userId}`);

    // Actualizar el array de cursos del usuario
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { courses: courseId } }, // Usar $addToSet para evitar duplicados
      { new: true }
    );
    console.log(`[ASSIGN-COURSE] Array de cursos del usuario actualizado`);

    // Si se solicita, crear un registro de pago para mantener consistencia en los registros
    let paymentRecord = null;
    if (createPaymentRecord) {
      const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const payment = new Payment({
        userId,
        courseId,
        amount: course.price || 0,
        paymentMethod: 'Asignación manual',
        paymentDate: new Date(),
        status: 'approved',
        transactionId: `MANUAL-${Date.now()}`,
        paymentDetails: {
          assignedBy: session.user.id,
          assignedAt: new Date(),
          accessGranted: true,
          accessGrantedAt: new Date(),
          notes: 'Asignado manualmente por un administrador'
        },
        invoiceId,
        invoiceData: {
          invoiceNumber: invoiceId,
          issuedDate: new Date(),
          items: [{
            description: `Curso: ${course.title}`,
            quantity: 1,
            price: course.price || 0
          }],
          total: course.price || 0,
          customer: {
            name: user.name,
            email: user.email,
            id: userId
          }
        }
      });

      await payment.save();
      paymentRecord = payment;
      console.log(`[ASSIGN-COURSE] Registro de pago creado: ${payment._id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Acceso al curso concedido correctamente',
      progressId: newProgress._id,
      paymentId: paymentRecord?._id || null
    });

  } catch (error) {
    console.error('[ASSIGN-COURSE] Error:', error);
    return NextResponse.json({ 
      error: 'Error al asignar acceso al curso',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Endpoint para obtener cursos y usuarios para el formulario
export async function GET(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener lista de cursos y usuarios para los selectores
    const [courses, users] = await Promise.all([
      Course.find().select('_id title price').sort({ title: 1 }).lean(),
      User.find().select('_id name email role').sort({ name: 1 }).lean()
    ]);

    return NextResponse.json({
      courses,
      users
    });

  } catch (error) {
    console.error('[ASSIGN-COURSE] Error al obtener datos:', error);
    return NextResponse.json({ 
      error: 'Error al obtener datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 