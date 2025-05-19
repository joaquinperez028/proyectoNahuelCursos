import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Progress from '@/models/Progress';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Procesar la solicitud como FormData
    const formData = await request.formData();
    
    // Obtener los archivos y datos
    const file = formData.get('file') as File;
    const courseId = formData.get('courseId') as string;
    const userId = formData.get('userId') as string;
    const amount = parseFloat(formData.get('amount') as string);

    // Validaciones
    if (!file) {
      return NextResponse.json({ error: 'Falta el comprobante de pago' }, { status: 400 });
    }

    // Validación de tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato de archivo no válido. Por favor, sube un archivo JPG, PNG o PDF' }, { status: 400 });
    }

    // Validación de tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo es demasiado grande. El tamaño máximo es 5MB' }, { status: 400 });
    }

    if (!courseId || !userId || isNaN(amount)) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el curso existe
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario no tenga ya acceso al curso
    const existingProgress = await Progress.findOne({ courseId, userId });
    if (existingProgress) {
      return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 400 });
    }

    // Procesar el archivo para almacenarlo en MongoDB
    let base64Data;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Convertir el buffer a base64 para almacenamiento en MongoDB
      base64Data = buffer.toString('base64');
      
      // Verificar que la conversión fue exitosa
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Error al procesar el archivo');
      }
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      return NextResponse.json({ 
        error: 'Error al procesar el archivo. Por favor, intenta con otro archivo o un formato diferente.' 
      }, { status: 500 });
    }
    
    const fileType = file.type;
    const fileName = file.name;
    
    // Generar un ID único para la transacción
    const uniqueId = uuidv4().substring(0, 8);
    
    // Crear registro de pago pendiente
    const paymentData = {
      userId,
      courseId,
      amount,
      paymentMethod: 'Transferencia',
      status: 'pending', // Siempre iniciar como pendiente hasta aprobación manual
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
      createdAt: new Date()
    };

    // Guardar en la base de datos
    await Payment.create(paymentData);

    // Nota: No se crea el progreso ni se da acceso hasta que un admin apruebe

    // Retornar éxito
    return NextResponse.json({ 
      success: true,
      message: 'Comprobante recibido. Tu pago está siendo procesado.' 
    });
    
  } catch (error) {
    console.error('Error al procesar pago por transferencia:', error);
    return NextResponse.json({ 
      error: 'Error al procesar el pago por transferencia' 
    }, { status: 500 });
  }
} 