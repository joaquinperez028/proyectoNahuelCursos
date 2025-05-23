import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para subir documentos' },
        { status: 403 }
      );
    }
    
    // Procesar el archivo PDF
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún documento' },
        { status: 400 }
      );
    }
    
    // Validar el tipo de archivo
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      );
    }
    
    // Limitar el tamaño del archivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (pdfFile.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. El límite es de 10MB.' },
        { status: 400 }
      );
    }
    
    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Devolver los datos del PDF
    return NextResponse.json({
      success: true,
      fileData: {
        data: buffer.toString('base64'),
        contentType: pdfFile.type,
        name: pdfFile.name,
        size: pdfFile.size
      }
    });
  } catch (error) {
    console.error('Error al subir PDF:', error);
    return NextResponse.json(
      { error: 'Error al procesar el documento' },
      { status: 500 }
    );
  }
} 