import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic'; // Asegurar que siempre obtiene datos frescos

// GET /api/usuario/cursos - Obtener los cursos comprados por el usuario autenticado
export async function GET(request: Request) {
  console.log('API: Iniciando solicitud de cursos comprados');
  
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    console.log('API: Obteniendo cursos comprados para el usuario:', userId);
    
    const { db } = await connectToDatabase();
    
    // Obtener el usuario con sus cursos comprados
    let usuario;
    try {
      usuario = await db.collection('usuarios').findOne({ 
        _id: new ObjectId(userId) 
      });
    } catch (error) {
      console.error('API: Error al convertir ID de usuario a ObjectId:', error);
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }
    
    if (!usuario) {
      console.log('API: Usuario no encontrado:', userId);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el usuario no tiene cursos comprados, devolver un array vacío
    if (!usuario.cursosComprados || !Array.isArray(usuario.cursosComprados) || usuario.cursosComprados.length === 0) {
      console.log('API: El usuario no tiene cursos comprados');
      return NextResponse.json({ cursos: [] });
    }
    
    console.log('API: Usuario tiene cursos comprados:', usuario.cursosComprados);
    
    try {
      // Preparar una lista segura de IDs de cursos (manejando tanto strings como ObjectIds)
      const cursoIds = [];
      
      for (const id of usuario.cursosComprados) {
        try {
          if (typeof id === 'string') {
            // Intentar convertir string a ObjectId
            cursoIds.push(new ObjectId(id));
          } else if (id instanceof ObjectId) {
            // Si ya es un ObjectId, usarlo directamente
            cursoIds.push(id);
          }
        } catch (error) {
          console.error(`API: ID de curso inválido (${id}):`, error);
          // Continuar con el siguiente ID aunque este sea inválido
        }
      }
      
      if (cursoIds.length === 0) {
        console.log('API: No hay IDs de cursos válidos para buscar');
        return NextResponse.json({ cursos: [] });
      }
      
      console.log('API: Buscando cursos con IDs:', cursoIds.map(id => id.toString()));
      
      // Obtener los detalles de los cursos comprados
      const cursos = await db.collection('cursos')
        .find({ _id: { $in: cursoIds } })
        .toArray();
      
      console.log('API: Se encontraron', cursos.length, 'cursos de', cursoIds.length, 'IDs');
      
      // Mapear los IDs para debuggeo
      console.log('IDs de cursos encontrados:', cursos.map(c => c._id.toString()));
      
      return NextResponse.json({ cursos });
    } catch (error) {
      console.error('API: Error al procesar los IDs de cursos:', error);
      return NextResponse.json(
        { error: 'Error al procesar los IDs de cursos', detalles: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error al obtener cursos del usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos comprados' },
      { status: 500 }
    );
  }
} 