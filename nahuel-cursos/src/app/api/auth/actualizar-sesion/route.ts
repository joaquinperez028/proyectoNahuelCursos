import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { connectToDatabase } from '@/lib/db/connection';
import { ObjectId } from 'mongodb';

// POST /api/auth/actualizar-sesion - Endpoint para forzar la actualización de la sesión
export async function POST(req: NextRequest) {
  try {
    // Verificar si hay una sesión activa
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }
    
    // Obtener la información actualizada del usuario desde la base de datos
    const db = await connectToDatabase();
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(session.user.id) }
    );
    
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Devolver la información actualizada para que el cliente pueda actualizar su estado
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario._id.toString(),
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        role: usuario.admin ? 'admin' : 'user',
        image: usuario.image
      }
    });
  } catch (error) {
    console.error('Error al actualizar la sesión:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la sesión' },
      { status: 500 }
    );
  }
} 