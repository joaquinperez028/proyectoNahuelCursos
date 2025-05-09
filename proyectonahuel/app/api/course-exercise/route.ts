import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const exerciseId = url.searchParams.get('exerciseId');
    const id = url.searchParams.get('id'); // Nuevo parámetro que puede ser usado directamente
    
    let exercise = null;
    let filename = '';
    
    // Caso 1: Buscar por ID único del ejercicio
    if (id) {
      const objectId = new mongoose.Types.ObjectId(id);
      
      // Buscar el curso que contiene este ejercicio
      const courseWithExercise = await Course.findOne({
        'exercises._id': objectId
      });
      
      if (!courseWithExercise) {
        return new NextResponse(JSON.stringify({ error: 'Ejercicio no encontrado' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Encontrar el ejercicio en el array de ejercicios
      exercise = courseWithExercise.exercises.find((ex: any) => 
        ex._id.toString() === id
      );
      
      // Usar el título como nombre de archivo o una alternativa
      filename = exercise.title 
        ? `${exercise.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
        : `ejercicio_${id}.pdf`;
    }
    // Caso 2: Buscar por courseId + exerciseId (método original)
    else if (courseId && exerciseId) {
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
      exercise = course.exercises?.find((ex: any) => ex._id.toString() === exerciseId);
      filename = `ejercicio_${exerciseId}.pdf`;
    } 
    else {
      return new NextResponse(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Verificar si se encontró el ejercicio y tiene datos
    if (!exercise || !exercise.fileData || !exercise.fileData.data) {
      return new NextResponse(JSON.stringify({ error: 'Ejercicio no encontrado o sin archivo adjunto' }), {
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