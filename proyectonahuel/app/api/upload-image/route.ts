import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
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
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para subir imágenes' },
        { status: 403 }
      );
    }
    
    // Procesar la imagen
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ninguna imagen' },
        { status: 400 }
      );
    }
    
    // Validar el tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Se permiten: JPG, PNG, WEBP, GIF' },
        { status: 400 }
      );
    }
    
    // Limitar el tamaño del archivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. El límite es de 5MB.' },
        { status: 400 }
      );
    }
    
    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Devolver los datos de la imagen
    return NextResponse.json({
      success: true,
      imageData: {
        data: buffer.toString('base64'),
        contentType: imageFile.type
      }
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
} 