import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Review from '@/models/Review';
import User from '@/models/User';
import Course from '@/models/Course';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Obtener las mejores reseñas (rating alto y con comentarios sustanciales)
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .populate('userId', 'name image')
      .populate('courseId', 'title');
    
    // Formatear los testimonios para mostrarlos en la landing page
    const testimonials = reviews.map(review => ({
      id: review._id.toString(),
      name: review.userId.name,
      imageUrl: review.userId.image || null,
      courseName: review.courseId.title,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt
    }));
    
    return NextResponse.json(testimonials);
    
  } catch (error) {
    console.error('Error al obtener testimonios:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 