import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

// POST /api/cursos/comprar - Comprar un curso
export async function POST(request: Request) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Necesitas iniciar sesión para comprar un curso' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { cursoId } = data;
    
    if (!cursoId) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }
    
    // Intentar convertir el ID a un formato válido para ObjectId
    let cursoObjectId;
    try {
      cursoObjectId = new ObjectId(cursoId);
    } catch (error) {
      console.error('Error al convertir ID del curso:', error);
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar que el curso exista
    const curso = await db.collection('cursos').findOne({ _id: cursoObjectId });
    if (!curso) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el usuario no haya comprado ya el curso
    const usuario = await db.collection('usuarios').findOne({ 
      _id: new ObjectId(session.user.id),
      cursosComprados: { $in: [cursoId, cursoObjectId] }
    });
    
    if (usuario) {
      return NextResponse.json(
        { error: 'Ya has comprado este curso' },
        { status: 400 }
      );
    }
    
    // Aquí se implementaría la lógica de procesamiento de pago
    // Por ejemplo, integrando con Mercado Pago u otro gateway de pago
    
    // Simulación de procesamiento de pago exitoso
    // En un escenario real, solo se agregaría el curso al usuario tras confirmar el pago
    
    // Añadir el curso a la lista de cursos comprados por el usuario
    console.log('Registrando compra del curso para el usuario:', {
      userId: session.user.id,
      cursoId: cursoId.toString()
    });
    
    // Verificar primero si el usuario ya tiene el curso (doble verificación)
    const usuarioExistente = await db.collection('usuarios').findOne({
      _id: new ObjectId(session.user.id),
      cursosComprados: { $in: [cursoId.toString()] }
    });
    
    if (usuarioExistente) {
      console.log('El usuario ya tiene este curso, omitiendo actualización');
      return NextResponse.json({
        mensaje: 'Curso ya adquirido anteriormente',
        curso: {
          id: curso._id,
          titulo: curso.titulo
        }
      });
    }
    
    // Asegurarnos de que siempre almacenamos el ID como string para consistencia
    const resultado = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $addToSet: { cursosComprados: cursoId.toString() } }
    );
    
    if (!resultado.acknowledged) {
      throw new Error('Error al registrar la compra');
    }
    
    if (resultado.modifiedCount === 0) {
      console.log('No se modificó ningún documento. Verificando si el curso ya estaba registrado...');
      
      // Verificar si el usuario ya tenía el curso (quizás en otro formato)
      const usuarioActualizado = await db.collection('usuarios').findOne({
        _id: new ObjectId(session.user.id)
      });
      
      if (usuarioActualizado && usuarioActualizado.cursosComprados) {
        const tieneCurso = usuarioActualizado.cursosComprados.some((id: any) => 
          id.toString() === cursoId.toString()
        );
        
        if (tieneCurso) {
          console.log('El curso ya estaba registrado en otro formato');
          return NextResponse.json({
            mensaje: 'Curso ya adquirido anteriormente', 
            curso: { 
              id: curso._id,
              titulo: curso.titulo
            } 
          });
        }
      }
      
      // Si llegamos aquí es porque hubo un problema real
      throw new Error('No se pudo registrar la compra');
    }
    
    console.log('Compra registrada con éxito:', {
      modifiedCount: resultado.modifiedCount,
      matchedCount: resultado.matchedCount
    });
    
    return NextResponse.json(
      { 
        mensaje: 'Curso comprado exitosamente', 
        curso: { 
          id: curso._id,
          titulo: curso.titulo
        } 
      }
    );
  } catch (error) {
    console.error('Error al procesar la compra:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra del curso' },
      { status: 500 }
    );
  }
} 