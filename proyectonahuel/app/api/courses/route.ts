import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { createMuxAsset } from "@/lib/mux";
import Course from "@/models/Course";
import User from "@/models/User";
import { authOptions } from "../auth/[...nextauth]/options";

// GET /api/courses - Obtener todos los cursos
export async function GET() {
  try {
    await connectToDatabase();
    
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error al obtener cursoss:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Crear un nuevo curso
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
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear cursos' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos
    if (!data.title || !data.description || !data.videoUrl || !data.category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Validar precio solo si no es gratuito
    if (!data.isFree && (!data.price || data.price <= 0)) {
      return NextResponse.json(
        { error: 'El precio es requerido para cursos pagos' },
        { status: 400 }
      );
    }
    
    // Validar que la categoría sea una de las permitidas
    const categoriasValidas = ['Análisis Técnico', 'Análisis Fundamental', 'Estrategias de Trading', 'Finanzas Personales'];
    if (!categoriasValidas.includes(data.category)) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      );
    }
    
    // Usar playbackId/videoId si ya existen, solo crear asset si faltan
    let assetId = data.videoId;
    let playbackId = data.playbackId;
    // Si la URL es de MUX y no se pasó playbackId, extraerlo de la URL
    if (!playbackId && typeof data.videoUrl === 'string' && data.videoUrl.includes('stream.mux.com')) {
      const match = data.videoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9]+)\./);
      if (match && match[1]) {
        playbackId = match[1];
      }
    }
    if (!assetId || !playbackId) {
      const muxAsset = await createMuxAsset(data.videoUrl);
      assetId = muxAsset.assetId;
      playbackId = muxAsset.playbackId;
    }
    if (!assetId || !playbackId) {
      return NextResponse.json(
        { error: 'Error al procesar el video en MUX' },
        { status: 500 }
      );
    }
    
    // Preparar datos del curso
    const courseData: any = {
      title: data.title,
      description: data.description,
      price: data.isFree ? 0 : data.price,
      isFree: data.isFree || false,
      category: data.category,
      videoId: assetId,
      playbackId: playbackId,
      createdBy: user._id,
      reviews: [],
    };
    
    // Si hay una imagen personalizada, agregarla
    if (data.thumbnailImage) {
      courseData.thumbnailImage = {
        data: Buffer.from(data.thumbnailImage.data, 'base64'),
        contentType: data.thumbnailImage.contentType
      };
      // También establecemos la URL como null para indicar que usamos la imagen almacenada
      courseData.thumbnailUrl = null;
    } else {
      // Si no hay imagen personalizada, usar un fotograma de MUX
      courseData.thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
    }
    
    // Agregar datos del video de introducción si están disponibles
    if (data.introPlaybackId) {
      courseData.introVideoId = data.introVideoId || '';
      courseData.introPlaybackId = data.introPlaybackId;
      
      // Si no hay una miniatura específica y no hay imagen personalizada, usar un fotograma del video de introducción
      if (!courseData.thumbnailUrl && !data.thumbnailImage) {
        courseData.thumbnailUrl = `https://image.mux.com/${data.introPlaybackId}/thumbnail.jpg`;
      }
    }
    
    // Agregar videos adicionales si existen
    if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
      courseData.videos = data.videos.map((video: any) => ({
        title: video.title,
        description: video.description || '',
        videoId: video.videoId,
        playbackId: video.playbackId,
        order: video.order || 0
      }));
    } else {
      courseData.videos = [];
    }
    
    // Agregar ejercicios si existen
    if (data.exercises && Array.isArray(data.exercises) && data.exercises.length > 0) {
      courseData.exercises = data.exercises.map((exercise: any) => {
        // Crear objeto de ejercicio
        const exerciseData: any = {
          title: exercise.title,
          description: exercise.description || '',
          order: exercise.order || 0
        };
        
        // Agregar datos del archivo PDF si existen
        if (exercise.fileData) {
          exerciseData.fileData = {
            data: Buffer.from(exercise.fileData.data, 'base64'),
            contentType: exercise.fileData.contentType
          };
        }
        
        return exerciseData;
      });
    } else {
      courseData.exercises = [];
    }
    
    // Crear el curso en la base de datos
    const newCourse = await Course.create(courseData);
    
    await newCourse.populate('createdBy', 'name');
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error al crear el curso:', error);
    return NextResponse.json(
      { error: 'Error al crear el curso' },
      { status: 500 }
    );
  }
} 