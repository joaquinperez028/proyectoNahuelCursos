import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from '@/lib/mongodb';
import Review from "@/models/Review";
import Course from "@/models/Course";
import User from "@/models/User";
import { Types } from "mongoose";
import { authOptions } from "../auth/[...nextauth]/options";

// POST /api/reviews - Crear una nueva reseña
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos
    if (!data.courseId || !data.rating || !data.comment) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    if (data.rating < 1 || data.rating > 5) {
      return NextResponse.json(
        { error: 'La puntuación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }
    
    // Verificar si el curso existe
    const course = await Course.findById(data.courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario ya ha hecho una reseña del curso
    const existingReview = await Review.findOne({
      userId: user._id,
      courseId: data.courseId,
    });
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya has escrito una reseña para este curso' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ha comprado el curso
    const userHasCourse = user.courses.some(
      (courseId: Types.ObjectId) => courseId.toString() === data.courseId
    );
    
    if (!userHasCourse && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo puedes escribir reseñas de cursos que has comprado' },
        { status: 403 }
      );
    }
    
    // Crear la reseña
    const newReview = await Review.create({
      rating: data.rating,
      comment: data.comment,
      userId: user._id,
      courseId: data.courseId,
    });
    
    // Añadir la reseña al curso
    course.reviews.push(newReview._id);
    await course.save();
    
    await newReview.populate('userId', 'name image');
    
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error al crear la reseña:', error);
    return NextResponse.json(
      { error: 'Error al crear la reseña' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const reviews = await Review.find({})
      .populate({ path: 'userId', select: 'name image' })
      .populate({ path: 'courseId', select: 'title' })
      .sort({ createdAt: -1 });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
} 