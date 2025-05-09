import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const courseId = context.params.id;
    
    // Buscar el curso
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si hay una imagen
    if (!course.thumbnailImage || !course.thumbnailImage.data) {
      return NextResponse.json(
        { error: 'Este curso no tiene una imagen almacenada' },
        { status: 404 }
      );
    }
    
    // Obtener el tipo de contenido
    const contentType = course.thumbnailImage.contentType || 'image/jpeg';
    
    // Crear una respuesta con la imagen
    const imageBuffer = course.thumbnailImage.data;
    
    // Configurar la respuesta con la imagen
    const response = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Caché de 1 año
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    return NextResponse.json(
      { error: 'Error al obtener la imagen' },
      { status: 500 }
    );
  }
} 