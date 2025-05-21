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
    const requiredRole = searchParams.get('role');
    
    if (!requiredRole) {
      return NextResponse.json(
        { error: 'Rol no proporcionado' },
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
    
    return NextResponse.json({
      hasRole: user.role === requiredRole
    });
    
  } catch (error) {
    console.error('Error al verificar rol:', error);
    return NextResponse.json(
      { error: 'Error al verificar rol' },
      { status: 500 }
    );
  }
} 