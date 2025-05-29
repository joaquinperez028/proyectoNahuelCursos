import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
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
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener los parámetros de la URL
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const videoId = url.searchParams.get('videoId');
    
    if (!courseId || !videoId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (courseId, videoId)' },
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
          completed: false,
          watchedSeconds: 0,
          lastPosition: 0,
          updatedAt: null
        }
      });
    }
    
    // Buscar el progreso específico de este video
    const videoProgress = progress.videoProgress.find(
      (vp: any) => vp.videoId === videoId
    );
    
    if (!videoProgress) {
      // No hay progreso para este video específico
      return NextResponse.json({
        success: true,
        progress: {
          completed: false,
          watchedSeconds: 0,
          lastPosition: 0,
          updatedAt: null
        }
      });
    }
    
    // Devolver progreso del video específico
    return NextResponse.json({
      success: true,
      progress: {
        completed: videoProgress.completed,
        watchedSeconds: videoProgress.watchedSeconds,
        lastPosition: videoProgress.lastPosition,
        updatedAt: videoProgress.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error al verificar progreso del video:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 