import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
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
    
    const courseIds = user.courses || [];
    
    // Si el usuario no tiene cursos, devolver un array vacío
    if (courseIds.length === 0) {
      return NextResponse.json({ courses: [] });
    }
    
    // Obtener detalles de los cursos
    const courses = await Course.find({
      _id: { $in: courseIds }
    }).populate('createdBy', 'name image').lean();
    
    // Formatear los cursos para la respuesta
    const formattedCourses = courses.map((course: any) => ({
      _id: course._id ? course._id.toString() : '',
      title: course.title || 'Sin título',
      description: course.description || '',
      price: course.price || 0,
      thumbnailUrl: course.thumbnailUrl || '',
      playbackId: course.playbackId || '',
      videoId: course.videoId || '',
      duration: course.duration || 0,
      createdBy: course.createdBy ? {
        _id: course.createdBy._id ? course.createdBy._id.toString() : '',
        name: course.createdBy.name || 'Desconocido.',
        image: course.createdBy.image || ''
      } : null,
      createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString()
    }));
    
    return NextResponse.json({ courses: formattedCourses });
    
  } catch (error) {
    console.error('Error al obtener cursos del usuario:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 