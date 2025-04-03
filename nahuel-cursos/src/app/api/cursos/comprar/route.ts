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
    
    // Verificar si el ID de usuario es temporal
    if (session.user.id.startsWith('temp_')) {
      console.log('ID temporal detectado durante la compra:', session.user.id);
      return NextResponse.json(
        { 
          error: 'Tu cuenta aún está siendo procesada', 
          message: 'Por favor, espera unos segundos e intenta nuevamente. Si el problema persiste, cierra sesión y vuelve a iniciar sesión.' 
        },
        { status: 202 } // Accepted pero no procesado aún
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

    // Conectar a la base de datos
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
    } catch (dbError) {
      console.error('Error al conectar a la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos. Intenta más tarde.' },
        { status: 500 }
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
    
    // Verificar que el curso exista
    let curso;
    try {
      curso = await db.collection('cursos').findOne({ _id: cursoObjectId });
      if (!curso) {
        return NextResponse.json(
          { error: 'Curso no encontrado' },
          { status: 404 }
        );
      }
    } catch (cursoError) {
      console.error('Error al buscar el curso:', cursoError);
      return NextResponse.json(
        { error: 'Error al buscar el curso solicitado' },
        { status: 500 }
      );
    }
    
    // Verificar que el usuario exista en la base de datos
    let usuario;
    let userObjectId;
    
    try {
      if (!ObjectId.isValid(session.user.id)) {
        console.error('ID de usuario inválido:', session.user.id);
        return NextResponse.json(
          { error: 'ID de usuario inválido. Cierra sesión y vuelve a iniciar.' },
          { status: 400 }
        );
      }
      
      userObjectId = new ObjectId(session.user.id);
      
      // Buscar el usuario en la base de datos
      usuario = await db.collection('usuarios').findOne({ _id: userObjectId });
      
      // Si no encontramos por ID, intentar por email como último recurso
      if (!usuario && session.user.email) {
        console.log('Usuario no encontrado por ID, intentando por email:', session.user.email);
        usuario = await db.collection('usuarios').findOne({ email: session.user.email });
        
        // Si encontramos al usuario por email, actualizar userObjectId
        if (usuario) {
          userObjectId = usuario._id;
        }
      }
      
      if (!usuario) {
        // No encontramos al usuario ni por ID ni por email
        console.error('Usuario no encontrado en la base de datos:', session.user.id);
        
        // Crear el usuario si no existe (esto podría ocurrir si hay inconsistencia con la sesión)
        if (session.user.email) {
          const nuevoUsuario = {
            email: session.user.email,
            nombre: session.user.nombre || session.user.name?.split(' ')[0] || '',
            apellido: session.user.apellido || session.user.name?.split(' ').slice(1).join(' ') || '',
            telefono: session.user.telefono || '',
            admin: false,
            createdAt: new Date(),
            lastLogin: new Date(),
            image: session.user.image || '',
            cursosComprados: []
          };
          
          console.log('Creando usuario nuevo en la base de datos:', nuevoUsuario.email);
          
          const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
          
          if (resultado.acknowledged) {
            usuario = nuevoUsuario;
            userObjectId = resultado.insertedId;
            console.log('Usuario creado exitosamente con ID:', resultado.insertedId);
          } else {
            throw new Error('No se pudo crear el usuario');
          }
        } else {
          return NextResponse.json(
            { error: 'Usuario no encontrado y no se puede crear sin email' },
            { status: 404 }
          );
        }
      }
    } catch (usuarioError) {
      console.error('Error al buscar o crear el usuario:', usuarioError);
      return NextResponse.json(
        { error: 'Error al verificar o crear tu usuario' },
        { status: 500 }
      );
    }

    // Verificar si el usuario ya tiene el curso (comparación más robusta)
    let tieneCursoComprado = false;

    if (usuario.cursosComprados && Array.isArray(usuario.cursosComprados)) {
      // Normalizar el ID del curso para la comparación
      const cursoIdStr = cursoId.toString();
      
      // Verificar si el curso ya está en la lista (en cualquier formato)
      tieneCursoComprado = usuario.cursosComprados.some((id: any) => {
        if (!id) return false;
        const idStr = id.toString();
        return idStr === cursoIdStr;
      });
      
      console.log('¿El usuario ya tiene el curso?', tieneCursoComprado);
      console.log('Cursos comprados:', usuario.cursosComprados.map((id: any) => id?.toString() || 'id_inválido'));
    }

    if (tieneCursoComprado) {
      return NextResponse.json(
        { mensaje: 'Ya has comprado este curso' },
        { status: 200 }
      );
    }
    
    // Aquí se implementaría la lógica de procesamiento de pago
    // Por ejemplo, integrando con Mercado Pago u otro gateway de pago
    
    // Simulación de procesamiento de pago exitoso
    // En un escenario real, solo se agregaría el curso al usuario tras confirmar el pago
    
    // Asegurarnos de que siempre almacenamos el ID como string para consistencia
    console.log('Registrando compra con ID:', cursoId.toString(), 'para usuario:', userObjectId.toString());

    try {
      // Preparar la actualización con operadores más seguros
      const resultado = await db.collection('usuarios').updateOne(
        { _id: userObjectId },
        { 
          $addToSet: { 
            cursosComprados: cursoId.toString()
          },
          $set: {
            ultimaCompra: new Date()
          }
        }
      );

      if (!resultado.acknowledged) {
        console.log('Error: operación no reconocida por MongoDB');
        throw new Error('Error al registrar la compra: operación no reconocida');
      }

      console.log('Resultado de la actualización:', {
        acknowledged: resultado.acknowledged,
        modifiedCount: resultado.modifiedCount,
        matchedCount: resultado.matchedCount,
        upsertedCount: resultado.upsertedCount
      });

      if (resultado.matchedCount === 0) {
        console.log('Error: no se encontró el usuario durante la actualización');
        throw new Error('No se encontró el usuario para registrar la compra');
      }

      if (resultado.modifiedCount === 0) {
        console.log('Advertencia: No se modificó ningún documento');
        
        // Verificar si el curso realmente se agregó (doble chequeo)
        console.log('Verificando si el curso realmente se agregó...');
        const usuarioActualizado = await db.collection('usuarios').findOne({
          _id: userObjectId
        });
        
        if (usuarioActualizado) {
          if (usuarioActualizado.cursosComprados && Array.isArray(usuarioActualizado.cursosComprados)) {
            // Normalizar el ID del curso para la comparación
            const cursoIdStr = cursoId.toString();
            
            // Verificar si el curso está en la lista después de todo
            const tieneCursoAhora = usuarioActualizado.cursosComprados.some((id: any) => {
              if (!id) return false;
              const idStr = id.toString();
              return idStr === cursoIdStr;
            });
            
            if (tieneCursoAhora) {
              console.log('El curso ya estaba en la lista aunque no se registró modificación');
              return NextResponse.json({
                mensaje: 'Curso ya registrado anteriormente', 
                curso: { 
                  id: curso._id.toString(),
                  titulo: curso.titulo
                } 
              });
            }
          }
          
          console.log('El curso NO se encuentra en la lista del usuario después de la operación');
        }
        
        // Si llegamos aquí es porque hubo un problema real
        throw new Error('No se pudo registrar la compra: el documento no fue modificado');
      }

      console.log('Compra registrada con éxito:', {
        userId: userObjectId.toString(),
        cursoId: cursoId.toString(),
        modifiedCount: resultado.modifiedCount
      });

      // Devolver respuesta de éxito
      return NextResponse.json(
        { 
          mensaje: 'Curso comprado exitosamente', 
          curso: { 
            id: curso._id.toString(),
            titulo: curso.titulo
          } 
        }
      );
    } catch (compraError) {
      console.error('Error durante el proceso de compra:', compraError);
      return NextResponse.json(
        { error: 'Error al registrar la compra: ' + compraError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general al procesar la compra:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra del curso' },
      { status: 500 }
    );
  }
} 