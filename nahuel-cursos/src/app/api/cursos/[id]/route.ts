import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/cursos/[id] - Obtener un curso específico
export async function GET(request: Request, context: RouteParams) {
  try {
    const params = context.params;
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    const cursoId = params.id;
    const session = await getServerSession(authOptions);
    
    // NUEVO: No usar inmediatamente ObjectId.isValid para permitir otros formatos
    const { db } = await connectToDatabase();
    
    let curso;
    
    // Intentar buscar por _id directamente si es un ObjectId válido
    if (ObjectId.isValid(cursoId)) {
      curso = await db.collection('cursos').findOne({
        _id: new ObjectId(cursoId)
      });
    }
    
    // Si no encontramos con ObjectId, buscar por campo alternativo (como slug o id personalizado)
    if (!curso) {
      curso = await db.collection('cursos').findOne({
        // Buscar por otros campos como id personalizado o slug
        $or: [
          { customId: cursoId },
          { slug: cursoId }
        ]
      });
    }
    
    if (!curso) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el usuario ha comprado el curso
    let cursoComprado = null;
    if (session?.user?.id) {
      console.log('Verificando si el usuario tiene acceso al curso:', {
        userId: session.user.id,
        cursoId: cursoId
      });
      
      cursoComprado = await db.collection('usuarios').findOne({ 
        _id: new ObjectId(session.user.id),
        cursosComprados: cursoId  // Buscar solo como string, sin convertir a ObjectId
      });
      
      console.log('Resultado de verificación de acceso:', !!cursoComprado);
    }
      
    // Si el usuario ha comprado el curso, incluir el video completo
    if (cursoComprado) {
      return NextResponse.json(curso);
    }
    
    // Si no ha comprado el curso, omitir el video completo
    const { video, ...cursoSinVideo } = curso;
    
    // Obtener valoraciones si no existen en el documento del curso
    if (!curso.calificacionPromedio) {
      // Obtener las valoraciones del curso
      const valoraciones = await db
        .collection('valoraciones')
        .find({ cursoId: new ObjectId(cursoId) })
        .toArray();
      
      // Calcular la calificación promedio
      let promedio = 0;
      if (valoraciones.length > 0) {
        const suma = valoraciones.reduce((acc: number, val: any) => acc + val.calificacion, 0);
        promedio = suma / valoraciones.length;
        
        // Añadir la información de valoraciones al curso
        cursoSinVideo.calificacionPromedio = promedio;
        cursoSinVideo.totalValoraciones = valoraciones.length;
      }
    }
    
    return NextResponse.json(cursoSinVideo);
  } catch (error) {
    console.error('Error al obtener curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

// PUT /api/cursos/[id] - Actualizar un curso (solo admin)
export async function PUT(request: Request, context: RouteParams) {
  try {
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    const { isAdmin } = await import('@/lib/auth/auth');
    
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
    
    const { db } = await connectToDatabase();
    
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
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    const { isAdmin } = await import('@/lib/auth/auth');
    
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
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