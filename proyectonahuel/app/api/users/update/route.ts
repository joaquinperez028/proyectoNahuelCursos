import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Iniciando solicitud PUT /api/users/update');
    
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      console.log('API: Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión para acceder a estos datos.' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Verificar si el usuario actual es administrador
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      console.log('API: El usuario no tiene permisos de administrador');
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }
    
    // Obtener datos de la solicitud
    const { userId, userData } = await request.json();
    
    if (!userId || !userData) {
      console.log('API: Datos insuficientes para la actualización');
      return NextResponse.json(
        { error: 'Datos inválidos o insuficientes' },
        { status: 400 }
      );
    }
    
    const { name, email, role } = userData;
    
    // Validar que el rol sea válido
    if (role && !['admin', 'user'].includes(role)) {
      console.log('API: Rol inválido:', role);
      return NextResponse.json(
        { error: 'Rol de usuario inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que el correo electrónico no esté en uso por otro usuario
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        console.log('API: Email ya en uso por otro usuario');
        return NextResponse.json(
          { error: 'El correo electrónico ya está en uso por otro usuario' },
          { status: 400 }
        );
      }
    }
    
    // Preparar los datos para actualizar
    const updateData: { name?: string; email?: string; role?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Actualizar el usuario
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      console.log('API: Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('API: Usuario actualizado correctamente:', updatedUser._id);
    
    return NextResponse.json({
      message: 'Usuario actualizado correctamente',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        image: updatedUser.image,
        courses: updatedUser.courses
      }
    });
    
  } catch (error) {
    console.error('API: Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 