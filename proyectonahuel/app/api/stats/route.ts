import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Review from '@/models/Review';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Obtener conteo de estudiantes (usuarios con rol 'user')
    const studentsCount = await User.countDocuments({ role: 'user' });
    
    // Obtener conteo de cursos
    const coursesCount = await Course.countDocuments();
    
    // Obtener conteo de instructores (creadores de cursos únicos)
    const instructors = await Course.distinct('createdBy');
    const instructorsCount = instructors.length;
    
    // Calcular tasa de satisfacción basada en reseñas
    const reviews = await Review.find();
    
    let satisfactionRate = 0;
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      // Convertir a porcentaje (5 estrellas = 100%)
      satisfactionRate = Math.round((averageRating / 5) * 100);
    }
    
    return NextResponse.json({
      students: studentsCount,
      courses: coursesCount,
      instructors: instructorsCount,
      satisfactionRate: satisfactionRate || 98 // Valor por defecto si no hay reseñas
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 