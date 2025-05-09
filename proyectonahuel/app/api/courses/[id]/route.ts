import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import { deleteMuxAsset } from "@/lib/mux";
import Course from "@/models/Course";
import User from "@/models/User";
import Review from "@/models/Review";

// GET /api/courses/[id] - Obtener un curso específico
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const course = await Course.findById(context.params.id)
      .populate('createdBy', 'name')
      .lean();
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener reseñas
    const reviews = await Review.find({ courseId: context.params.id })
      .populate('userId', 'name image')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      ...course,
      reviews,
    });
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Actualizar un curso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'No tienes permisos para editar cursos' },
        { status: 403 }
      );
    }
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Actualizar el curso
    Object.assign(course, {
      title: data.title || course.title,
      description: data.description || course.description,
      price: data.price || course.price,
    });
    
    await course.save();
    await course.populate('createdBy', 'name');
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error al actualizar el curso:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el curso' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Eliminar un curso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'No tienes permisos para eliminar cursos' },
        { status: 403 }
      );
    }
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Eliminar asset de MUX
    if (course.videoId) {
      await deleteMuxAsset(course.videoId);
    }
    
    // Eliminar reseñas del curso
    await Review.deleteMany({ courseId: params.id });
    
    // Eliminar el curso
    await Course.findByIdAndDelete(params.id);
    
    return NextResponse.json(
      { message: 'Curso eliminado correctamente' }
    );
  } catch (error) {
    console.error('Error al eliminar el curso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
} 