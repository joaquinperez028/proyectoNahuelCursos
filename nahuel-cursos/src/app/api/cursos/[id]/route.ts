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
    
    // Verificar si se solicita una comprobación forzada
    const headers = request.headers;
    const forceCheck = headers.get('X-Force-Check') === 'true';
    
    console.log('API Curso: Obteniendo curso', cursoId, 'con verificación forzada:', forceCheck);
    
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
    let tieneAcceso = false;
    if (session?.user?.id) {
      console.log('API Curso: Verificando si el usuario tiene acceso al curso:', {
        userId: session.user.id,
        cursoId: cursoId
      });
      
      // Si el ID es temporal, el usuario aún no está sincronizado
      if (session.user.id.startsWith('temp_')) {
        console.log('API Curso: ID temporal detectado, usuario aún no sincronizado');
        // Intentamos buscar por email de todas formas
        if (session.user.email) {
          try {
            const usuarioEmail = await db.collection('usuarios').findOne({
              email: session.user.email
            });
            
            if (usuarioEmail) {
              console.log('API Curso: Usuario encontrado por email a pesar de ID temporal');
              
              // Verificar cursos comprados
              if (usuarioEmail.cursosComprados && Array.isArray(usuarioEmail.cursosComprados)) {
                const cursoIdString = cursoId.toString();
                const tieneCurso = usuarioEmail.cursosComprados.some((id: any) => 
                  id && id.toString() === cursoIdString
                );
                
                if (tieneCurso) {
                  console.log('API Curso: Usuario con ID temporal tiene acceso por email');
                  tieneAcceso = true;
                }
              }
            }
          } catch (emailError) {
            console.error('API Curso: Error al intentar verificar por email:', emailError);
          }
        }
      } else {
        try {
          // Buscar primero por email (más confiable)
          let usuario = null;
          
          if (session.user.email) {
            usuario = await db.collection('usuarios').findOne({
              email: session.user.email
            });
            
            if (usuario) {
              console.log('API Curso: Usuario encontrado por email:', usuario._id.toString());
            }
          }
          
          // Si no encontramos por email, intentar por ID
          if (!usuario && ObjectId.isValid(session.user.id)) {
            usuario = await db.collection('usuarios').findOne({
              _id: new ObjectId(session.user.id)
            });
            
            if (usuario) {
              console.log('API Curso: Usuario encontrado por ID:', usuario._id.toString());
            }
          }
          
          if (!usuario) {
            console.log('API Curso: No se encontró el usuario');
          } else if (!usuario.cursosComprados || !Array.isArray(usuario.cursosComprados)) {
            console.log('API Curso: El usuario no tiene la propiedad cursosComprados o no es un array');
          } else {
            console.log('API Curso: Verificando acceso entre', usuario.cursosComprados.length, 'cursos comprados');
            
            // Normalizar ID del curso a string para comparaciones consistentes
            const cursoIdString = cursoId.toString();
            
            // Verificar si el curso está en la lista de cursos comprados
            const tieneCurso = usuario.cursosComprados.some((id: any) => {
              if (!id) return false;
              return id?.toString() === cursoIdString;
            });
            
            console.log('API Curso: ¿Usuario tiene el curso?', tieneCurso);
            tieneAcceso = tieneCurso;
          }
        } catch (error) {
          console.error('API Curso: Error al verificar cursos comprados:', error);
        }
      }
      
      // Log del resultado final
      console.log('API Curso: Resultado final de verificación de acceso:', {
        tieneAcceso: tieneAcceso,
        userId: session.user.id,
        cursoId: cursoId
      });
    }
      
    // Si el usuario ha comprado el curso, incluir el video completo
    if (tieneAcceso) {
      // Añadir indicadores para el frontend
      const cursoCompleto = {
        ...curso,
        tieneAcceso: true
      };
      
      return NextResponse.json(cursoCompleto, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
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
    
    // Indicar explícitamente que no tiene acceso
    const cursoRestringido = {
      ...cursoSinVideo,
      tieneAcceso: false
    };
    
    return NextResponse.json(cursoRestringido, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
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