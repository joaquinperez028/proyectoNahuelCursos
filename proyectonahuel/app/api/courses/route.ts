import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import { createMuxAsset } from "@/lib/mux";
import Course from "@/models/Course";
import User from "@/models/User";

// GET /api/courses - Obtener todos los cursos
export async function GET() {
  try {
    await connectDB();
    
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Crear un nuevo curso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
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
        { error: 'No tienes permisos para crear cursos' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos
    if (!data.title || !data.description || !data.price || !data.videoUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Crear asset en MUX
    const { assetId, playbackId } = await createMuxAsset(data.videoUrl);
    
    if (!assetId || !playbackId) {
      return NextResponse.json(
        { error: 'Error al procesar el video en MUX' },
        { status: 500 }
      );
    }
    
    // Crear el curso en la base de datos
    const newCourse = await Course.create({
      title: data.title,
      description: data.description,
      price: data.price,
      videoId: assetId,
      playbackId: playbackId,
      thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
      createdBy: user._id,
      reviews: [],
    });
    
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