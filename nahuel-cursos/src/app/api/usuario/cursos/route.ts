import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

// GET /api/usuario/cursos - Obtener los cursos comprados por el usuario autenticado
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Obtener el usuario con sus cursos comprados
    const usuario = await db.collection('usuarios').findOne({ 
      _id: new ObjectId(session.user.id) 
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el usuario no tiene cursos comprados, devolver un array vacío
    if (!usuario.cursosComprados || usuario.cursosComprados.length === 0) {
      return NextResponse.json({ cursos: [] });
    }
    
    // Convertir los IDs de string a ObjectId
    const cursoIds = usuario.cursosComprados.map((id: string) => 
      new ObjectId(id)
    );
    
    // Obtener los detalles de los cursos comprados
    const cursos = await db.collection('cursos')
      .find({ _id: { $in: cursoIds } })
      .toArray();
    
    return NextResponse.json({ cursos });
  } catch (error) {
    console.error('Error al obtener cursos del usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos comprados' },
      { status: 500 }
    );
  }
} 