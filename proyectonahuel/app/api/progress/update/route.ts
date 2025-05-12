import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';

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
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.courseId || !data.videoId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (courseId, videoId)' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario tiene acceso al curso
    const hasAccess = user.courses.some(
      (id: mongoose.Types.ObjectId) => id.toString() === data.courseId
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }
    
    // Obtener el curso para validar que el video existe
    const course = await Course.findById(data.courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el video pertenece al curso (video principal o videos adicionales)
    const isMainVideo = course.videoId === data.videoId;
    const isAdditionalVideo = course.videos.some((video: any) => 
      video.videoId === data.videoId
    );
    
    if (!isMainVideo && !isAdditionalVideo) {
      return NextResponse.json(
        { error: 'El video no pertenece a este curso' },
        { status: 400 }
      );
    }
    
    // Buscar o crear registro de progreso para este usuario y curso
    let progress = await Progress.findOne({
      userId: user._id,
      courseId: data.courseId
    });
    
    if (!progress) {
      progress = new Progress({
        userId: user._id,
        courseId: data.courseId,
        videoProgress: []
      });
    }
    
    // Actualizar o añadir progreso del video
    const videoProgressIndex = progress.videoProgress.findIndex(
      (vp: any) => vp.videoId === data.videoId
    );
    
    const videoCompleted = data.completed || false;
    const watchedSeconds = data.watchedSeconds || 0;
    const lastPosition = data.position || 0;
    
    if (videoProgressIndex >= 0) {
      // Actualizar video existente
      progress.videoProgress[videoProgressIndex].completed = videoCompleted;
      progress.videoProgress[videoProgressIndex].watchedSeconds = watchedSeconds;
      progress.videoProgress[videoProgressIndex].lastPosition = lastPosition;
      progress.videoProgress[videoProgressIndex].updatedAt = new Date();
    } else {
      // Añadir nuevo video al progreso
      progress.videoProgress.push({
        videoId: data.videoId,
        completed: videoCompleted,
        watchedSeconds: watchedSeconds,
        lastPosition: lastPosition,
        updatedAt: new Date()
      });
    }
    
    // Calcular progreso total del curso
    const totalVideos = 1 + (course.videos?.length || 0); // Video principal + videos adicionales
    const completedVideos = progress.videoProgress.filter((vp: any) => vp.completed).length;
    
    progress.totalProgress = Math.round((completedVideos / totalVideos) * 100);
    
    // Verificar si se completó el curso
    if (progress.totalProgress >= 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
    
    await progress.save();
    
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
    console.error('Error al actualizar progreso:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 