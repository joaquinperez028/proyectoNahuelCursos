import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin, hasCourseAccess } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/cursos/[id] - Obtener un curso específico
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const curso = await db.collection('cursos').findOne({ _id: new ObjectId(id) });
    
    if (!curso) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar acceso al contenido del curso si no es sólo la vista previa
    const session = await getServerSession(authOptions);
    const isFullAccess = session && (
      isAdmin(session) || 
      (session.user?.id && await hasCourseAccess(session.user.id, id))
    );
    
    // Si el usuario no tiene acceso completo, solo enviar información limitada
    if (!isFullAccess) {
      // No enviar la URL completa del video del curso, solo la vista previa
      const { video, ...cursoInfo } = curso;
      return NextResponse.json(cursoInfo);
    }
    
    return NextResponse.json(curso);
  } catch (error) {
    console.error('Error al obtener curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

// PUT /api/cursos/[id] - Actualizar un curso (solo admin)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.titulo || !data.descripcion || data.precio === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Actualizar el curso
    const resultado = await db.collection('cursos').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          titulo: data.titulo,
          descripcion: data.descripcion,
          precio: data.precio,
          video: data.video,
          videoPreview: data.videoPreview,
          categorias: data.categorias || []
        } 
      }
    );
    
    if (!resultado.acknowledged) {
      throw new Error('Error al actualizar el curso');
    }
    
    if (resultado.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { mensaje: 'Curso actualizado exitosamente' }
    );
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el curso' },
      { status: 500 }
    );
  }
}

// DELETE /api/cursos/[id] - Eliminar un curso (solo admin)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Eliminar el curso
    const resultado = await db.collection('cursos').deleteOne({ _id: new ObjectId(id) });
    
    if (!resultado.acknowledged) {
      throw new Error('Error al eliminar el curso');
    }
    
    if (resultado.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { mensaje: 'Curso eliminado exitosamente' }
    );
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
} 