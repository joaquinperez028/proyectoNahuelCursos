import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Pack from '@/models/Pack';
import Progress from '@/models/Progress';
import Payment from '@/models/Payment';

// Endpoint para asignar un pack a un usuario manualmente (solo administradores)
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
    const { userId, packId, createPaymentRecord = true } = await request.json();

    if (!userId || !packId) {
      return NextResponse.json({ error: 'Se requiere ID de usuario y pack' }, { status: 400 });
    }

    // Verificar si el usuario y el pack existen
    const [user, pack] = await Promise.all([
      User.findById(userId),
      Pack.findById(packId).populate('courses', '_id title price')
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!pack) {
      return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
    }

    // Verificar qué cursos del pack ya tiene el usuario
    const userCourseIds = user.courses.map((id: any) => id.toString());
    const packCourseIds = pack.courses.map((course: any) => course._id.toString());
    
    const alreadyOwnedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );

    const coursesToAssign = pack.courses.filter((course: any) => 
      !userCourseIds.includes(course._id.toString())
    );

    if (coursesToAssign.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'El usuario ya tiene acceso a todos los cursos de este pack',
        alreadyHasAccess: true,
        alreadyOwnedCourses: alreadyOwnedCourses.map((c: any) => c.title)
      });
    }

    // Crear registros de progreso para los cursos que no tiene
    const progressPromises = coursesToAssign.map((course: any) => {
      return new Progress({
        courseId: course._id,
        userId,
        totalProgress: 0,
        isCompleted: false,
        completedAt: null,
        certificateIssued: false,
        videoProgress: []
      }).save();
    });

    const progressRecords = await Promise.all(progressPromises);
    console.log(`[ASSIGN-PACK] ${progressRecords.length} registros de progreso creados para el pack ${packId} y usuario ${userId}`);

    // Actualizar el array de cursos del usuario con los nuevos cursos
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { courses: { $each: coursesToAssign.map((c: any) => c._id) } } },
      { new: true }
    );
    console.log(`[ASSIGN-PACK] Array de cursos del usuario actualizado con ${coursesToAssign.length} nuevos cursos`);

    // Si se solicita, crear un registro de pago para el pack
    let paymentRecord = null;
    if (createPaymentRecord) {
      const invoiceId = `INV-PACK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const payment = new Payment({
        userId,
        packId,
        amount: pack.price || 0,
        paymentMethod: 'Asignación manual',
        paymentDate: new Date(),
        status: 'approved',
        transactionId: `MANUAL-PACK-${Date.now()}`,
        paymentDetails: {
          assignedBy: session.user.id,
          assignedAt: new Date(),
          accessGranted: true,
          accessGrantedAt: new Date(),
          coursesIncluded: coursesToAssign.map((c: any) => ({
            courseId: c._id,
            courseTitle: c.title
          })),
          notes: `Pack asignado manualmente por un administrador. Incluye ${coursesToAssign.length} curso${coursesToAssign.length !== 1 ? 's' : ''}.`
        },
        invoiceId,
        invoiceData: {
          invoiceNumber: invoiceId,
          issuedDate: new Date(),
          items: [{
            description: `Pack: ${pack.name}`,
            quantity: 1,
            price: pack.price || 0
          }],
          total: pack.price || 0,
          customer: {
            name: user.name,
            email: user.email,
            id: userId
          }
        }
      });

      await payment.save();
      paymentRecord = payment;
      console.log(`[ASSIGN-PACK] Registro de pago creado para el pack: ${payment._id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Pack asignado correctamente. ${coursesToAssign.length} curso${coursesToAssign.length !== 1 ? 's' : ''} ${coursesToAssign.length !== 1 ? 'agregados' : 'agregado'}.`,
      coursesAssigned: coursesToAssign.length,
      alreadyOwnedCourses: alreadyOwnedCourses.length,
      progressIds: progressRecords.map(p => p._id),
      paymentId: paymentRecord?._id || null,
      details: {
        newCourses: coursesToAssign.map((c: any) => c.title),
        alreadyOwned: alreadyOwnedCourses.map((c: any) => c.title)
      }
    });

  } catch (error) {
    console.error('[ASSIGN-PACK] Error:', error);
    return NextResponse.json({ 
      error: 'Error al asignar acceso al pack',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Endpoint para obtener packs y usuarios para el formulario
export async function GET(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener lista de packs y usuarios para los selectores
    const [packs, users] = await Promise.all([
      Pack.find({ active: true })
        .select('_id name price courses')
        .populate('courses', '_id title')
        .sort({ name: 1 })
        .lean(),
      User.find().select('_id name email role').sort({ name: 1 }).lean()
    ]);

    return NextResponse.json({
      packs,
      users
    });

  } catch (error) {
    console.error('[ASSIGN-PACK] Error al obtener datos:', error);
    return NextResponse.json({ 
      error: 'Error al obtener datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 