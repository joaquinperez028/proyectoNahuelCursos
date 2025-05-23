import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

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
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
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
    
    const hasCourse = user.courses.some((id: any) => 
      id && typeof id.toString === 'function' && id.toString() === courseId
    );
    
    return NextResponse.json({
      hasCourse
    });
    
  } catch (error) {
    console.error('Error al verificar compra:', error);
    return NextResponse.json(
      { error: 'Error al verificar compra' },
      { status: 500 }
    );
  }
} 