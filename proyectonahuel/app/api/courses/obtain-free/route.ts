import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 });
    }

    await connectToDatabase();

    // Verificar que el curso existe y es gratuito
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    if (!course.isFree) {
      return NextResponse.json({ error: 'Este curso no es gratuito' }, { status: 400 });
    }

    // Verificar que el usuario no ya tiene el curso
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.courses.includes(courseId)) {
      return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 400 });
    }

    // Agregar el curso al usuario
    user.courses.push(courseId);
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Curso obtenido exitosamente' 
    });

  } catch (error) {
    console.error('Error al obtener curso gratuito:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 