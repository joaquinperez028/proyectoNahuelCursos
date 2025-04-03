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
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }
    
    if (!session.user.id && !session.user.email) {
      return NextResponse.json({ error: 'Información de sesión incompleta' }, { status: 400 });
    }
    
    // Obtener la información actualizada del usuario desde la base de datos
    const { db } = await connectToDatabase();
    
    // Preparar criterio de búsqueda (ID o email)
    let usuario = null;
    
    // Si tenemos un ID que no es temporal, intentamos buscar primero por ID
    if (session.user.id && !session.user.id.startsWith('temp_')) {
      try {
        if (ObjectId.isValid(session.user.id)) {
          console.log('Actualizar-sesión: Buscando por ID:', session.user.id);
          usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(session.user.id) 
          });
        }
      } catch (idError) {
        console.error('Actualizar-sesión: Error al buscar por ID:', idError);
      }
    }
    
    // Si no encontramos por ID y tenemos email, intentamos por email
    if (!usuario && session.user.email) {
      console.log('Actualizar-sesión: Buscando por email:', session.user.email);
      usuario = await db.collection('usuarios').findOne({ 
        email: session.user.email 
      });
    }
    
    if (!usuario) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado', 
        message: 'No se pudo encontrar el usuario en la base de datos' 
      }, { status: 404 });
    }
    
    console.log('Actualizar-sesión: Usuario encontrado:', usuario._id.toString());
    
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
      { 
        error: 'Error al actualizar la sesión',
        message: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 