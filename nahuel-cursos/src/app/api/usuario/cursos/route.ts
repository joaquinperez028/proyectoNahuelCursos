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
    if (!session || !session.user) {
      console.log('API: No hay sesión activa o usuario en la sesión');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar si tenemos ID de usuario
    if (!session.user.id) {
      console.log('API: No hay ID de usuario en la sesión');
      return NextResponse.json(
        { error: 'Sesión incompleta. Por favor, cierra sesión y vuelve a iniciar.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    console.log('API: Obteniendo cursos comprados para el usuario:', userId);
    
    // Si el ID comienza con 'temp_', es un ID temporal y el usuario aún no está sincronizado
    if (userId.startsWith('temp_')) {
      console.log('API: ID temporal detectado, esperando sincronización con la base de datos');
      return NextResponse.json(
        { 
          error: 'Tu sesión está siendo procesada', 
          message: 'Por favor, espera unos segundos y vuelve a intentarlo.' 
        },
        { status: 202 } // Accepted - la solicitud se ha recibido pero aún no se ha actuado
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Buscar el usuario por email si el ID no es un ObjectId válido
    let usuario;
    let userQuery = {};
    
    try {
      // Intentar convertir a ObjectId primero
      if (ObjectId.isValid(userId)) {
        userQuery = { _id: new ObjectId(userId) };
      } else {
        // Si no es un ObjectId válido y tenemos email, buscar por email
        if (session.user.email) {
          console.log('API: ID no válido, buscando por email:', session.user.email);
          userQuery = { email: session.user.email };
        } else {
          throw new Error('No se pudo determinar cómo identificar al usuario');
        }
      }
      
      usuario = await db.collection('usuarios').findOne(userQuery);
    } catch (error) {
      console.error('API: Error al buscar usuario:', error);
      return NextResponse.json(
        { 
          error: 'Error al identificar usuario', 
          message: 'Por favor, cierra sesión y vuelve a iniciar.' 
        },
        { status: 400 }
      );
    }
    
    if (!usuario) {
      console.log('API: Usuario no encontrado con la consulta:', userQuery);
      return NextResponse.json(
        { 
          error: 'Usuario no encontrado', 
          message: 'Por favor, cierra sesión y vuelve a iniciarla.' 
        },
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
            // Sólo agregar IDs de MongoDB válidos
            if (ObjectId.isValid(id)) {
              cursoIds.push(new ObjectId(id));
            } else {
              console.warn(`API: Ignorando ID de curso inválido: ${id}`);
            }
          } else if (id instanceof ObjectId) {
            // Si ya es un ObjectId, usarlo directamente
            cursoIds.push(id);
          }
        } catch (error) {
          console.error(`API: Error al procesar ID de curso (${id}):`, error);
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
        { 
          error: 'Error al procesar los cursos', 
          detalles: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error al obtener cursos del usuario:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener los cursos comprados',
        message: 'Por favor, inténtalo de nuevo más tarde.'
      },
      { status: 500 }
    );
  }
} 