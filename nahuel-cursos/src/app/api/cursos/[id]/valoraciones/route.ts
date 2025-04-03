import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

interface Valoracion {
  usuarioId: string;
  usuario: string;
  calificacion: number;
  comentario: string;
  fecha: Date;
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
    
    const session = await getServerSession(authOptions);
    
    // Verificar autenticación
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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
    
    // Verificar si el usuario ha comprado el curso
    const usuario = await db.collection('usuarios').findOne({
      email: session.user.email,
      'cursosComprados': new ObjectId(cursoId)
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Debes haber comprado este curso para valorarlo' },
        { status: 403 }
      );
    }
    
    // Obtener los datos de la valoración
    const { calificacion, comentario } = await request.json();
    
    // Validar la calificación
    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        { error: 'La calificación debe ser un número entre 1 y 5' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ya ha valorado este curso
    const valoracionExistente = await db.collection('valoraciones').findOne({
      cursoId: new ObjectId(cursoId),
      usuarioId: usuario._id
    });
    
    if (valoracionExistente) {
      // Actualizar la valoración existente
      await db.collection('valoraciones').updateOne(
        { _id: valoracionExistente._id },
        { 
          $set: { 
            calificacion, 
            comentario, 
            fecha: new Date() 
          } 
        }
      );
      
      return NextResponse.json({ message: 'Valoración actualizada correctamente' });
    }
    
    // Crear una nueva valoración
    const nuevaValoracion: Valoracion = {
      usuarioId: usuario._id.toString(),
      usuario: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
      calificacion,
      comentario: comentario || '',
      fecha: new Date()
    };
    
    await db.collection('valoraciones').insertOne({
      ...nuevaValoracion,
      cursoId: new ObjectId(cursoId),
      usuarioId: new ObjectId(usuario._id)
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
    
    const session = await getServerSession(authOptions);
    
    // Verificar autenticación
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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
    
    // Obtener el usuario
    const usuario = await db.collection('usuarios').findOne({
      email: session.user.email
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Eliminar la valoración
    const resultado = await db.collection('valoraciones').deleteOne({
      cursoId: new ObjectId(cursoId),
      usuarioId: usuario._id
    });
    
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