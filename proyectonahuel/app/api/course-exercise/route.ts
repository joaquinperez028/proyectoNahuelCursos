import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const exerciseId = url.searchParams.get('exerciseId');
    
    if (!courseId || !exerciseId) {
      return new NextResponse(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
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
    
    // Buscar el ejercicio en el curso
    const exercise = course.exercises?.find((ex: any) => ex._id.toString() === exerciseId);
    
    if (!exercise || !exercise.fileData || !exercise.fileData.data) {
      return new NextResponse(JSON.stringify({ error: 'Ejercicio no encontrado' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Obtener el tipo de contenido
    const contentType = exercise.fileData.contentType || 'application/pdf';
    
    // Crear una respuesta con el PDF
    const fileBuffer = exercise.fileData.data;
    
    // Configurar el header para descarga
    const filename = `ejercicio_${exerciseId}.pdf`;
    
    // Configurar la respuesta con el PDF para descarga
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener el ejercicio' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 