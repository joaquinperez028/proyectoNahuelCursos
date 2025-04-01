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
    
    if (!cursoId || !ObjectId.isValid(cursoId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Verificar que el curso exista
    const curso = await db.collection('cursos').findOne({ _id: new ObjectId(cursoId) });
    if (!curso) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el usuario no haya comprado ya el curso
    const usuario = await db.collection('usuarios').findOne({ 
      _id: new ObjectId(session.user.id),
      cursosComprados: cursoId
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
    const resultado = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $addToSet: { cursosComprados: cursoId } }
    );
    
    if (!resultado.acknowledged || resultado.modifiedCount === 0) {
      throw new Error('Error al registrar la compra');
    }
    
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