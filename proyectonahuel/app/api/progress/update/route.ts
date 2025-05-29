import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';

// Definir una interfaz para el error de MongoDB con código
interface MongoError extends Error {
  code?: number;
}

export async function POST(request: NextRequest) {
  console.log('🔄 [API] Recibida solicitud de actualización de progreso');
  
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      console.log('❌ [API] Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('✅ [API] Usuario autenticado:', session.user.email);
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('❌ [API] Usuario no encontrado en BD:', session.user.email);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ [API] Usuario encontrado:', user._id);
    
    const data = await request.json();
    console.log('📊 [API] Datos recibidos:', data);
    
    // Validar datos requeridos
    if (!data.courseId || !data.videoId) {
      console.log('❌ [API] Faltan datos requeridos:', { courseId: data.courseId, videoId: data.videoId });
      return NextResponse.json(
        { error: 'Faltan datos requeridos (courseId, videoId)' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario tiene acceso al curso
    const hasAccess = user.courses.some(
      (id: mongoose.Types.ObjectId) => id.toString() === data.courseId
    );
    
    console.log('🔍 [API] Verificando acceso al curso:', {
      courseId: data.courseId,
      userCourses: user.courses?.map((id: mongoose.Types.ObjectId) => id.toString()),
      hasAccess
    });
    
    if (!hasAccess) {
      console.log('❌ [API] Usuario no tiene acceso al curso');
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }
    
    // Obtener el curso para validar que el video existe
    const course = await Course.findById(data.courseId);
    if (!course) {
      console.log('❌ [API] Curso no encontrado:', data.courseId);
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ [API] Curso encontrado:', {
      courseId: course._id,
      courseTitle: course.title,
      mainVideoId: course.videoId,
      additionalVideos: course.videos?.length || 0
    });
    
    // Verificar si el video pertenece al curso (video principal o videos adicionales)
    const isMainVideo = course.videoId === data.videoId;
    const isAdditionalVideo = course.videos && course.videos.some((video: any) => 
      video.videoId === data.videoId
    );
    
    console.log('🎬 [API] Verificando video:', {
      receivedVideoId: data.videoId,
      isMainVideo,
      isAdditionalVideo,
      mainVideoId: course.videoId,
      additionalVideoIds: course.videos?.map((v: any) => v.videoId) || []
    });
    
    if (!isMainVideo && !isAdditionalVideo) {
      console.log('❌ [API] Video no pertenece al curso');
      return NextResponse.json(
        { error: 'El video no pertenece a este curso' },
        { status: 400 }
      );
    }
    
    // Preparar variables para el progreso del video
    const videoCompleted = data.completed || false;
    const watchedSeconds = data.watchedSeconds || 0;
    const lastPosition = data.position || 0;
    
    // Usar findOneAndUpdate con upsert para crear o actualizar el documento en una sola operación
    // y evitar errores de duplicación
    let result;
    try {
      // Busca un documento existente para verificar si ya existe el video
      let existingProgress = await Progress.findOne({
        userId: user._id,
        courseId: data.courseId
      });
      
      if (!existingProgress) {
        // Si no existe progreso, crear un nuevo documento
        const newProgress = new Progress({
          userId: user._id,
          courseId: data.courseId,
          videoProgress: [{
            videoId: data.videoId,
            completed: videoCompleted,
            watchedSeconds: watchedSeconds,
            lastPosition: lastPosition,
            updatedAt: new Date()
          }],
          totalProgress: videoCompleted ? Math.round(100 / (1 + (course.videos?.length || 0))) : 0,
          isCompleted: false
        });
        
        result = await newProgress.save();
      } else {
        // Si ya existe progreso, actualizar el documento existente
        const videoProgressIndex = existingProgress.videoProgress.findIndex(
          (vp: any) => vp.videoId === data.videoId
        );
        
        if (videoProgressIndex >= 0) {
          // Actualizar video existente
          existingProgress.videoProgress[videoProgressIndex].completed = videoCompleted;
          existingProgress.videoProgress[videoProgressIndex].watchedSeconds = watchedSeconds;
          existingProgress.videoProgress[videoProgressIndex].lastPosition = lastPosition;
          existingProgress.videoProgress[videoProgressIndex].updatedAt = new Date();
        } else {
          // Añadir nuevo video al progreso
          existingProgress.videoProgress.push({
            videoId: data.videoId,
            completed: videoCompleted,
            watchedSeconds: watchedSeconds,
            lastPosition: lastPosition,
            updatedAt: new Date()
          });
        }
        
        // Calcular progreso total del curso
        const totalVideos = 1 + (course.videos?.length || 0); // Video principal + videos adicionales
        const completedVideos = existingProgress.videoProgress.filter((vp: any) => vp.completed).length;
        
        existingProgress.totalProgress = Math.round((completedVideos / totalVideos) * 100);
        
        // Verificar si se completó el curso
        if (existingProgress.totalProgress >= 100 && !existingProgress.isCompleted) {
          existingProgress.isCompleted = true;
          existingProgress.completedAt = new Date();
        }
        
        // Usar save() en lugar de findOneAndUpdate para evitar errores de versión
        result = await existingProgress.save();
      }
    } catch (error) {
      // Convertir el error a un tipo más específico
      const mongoError = error as MongoError;
      
      // Si hay un error de clave duplicada, intentar una vez más
      if (mongoError.code === 11000) {
        // Esperar un momento para evitar una condición de carrera
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          // Obtener el documento y actualizar directamente
          const existingDoc = await Progress.findOne({
            userId: user._id,
            courseId: data.courseId
          });
          
          if (existingDoc) {
            const videoIndex = existingDoc.videoProgress.findIndex(
              (vp: any) => vp.videoId === data.videoId
            );
            
            if (videoIndex >= 0) {
              existingDoc.videoProgress[videoIndex].completed = videoCompleted;
              existingDoc.videoProgress[videoIndex].watchedSeconds = watchedSeconds;
              existingDoc.videoProgress[videoIndex].lastPosition = lastPosition;
              existingDoc.videoProgress[videoIndex].updatedAt = new Date();
            } else {
              existingDoc.videoProgress.push({
                videoId: data.videoId,
                completed: videoCompleted,
                watchedSeconds: watchedSeconds,
                lastPosition: lastPosition,
                updatedAt: new Date()
              });
            }
            
            // Calcular progreso total de nuevo
            const totalVideos = 1 + (course.videos?.length || 0);
            const completedVideos = existingDoc.videoProgress.filter((vp: any) => vp.completed).length;
            
            existingDoc.totalProgress = Math.round((completedVideos / totalVideos) * 100);
            
            if (existingDoc.totalProgress >= 100 && !existingDoc.isCompleted) {
              existingDoc.isCompleted = true;
              existingDoc.completedAt = new Date();
            }
            
            result = await existingDoc.save({ new: true });
          } else {
            throw new Error("No se pudo encontrar el documento de progreso");
          }
        } catch (retryError) {
          console.error('Error en segundo intento de actualización:', retryError);
          return NextResponse.json(
            { error: 'Error al procesar la solicitud después de múltiples intentos' },
            { status: 500 }
          );
        }
      } else {
        console.error('Error al actualizar progreso:', error);
        return NextResponse.json(
          { error: 'Error al procesar la solicitud' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      progress: {
        totalProgress: result.totalProgress,
        isCompleted: result.isCompleted,
        completedAt: result.completedAt,
        certificateIssued: result.certificateIssued,
        certificateUrl: result.certificateUrl
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