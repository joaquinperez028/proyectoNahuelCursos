import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';
import Review from '@/models/Review';

// Endpoint para crear reseñas falsas (solo administradores)
export async function POST(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDatabase();

    // Obtener datos del cuerpo de la solicitud
    const { fakeUserName, courseId, rating, comment } = await request.json();

    if (!fakeUserName?.trim() || !courseId || !rating || !comment?.trim() || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Todos los campos son requeridos y la calificación debe estar entre 1 y 5' }, { status: 400 });
    }

    // Verificar si el curso existe
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe una reseña falsa con el mismo nombre para este curso
    const existingReview = await Review.findOne({
      isFakeUser: true,
      fakeUserName: fakeUserName.trim(),
      courseId,
    });

    if (existingReview) {
      return NextResponse.json({ 
        error: `Ya existe una reseña de "${fakeUserName.trim()}" para el curso "${course.title}"` 
      }, { status: 400 });
    }

    // Crear la reseña falsa
    const newReview = await Review.create({
      rating: parseInt(rating),
      comment: comment.trim(),
      courseId,
      isFakeUser: true,
      fakeUserName: fakeUserName.trim(),
    });

    // Añadir la reseña al curso si no está ya en el array
    if (!course.reviews.includes(newReview._id)) {
      course.reviews.push(newReview._id);
      await course.save();
    }

    // Poblar la reseña con los datos del curso para devolver información completa
    await newReview.populate('courseId', 'title');

    console.log(`[CREATE-FAKE-REVIEW] Reseña falsa creada: ${newReview._id} por admin ${session.user.id} (usuario falso: ${fakeUserName.trim()})`);

    return NextResponse.json({
      success: true,
      message: 'Reseña falsa creada correctamente',
      review: newReview
    });

  } catch (error) {
    console.error('[CREATE-FAKE-REVIEW] Error:', error);
    return NextResponse.json({ 
      error: 'Error al crear la reseña falsa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Endpoint para obtener cursos para el formulario
export async function GET(request: Request) {
  try {
    // Verificar que sea un administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDatabase();

    // Obtener lista de cursos para el selector
    const courses = await Course.find().select('_id title').sort({ title: 1 }).lean();

    return NextResponse.json({
      courses
    });

  } catch (error) {
    console.error('[CREATE-FAKE-REVIEW] Error al obtener datos:', error);
    return NextResponse.json({ 
      error: 'Error al obtener datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 