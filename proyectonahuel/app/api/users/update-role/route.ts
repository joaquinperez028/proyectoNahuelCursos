import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
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
    
    // Verificar si el usuario actual es administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }
    
    // Obtener datos de la solicitud
    const { userId, newRole } = await request.json();
    
    // Validar los datos
    if (!userId || !newRole || !['admin', 'user'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    
    // Actualizar el rol del usuario
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Rol actualizado correctamente',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 