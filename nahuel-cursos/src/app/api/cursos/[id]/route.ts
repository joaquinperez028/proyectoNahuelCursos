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
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    const cursoId = params.id;
    const session = await getServerSession(authOptions);
    
    // Validar el ID del curso
    if (!ObjectId.isValid(cursoId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Obtener el curso de la base de datos
    const curso = await db.collection('cursos').findOne({
      _id: new ObjectId(cursoId)
    });
    
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
      
      try {
        // Métodos mejorados para buscar al usuario
        let usuario = null;
        
        // Primera comprobación: buscar usuario por ID si es válido
        if (!session.user.id.startsWith('temp_') && ObjectId.isValid(session.user.id)) {
          usuario = await db.collection('usuarios').findOne({
            _id: new ObjectId(session.user.id)
          });
        }
        
        // Si no encontramos el usuario por ID, intentar por email
        if (!usuario && session.user.email) {
          console.log('Usuario no encontrado por ID, probando con email:', session.user.email);
          usuario = await db.collection('usuarios').findOne({
            email: session.user.email
          });
        }
        
        if (!usuario) {
          console.log('No se encontró el usuario ni por ID ni por email');
        } else if (!usuario.cursosComprados || !Array.isArray(usuario.cursosComprados)) {
          console.log('El usuario no tiene la propiedad cursosComprados o no es un array:', usuario);
        } else {
          console.log('Verificando acceso entre', usuario.cursosComprados.length, 'cursos comprados');
          
          // Normalizar ID del curso a string para comparaciones consistentes
          const cursoIdString = cursoId.toString();
          
          // Verificar si el curso está en la lista de cursos comprados (multiples formatos)
          const tieneCurso = usuario.cursosComprados.some((id: any) => {
            // Convertir el ID a string para comparación
            const idCursoComprado = id?.toString() || '';
            return (
              idCursoComprado === cursoIdString || 
              idCursoComprado === cursoId
            );
          });
          
          console.log('¿Usuario tiene el curso?', tieneCurso, {
            cursosComprados: usuario.cursosComprados.map((id: any) => id?.toString() || 'id_inválido')
          });
          
          cursoComprado = tieneCurso ? usuario : null;
          
          // Log adicional para diagnóstico si no se encontró el curso
          if (!tieneCurso) {
            console.log('IDs de cursos comprados:', usuario.cursosComprados);
            console.log('ID del curso solicitado:', cursoId, '(tipo:', typeof cursoId, ')');
          }
        }
      } catch (error) {
        console.error('Error al verificar cursos comprados:', error);
        // No interrumpimos el flujo, simplemente logueamos el error
      }
      
      // Log para el diagnóstico final
      console.log('Resultado final de verificación de acceso:', {
        tieneAcceso: !!cursoComprado,
        userId: session.user.id,
        cursoId: cursoId
      });
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