import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import { Types } from "mongoose";
import { authOptions } from "../auth/[...nextauth]/options";

// POST /api/enroll - Inscribir a un usuario en un curso
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
    
    // Validar datos
    if (!data.courseId) {
      return NextResponse.json(
        { error: 'Falta el ID del curso' },
        { status: 400 }
      );
    }
    
    // Verificar si el curso existe
    const course = await Course.findById(data.courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario ya está inscrito en el curso
    const alreadyEnrolled = user.courses.some(
      (courseId: Types.ObjectId) => courseId.toString() === data.courseId
    );
    
    if (alreadyEnrolled) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este curso' },
        { status: 400 }
      );
    }
    
    // Aquí se implementaría la integración con pasarela de pagos
    // Por ahora, simplemente añadimos el curso al usuario
    
    // Añadir el curso al usuario
    user.courses.push(course._id);
    await user.save();
    
    return NextResponse.json({
      message: 'Inscripción exitosa',
      course: {
        _id: course._id,
        title: course.title,
      }
    });
  } catch (error) {
    console.error('Error al inscribir al usuario en el curso:', error);
    return NextResponse.json(
      { error: 'Error al realizar la inscripción' },
      { status: 500 }
    );
  }
} 