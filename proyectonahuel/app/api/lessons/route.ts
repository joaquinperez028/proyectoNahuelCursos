import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/lessons?courseId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del curso' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const lessons = await Lesson.find({ courseId })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error al obtener lecciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener lecciones' },
      { status: 500 }
    );
  }
}

// POST /api/lessons
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, videoId, exerciseId, courseId, order } = body;

    if (!name || !videoId || !exerciseId || !courseId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verificar que el curso existe
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const lesson = await Lesson.create({
      name,
      videoId,
      exerciseId,
      courseId,
      order: order || 0
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error al crear lección:', error);
    return NextResponse.json(
      { error: 'Error al crear lección' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/:id
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la lección' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, videoId, exerciseId, order } = body;

    await connectToDatabase();

    const lesson = await Lesson.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(videoId && { videoId }),
        ...(exerciseId && { exerciseId }),
        ...(order !== undefined && { order })
      },
      { new: true }
    );

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error al actualizar lección:', error);
    return NextResponse.json(
      { error: 'Error al actualizar lección' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/:id
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la lección' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const lesson = await Lesson.findByIdAndDelete(id);

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Lección eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar lección:', error);
    return NextResponse.json(
      { error: 'Error al eliminar lección' },
      { status: 500 }
    );
  }
} 