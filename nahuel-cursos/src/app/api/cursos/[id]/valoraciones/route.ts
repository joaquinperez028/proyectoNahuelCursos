import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';
import { Db } from 'mongodb';
import { Session } from 'next-auth';
import clientPromise from '@/lib/db/mongodb';

interface Valoracion {
  usuarioId: string;
  usuario: string;
  calificacion: number;
  comentario: string;
  fecha: Date;
  usuario_email?: string | null;
}

interface RouteParams {
  params: {
    id: string;
  };
}

// GET para obtener todas las valoraciones de un curso
export async function GET(
  request: Request,
  context: RouteParams
) {
  try {
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }
    
    const cursoId = params.id;
    
    // Validar el ID del curso
    if (!ObjectId.isValid(cursoId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Obtener las valoraciones del curso
    const valoraciones = await db
      .collection('valoraciones')
      .find({ cursoId: new ObjectId(cursoId) })
      .sort({ fecha: -1 }) // Ordenar por fecha descendente (más recientes primero)
      .toArray();
    
    // Calcular la calificación promedio
    let promedio = 0;
    if (valoraciones.length > 0) {
      const suma = valoraciones.reduce((acc: number, val: any) => acc + val.calificacion, 0);
      promedio = suma / valoraciones.length;
    }
    
    return NextResponse.json({ 
      valoraciones, 
      promedio,
      total: valoraciones.length 
    });
  } catch (error) {
    console.error('Error al obtener valoraciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener las valoraciones del curso' },
      { status: 500 }
    );
  }
}

// POST para crear una valoración
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cursoId = params.id;
  
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('API Valoraciones: Procesando valoración para el curso:', cursoId);
    console.log('API Valoraciones: Usuario en sesión:', session.user.email, 'ID:', session.user.id);
    
    // Validar el ID del curso
    if (!ObjectId.isValid(cursoId)) {
      console.log('API Valoraciones: ID de curso inválido:', cursoId);
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();
    
    // Verificar si el usuario tiene acceso al curso
    const tieneAcceso = await hasCourseAccess(db, session, cursoId);
    console.log('API Valoraciones: ¿El usuario tiene acceso al curso?', tieneAcceso);
    
    if (!tieneAcceso) {
      return NextResponse.json(
        { error: 'Debes haber comprado el curso para valorarlo' },
        { status: 403 }
      );
    }
    
    // Obtener datos de la solicitud
    const { calificacion, comentario } = await request.json();
    
    // Validar la calificación
    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        { error: 'La calificación debe ser un número entre 1 y 5' },
        { status: 400 }
      );
    }
    
    // Obtener un ID de usuario válido para buscar valoraciones existentes
    let usuarioId = session.user.id;
    let usuarioObjectId = null;
    
    // Intentar convertir a ObjectId si es posible
    if (ObjectId.isValid(session.user.id)) {
      try {
        usuarioObjectId = new ObjectId(session.user.id);
      } catch (error) {
        console.error('API Valoraciones: Error al convertir ID a ObjectId:', error);
      }
    }
    
    // También buscar por email si está disponible
    let userByEmail = null;
    if (session.user.email) {
      try {
        userByEmail = await db.collection('usuarios').findOne({ email: session.user.email });
        if (userByEmail) {
          usuarioObjectId = userByEmail._id;
          usuarioId = userByEmail._id.toString();
        }
      } catch (error) {
        console.error('API Valoraciones: Error al buscar usuario por email:', error);
      }
    }
    
    console.log('API Valoraciones: Buscando valoración existente con usuario ID:', usuarioId);
    
    // Construir una consulta que pueda encontrar valoraciones con diferentes formatos de ID
    const query: any = {
      cursoId: new ObjectId(cursoId)
    };
    
    // Añadir múltiples condiciones para el ID de usuario
    const userIdConditions = [];
    if (usuarioObjectId) {
      userIdConditions.push({ usuarioId: usuarioObjectId });
    }
    userIdConditions.push({ usuarioId: usuarioId });
    
    // Si tenemos un email, también buscar por ese campo
    if (session.user.email) {
      userIdConditions.push({ 'usuario_email': session.user.email });
    }
    
    // Combinar todas las condiciones
    if (userIdConditions.length > 0) {
      query.$or = userIdConditions;
    }
    
    console.log('API Valoraciones: Consulta para buscar valoración existente:', JSON.stringify(query));
    
    // Verificar si el usuario ya ha valorado este curso
    const valoracionExistente = await db.collection('valoraciones').findOne(query);
    
    if (valoracionExistente) {
      console.log('API Valoraciones: Encontrada valoración existente para actualizar:', valoracionExistente._id.toString());
      // Actualizar la valoración existente
      await db.collection('valoraciones').updateOne(
        { _id: valoracionExistente._id },
        {
          $set: {
            calificacion,
            comentario: comentario || '',
            fecha: new Date(),
            usuario: `${session.user.nombre || session.user.name?.split(' ')[0] || ''} ${session.user.apellido || session.user.name?.split(' ').slice(1).join(' ') || ''}`.trim(),
            usuario_email: session.user.email || null
          },
        }
      );
      
      return NextResponse.json({ message: 'Valoración actualizada correctamente' });
    } else {
      console.log('API Valoraciones: Creando nueva valoración para el curso:', cursoId);
      // Crear una nueva valoración
      const nuevaValoracion: Valoracion = {
        usuarioId: session.user.id,
        usuario: `${session.user.nombre || session.user.name?.split(' ')[0] || ''} ${session.user.apellido || session.user.name?.split(' ').slice(1).join(' ') || ''}`.trim(),
        usuario_email: session.user.email || null,
        calificacion,
        comentario: comentario || '',
        fecha: new Date()
      };
      
      // Usar el ObjectId ya calculado anteriormente
      await db.collection('valoraciones').insertOne({
        ...nuevaValoracion,
        cursoId: new ObjectId(cursoId),
        usuarioId: usuarioObjectId || session.user.id // Usar el ObjectId si es posible, sino el string
      });
      
      // Actualizar el promedio de calificación en el curso
      const todasLasValoraciones = await db
        .collection('valoraciones')
        .find({ cursoId: new ObjectId(cursoId) })
        .toArray();
      
      const promedio = todasLasValoraciones.reduce((acc: number, val: any) => acc + val.calificacion, 0) / todasLasValoraciones.length;
      
      await db.collection('cursos').updateOne(
        { _id: new ObjectId(cursoId) },
        { $set: { calificacionPromedio: promedio, totalValoraciones: todasLasValoraciones.length } }
      );
      
      return NextResponse.json({ message: 'Valoración creada correctamente' });
    }
  } catch (error) {
    console.error('Error al crear valoración:', error);
    return NextResponse.json(
      { error: 'Error al crear la valoración' },
      { status: 500 }
    );
  }
}

// DELETE para eliminar una valoración (opcional, por si quieres permitir que los usuarios eliminen sus valoraciones)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cursoId = params.id;
  
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Validar el ID del curso
    if (!ObjectId.isValid(cursoId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();
    
    // Verificar si el usuario tiene acceso al curso
    const tieneAcceso = await hasCourseAccess(db, session, cursoId);
    console.log('API Valoraciones DELETE: ¿El usuario tiene acceso al curso?', tieneAcceso);
    
    if (!tieneAcceso) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta valoración' },
        { status: 403 }
      );
    }
    
    // Obtener un ID de usuario válido
    let usuarioObjectId = null;
    let usuarioId = session.user.id;

    // Intentar convertir a ObjectId si es posible
    if (ObjectId.isValid(session.user.id)) {
      try {
        usuarioObjectId = new ObjectId(session.user.id);
      } catch (error) {
        console.error('API Valoraciones DELETE: Error al convertir ID a ObjectId:', error);
      }
    }
    
    // Buscar por email si está disponible
    if (session.user.email) {
      try {
        const userByEmail = await db.collection('usuarios').findOne({ email: session.user.email });
        if (userByEmail) {
          usuarioObjectId = userByEmail._id;
          usuarioId = userByEmail._id.toString();
        }
      } catch (error) {
        console.error('API Valoraciones DELETE: Error al buscar usuario por email:', error);
      }
    }
    
    // Construir una consulta que pueda encontrar valoraciones con diferentes formatos de ID
    const query: any = {
      cursoId: new ObjectId(cursoId)
    };
    
    // Añadir múltiples condiciones para el ID de usuario
    const userIdConditions = [];
    if (usuarioObjectId) {
      userIdConditions.push({ usuarioId: usuarioObjectId });
    }
    userIdConditions.push({ usuarioId: usuarioId });
    
    // Si tenemos un email, también buscar por ese campo
    if (session.user.email) {
      userIdConditions.push({ 'usuario_email': session.user.email });
    }
    
    // Combinar todas las condiciones
    if (userIdConditions.length > 0) {
      query.$or = userIdConditions;
    }
    
    console.log('API Valoraciones DELETE: Consulta para buscar valoración:', JSON.stringify(query));
    
    // Eliminar la valoración
    const resultado = await db.collection('valoraciones').deleteOne(query);
    
    if (resultado.deletedCount === 0) {
      return NextResponse.json(
        { error: 'No se encontró la valoración para eliminar' },
        { status: 404 }
      );
    }
    
    // Actualizar el promedio de calificación en el curso
    const todasLasValoraciones = await db
      .collection('valoraciones')
      .find({ cursoId: new ObjectId(cursoId) })
      .toArray();
    
    let promedio = 0;
    if (todasLasValoraciones.length > 0) {
      promedio = todasLasValoraciones.reduce((acc: number, val: any) => acc + val.calificacion, 0) / todasLasValoraciones.length;
    }
    
    await db.collection('cursos').updateOne(
      { _id: new ObjectId(cursoId) },
      { $set: { calificacionPromedio: promedio, totalValoraciones: todasLasValoraciones.length } }
    );
    
    return NextResponse.json({ message: 'Valoración eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar valoración:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la valoración' },
      { status: 500 }
    );
  }
}

// Función para verificar si el usuario tiene acceso al curso
const hasCourseAccess = async (db: Db, session: Session, cursoId: string): Promise<boolean> => {
  console.log('Verificando acceso al curso. Usuario:', session.user.email, 'ID:', session.user.id);
  console.log('ID del curso a verificar:', cursoId);

  try {
    // Primero intentamos encontrar al usuario por email (más confiable)
    const usuarioByEmail = session.user.email 
      ? await db.collection('usuarios').findOne({ email: session.user.email })
      : null;
    
    if (usuarioByEmail) {
      console.log('Usuario encontrado por email:', usuarioByEmail._id.toString());
      
      // Si el usuario tiene cursosComprados, verificamos si el curso está en la lista
      if (usuarioByEmail.cursosComprados && Array.isArray(usuarioByEmail.cursosComprados)) {
        // Normalizar el ID del curso para comparar
        const cursoIdString = cursoId.toString();
        
        // Buscar si existe el curso en la lista de comprados (con cualquier formato de ID)
        const tieneCurso = usuarioByEmail.cursosComprados.some((c: any) => {
          if (typeof c === 'string') {
            return c === cursoIdString;
          } else if (c && typeof c === 'object' && c._id) {
            return c._id.toString() === cursoIdString;
          } else if (c && typeof c.toString === 'function') {
            return c.toString() === cursoIdString;
          }
          return false;
        });
        
        console.log('¿Usuario tiene el curso en sus compras?', tieneCurso);
        return tieneCurso;
      }
    }
    
    // Si no encontramos por email o no tiene el curso, buscar por ID
    if (session.user.id) {
      // Intentar buscar por ID si es un ObjectId válido
      let usuarioById = null;
      
      if (ObjectId.isValid(session.user.id)) {
        try {
          usuarioById = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(session.user.id) 
          });
        } catch (error) {
          console.error('Error al buscar usuario por ObjectId:', error);
        }
      }
      
      // Si también intentamos buscar por ID string
      if (!usuarioById) {
        usuarioById = await db.collection('usuarios').findOne({ 
          id: session.user.id 
        });
      }
      
      if (usuarioById) {
        console.log('Usuario encontrado por ID:', usuarioById._id.toString());
        
        // Verificar si tiene el curso comprado
        if (usuarioById.cursosComprados && Array.isArray(usuarioById.cursosComprados)) {
          // Normalizar el ID del curso para comparar
          const cursoIdString = cursoId.toString();
          
          // Buscar si existe el curso en la lista de comprados (con cualquier formato)
          const tieneCurso = usuarioById.cursosComprados.some((c: any) => {
            if (typeof c === 'string') {
              return c === cursoIdString;
            } else if (c && typeof c === 'object' && c._id) {
              return c._id.toString() === cursoIdString;
            } else if (c && typeof c.toString === 'function') {
              return c.toString() === cursoIdString;
            }
            return false;
          });
          
          console.log('¿Usuario tiene el curso en sus compras?', tieneCurso);
          return tieneCurso;
        }
      }
    }
    
    // Si no se encontró el usuario o no tiene el curso comprado
    console.log('Usuario no encontrado o no tiene curso comprado');
    return false;
  } catch (error) {
    console.error('Error al verificar acceso al curso:', error);
    return false;
  }
} 