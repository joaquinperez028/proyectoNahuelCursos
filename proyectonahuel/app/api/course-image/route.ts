import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Obtener el ID del curso de los query parameters
    const url = new URL(request.url);
    const courseId = url.searchParams.get('id');
    
    if (!courseId) {
      return new NextResponse(JSON.stringify({ error: 'Falta el ID del curso' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Buscar el curso
    const course = await Course.findById(courseId);
    
    if (!course) {
      return new NextResponse(JSON.stringify({ error: 'Curso no encontrado' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Verificar si hay una imagen
    if (!course.thumbnailImage || !course.thumbnailImage.data) {
      return new NextResponse(JSON.stringify({ error: 'Este curso no tiene una imagen almacenada' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Obtener el tipo de contenido
    const contentType = course.thumbnailImage.contentType || 'image/jpeg';
    
    // Crear una respuesta con la imagen
    const imageBuffer = course.thumbnailImage.data;
    
    // Configurar la respuesta con la imagen
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Caché de 1 año
      },
    });
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener la imagen' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 