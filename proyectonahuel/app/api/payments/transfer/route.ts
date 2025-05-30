import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import Pack from '@/models/Pack';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Progress from '@/models/Progress';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, getAdminNotificationTemplate } from '@/lib/email';

// Función para enviar email al administrador
async function sendAdminNotification(payment: any, user: any, item: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('No se encontró el email del administrador');
    return;
  }

  const itemType = payment.packId ? 'pack' : 'curso';
  const itemTitle = payment.packId ? item.name : item.title;
  const amount = payment.amount;
  const isPackage = payment.packId ? true : false;

  const subject = `🔔 Nuevo pago por transferencia - ${itemType}: ${itemTitle}`;
  const htmlContent = getAdminNotificationTemplate(
    user.name || 'Usuario sin nombre',
    user.email,
    itemTitle,
    amount,
    isPackage
  );

  try {
    await sendEmail(adminEmail, subject, htmlContent);
    console.log('Email de notificación enviado al administrador');
  } catch (error) {
    console.error('Error al enviar email al administrador:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    console.log('Sesión:', session);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Procesar la solicitud como FormData
    const formData = await request.formData();
    
    // Obtener los archivos y datos
    const file = formData.get('file') as File;
    const courseId = formData.get('courseId') as string;
    const packId = formData.get('packId') as string;
    const userId = formData.get('userId') as string;
    const amountStr = formData.get('amount') as string;

    // Log de datos recibidos
    console.log('Datos recibidos:', {
      hasFile: !!file,
      fileType: file?.type,
      fileSize: file?.size,
      courseId,
      packId,
      userId,
      amountStr
    });

    // Validaciones básicas
    if (!file) {
      return NextResponse.json({ error: 'Por favor, sube un comprobante de pago' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 400 });
    }

    if (!amountStr || isNaN(parseFloat(amountStr))) {
      return NextResponse.json({ error: 'El monto del pago es inválido' }, { status: 400 });
    }

    if (!courseId && !packId) {
      return NextResponse.json({ error: 'Debe especificar un curso o pack para la compra' }, { status: 400 });
    }

    const amount = parseFloat(amountStr);

    // Validación de tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato de archivo no válido. Por favor, sube un archivo JPG, PNG o PDF' }, { status: 400 });
    }

    // Validación de tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo es demasiado grande. El tamaño máximo es 5MB' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar el item (curso o pack) y su precio
    let itemType = 'course';
    let itemPrice = 0;
    let itemId = courseId;

    if (packId) {
      itemType = 'pack';
      itemId = packId;
      const pack = await Pack.findById(packId).populate('courses', 'title');
      if (!pack) {
        return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
      }
      
      // Verificar elegibilidad del usuario para el pack
      const userCourseIds = user.courses.map((id: any) => id.toString());
      const ownedCourses = pack.courses.filter((course: any) => 
        userCourseIds.includes(course._id.toString())
      );
      
      if (ownedCourses.length > 0) {
        return NextResponse.json({ 
          error: 'No podés comprar un pack de cursos si ya poseés uno de los cursos incluidos.' 
        }, { status: 400 });
      }
      
      itemPrice = pack.price;
      console.log('Pack encontrado:', { id: pack._id, price: pack.price });
    } else {
      const course = await Course.findById(courseId);
      if (!course) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      itemPrice = course.onSale && course.discountPercentage > 0
        ? course.price - (course.price * (course.discountPercentage / 100))
        : course.price;
      console.log('Curso encontrado:', { id: course._id, price: itemPrice });
    }

    // Verificar que el monto coincida
    if (Math.abs(amount - itemPrice) > 0.01) { // Permitir una pequeña diferencia por redondeo
      console.log('Error de monto:', { amount, itemPrice, difference: Math.abs(amount - itemPrice) });
      return NextResponse.json({ 
        error: `El monto del pago (${amount}) no coincide con el precio del ${itemType === 'pack' ? 'pack' : 'curso'} (${itemPrice})` 
      }, { status: 400 });
    }

    // Procesar el archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const fileType = file.type;
    const fileName = file.name;
    const uniqueId = uuidv4();

    // Crear registro de pago pendiente
    const paymentData = {
      userId,
      amount,
      paymentMethod: 'Transferencia',
      status: 'pending',
      transactionId: `TRANSFER-${uniqueId}`,
      paymentDetails: {
        receiptData: base64Data,
        fileType: fileType,
        fileName: fileName,
        fileSize: file.size,
        uploadDate: new Date(),
        approvalStatus: 'pending'
      },
      currency: 'ARS',
      createdAt: new Date(),
      packId: itemType === 'pack' ? itemId : undefined,
      courseId: itemType === 'pack' ? undefined : itemId
    };

    // Guardar en la base de datos
    const payment = await Payment.create(paymentData);
    console.log('Pago creado:', payment._id);

    // Obtener información del usuario y del item para el email
    let item;
    if (itemType === 'pack') {
      item = await Pack.findById(itemId);
    } else {
      item = await Course.findById(itemId);
    }

    // Enviar notificación al administrador
    if (user && item) {
      await sendAdminNotification(payment, user, item);
    }

    // Retornar éxito
    return NextResponse.json({ 
      success: true,
      message: 'Comprobante recibido. Tu pago está siendo procesado.' 
    });
    
  } catch (error) {
    console.error('Error al procesar pago por transferencia:', error);
    return NextResponse.json({ 
      error: 'Error al procesar el pago por transferencia. Por favor, intenta nuevamente.' 
    }, { status: 500 });
  }
} 