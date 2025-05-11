import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/options";

// POST /api/courses/update-playback-id
// Actualiza el playbackId de un curso específico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar cursos' },
        { status: 403 }
      );
    }
    
    // Obtener los datos del request
    const data = await request.json();
    const { courseId, playbackId } = data;
    
    if (!courseId || !playbackId) {
      return NextResponse.json(
        { error: 'Se requieren courseId y playbackId' },
        { status: 400 }
      );
    }
    
    // Buscar el curso
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Guardar el playbackId anterior
    const oldPlaybackId = course.playbackId;
    
    // Actualizar el playbackId
    course.playbackId = playbackId;
    await course.save();
    
    return NextResponse.json({
      success: true,
      message: 'PlaybackID actualizado correctamente',
      course: {
        id: course._id,
        title: course.title,
        oldPlaybackId,
        newPlaybackId: playbackId
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar playbackId:', error);
    return NextResponse.json(
      { error: 'Error al actualizar playbackId', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 