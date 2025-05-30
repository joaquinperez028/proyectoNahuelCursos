import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDB } from '@/lib/database';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Conectar a la base de datos
    await connectToDB();

    // Obtener el nuevo nombre del cuerpo de la petición
    const { name } = await request.json();

    // Validar el nombre
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // Validar longitud del nombre
    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'El nombre no puede tener más de 50 caracteres' }, { status: 400 });
    }

    // Buscar y actualizar el usuario
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { name: name.trim() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Nombre actualizado correctamente',
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error al actualizar el nombre del usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 