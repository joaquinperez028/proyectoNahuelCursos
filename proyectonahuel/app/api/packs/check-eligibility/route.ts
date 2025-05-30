import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Pack from '@/models/Pack';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId');
    
    if (!packId) {
      return NextResponse.json(
        { error: 'ID de pack no proporcionado' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Obtener usuario
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener pack con sus cursos
    const pack = await Pack.findById(packId).populate('courses', 'title');
    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario ya tiene algún curso del pack
    const userCourseIds = user.courses.map((id: any) => id.toString());
    const packCourseIds = pack.courses.map((course: any) => course._id.toString());
    
    // Encontrar cursos que ya posee
    const ownedCourses = pack.courses.filter((course: any) => 
      userCourseIds.includes(course._id.toString())
    );
    
    const isEligible = ownedCourses.length === 0;
    
    return NextResponse.json({
      isEligible,
      ownedCourses: ownedCourses.map((course: any) => ({
        _id: course._id,
        title: course.title
      })),
      message: isEligible 
        ? 'El usuario puede comprar este pack' 
        : 'No podés comprar un pack de cursos si ya poseés uno de los cursos incluidos.'
    });
    
  } catch (error) {
    console.error('Error al verificar elegibilidad del pack:', error);
    return NextResponse.json(
      { error: 'Error al verificar elegibilidad' },
      { status: 500 }
    );
  }
} 