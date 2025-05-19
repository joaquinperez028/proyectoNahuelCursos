import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import Course from '@/models/Course';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Progress from '@/models/Progress';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Subir el archivo a Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convertir el buffer a base64
    const base64Data = buffer.toString('base64');
    const fileType = file.type;
    const dataURI = `data:${fileType};base64,${base64Data}`;
    
    // Generar un ID único para evitar colisiones de nombres
    const uniqueId = uuidv4().substring(0, 8);
    
    // Subir a Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload(
        dataURI,
        {
          folder: 'transferencias',
          resource_type: 'auto',
          public_id: `transfer_${courseId}_${userId}_${uniqueId}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Crear registro de pago pendiente
    const paymentData = {
      userId,
      courseId,
      amount,
      paymentMethod: 'Transferencia',
      status: 'pending', // Siempre iniciar como pendiente hasta aprobación manual
      transactionId: `TRANSFER-${uniqueId}`,
      paymentDetails: {
        receiptUrl: (uploadResult as any).secure_url,
        publicId: (uploadResult as any).public_id,
        approvalStatus: 'pending'
      },
      currency: 'ARS'
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