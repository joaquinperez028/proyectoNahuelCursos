import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Progress from '@/models/Progress';

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Iniciando solicitud DELETE /api/users/delete');
    
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      console.log('API: Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión para acceder a estos datos.' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Verificar si el usuario actual es administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      console.log('API: El usuario no tiene permisos de administrador');
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }
    
    // Obtener ID del usuario a eliminar
    const { userId } = await request.json();
    
    if (!userId) {
      console.log('API: ID de usuario no proporcionado');
      return NextResponse.json(
        { error: 'ID de usuario no proporcionado' },
        { status: 400 }
      );
    }
    
    // Verificar que no esté intentando eliminar a un administrador
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      console.log('API: Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    if (userToDelete.role === 'admin') {
      console.log('API: Intento de eliminar a un administrador');
      return NextResponse.json(
        { error: 'No se puede eliminar a un usuario con rol de administrador' },
        { status: 403 }
      );
    }
    
    // Eliminar registros de progreso asociados al usuario
    await Progress.deleteMany({ userId });
    
    // Eliminar al usuario
    await User.findByIdAndDelete(userId);
    
    console.log('API: Usuario eliminado correctamente:', userId);
    
    return NextResponse.json({
      message: 'Usuario eliminado correctamente',
      userId
    });
    
  } catch (error) {
    console.error('API: Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 