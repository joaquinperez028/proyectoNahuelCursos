import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import User from '@/models/User';
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
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener el ID del curso de los query parameters
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Falta el ID del curso' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario tiene acceso al curso
    const hasAccess = user.courses.some(
      (id: mongoose.Types.ObjectId) => id.toString() === courseId
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }
    
    // Buscar progreso del usuario para este curso
    const progress = await Progress.findOne({
      userId: user._id,
      courseId
    });
    
    if (!progress) {
      // No hay progreso registrado, devolver valores predeterminados
      return NextResponse.json({
        success: true,
        progress: {
          totalProgress: 0,
          isCompleted: false,
          completedAt: null,
          certificateIssued: false,
          certificateUrl: null
        }
      });
    }
    
    // Devolver progreso
    return NextResponse.json({
      success: true,
      progress: {
        totalProgress: progress.totalProgress,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        certificateIssued: progress.certificateIssued,
        certificateUrl: progress.certificateUrl
      }
    });
    
  } catch (error) {
    console.error('Error al verificar progreso:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 