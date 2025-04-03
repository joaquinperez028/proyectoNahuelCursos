import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

// POST /api/cursos/comprar - Comprar un curso
export async function POST(request: Request) {
  try {
    console.log('API: Inicio de solicitud de compra de curso');
    
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('API: Intento de compra sin sesión activa');
      return NextResponse.json(
        { error: 'Necesitas iniciar sesión para comprar un curso' },
        { status: 401 }
      );
    }
    
    // Verificar si tenemos la información mínima necesaria
    if (!session.user.id) {
      console.log('API: Intento de compra sin ID de usuario en la sesión');
      return NextResponse.json(
        { error: 'Sesión incompleta. Por favor, cierra sesión y vuelve a iniciar.' },
        { status: 400 }
      );
    }
    
    // Verificar si el ID de usuario es temporal
    if (session.user.id.startsWith('temp_')) {
      console.log('API: ID temporal detectado durante la compra:', session.user.id);
      
      // Intentar sincronizar el ID del usuario inmediatamente
      try {
        const { db } = await connectToDatabase();
        
        // Buscar si ya existe el usuario por email
        if (session.user.email) {
          const usuarioExistente = await db.collection('usuarios').findOne({ 
            email: session.user.email 
          });
          
          if (usuarioExistente) {
            console.log('API: Usuario encontrado por email durante la compra:', usuarioExistente._id.toString());
            
            // Continuar con el ID real encontrado
            session.user.id = usuarioExistente._id.toString();
            console.log('API: ID de usuario sincronizado en tiempo real:', session.user.id);
          } else {
            // Crear nuevo usuario inmediatamente
            console.log('API: Creando usuario durante la compra para:', session.user.email);
            const nuevoUsuario = {
              email: session.user.email,
              nombre: session.user.nombre || session.user.name?.split(' ')[0] || '',
              apellido: session.user.apellido || session.user.name?.split(' ').slice(1).join(' ') || '',
              telefono: session.user.telefono || '',
              admin: process.env.ADMIN_EMAIL === session.user.email,
              createdAt: new Date(),
              lastLogin: new Date(),
              image: session.user.image || '',
              cursosComprados: []
            };
            
            const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
            if (resultado.acknowledged && resultado.insertedId) {
              session.user.id = resultado.insertedId.toString();
              console.log('API: Usuario creado durante la compra con ID:', session.user.id);
            } else {
              throw new Error('No se pudo crear el usuario');
            }
          }
        } else {
          // Si no tenemos email, no podemos hacer mucho
          return NextResponse.json(
            { 
              error: 'Tu cuenta aún está siendo procesada', 
              message: 'Por favor, espera unos segundos e intenta nuevamente. Si el problema persiste, cierra sesión y vuelve a iniciar sesión.' 
            },
            { status: 202 } // Accepted pero no procesado aún
          );
        }
      } catch (syncError) {
        console.error('API: Error al sincronizar usuario durante la compra:', syncError);
        return NextResponse.json(
          { 
            error: 'Error al procesar tu cuenta', 
            message: 'Por favor, cierra sesión y vuelve a iniciar sesión.' 
          },
          { status: 500 }
        );
      }
    }
    
    const data = await request.json();
    const { cursoId } = data;
    
    if (!cursoId) {
      console.log('API: Solicitud de compra sin ID de curso');
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    console.log('API: Solicitud de compra para curso:', cursoId, 'por usuario:', session.user.id);

    // Conectar a la base de datos
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
    } catch (dbError) {
      console.error('API: Error al conectar a la base de datos:', dbError);
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
      console.error('API: Error al convertir ID del curso:', error);
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
        console.log('API: Curso no encontrado:', cursoId);
        return NextResponse.json(
          { error: 'Curso no encontrado' },
          { status: 404 }
        );
      }
      console.log('API: Curso encontrado:', curso.titulo);
    } catch (cursoError) {
      console.error('API: Error al buscar el curso:', cursoError);
      return NextResponse.json(
        { error: 'Error al buscar el curso solicitado' },
        { status: 500 }
      );
    }
    
    // Verificar que el usuario exista en la base de datos
    let usuario;
    let userObjectId;
    
    try {
      // Primero intentar buscar por email (más confiable que el ID)
      if (session.user.email) {
        console.log('API: Buscando usuario por email:', session.user.email);
        usuario = await db.collection('usuarios').findOne({ email: session.user.email });
        
        if (usuario) {
          userObjectId = usuario._id;
          console.log('API: Usuario encontrado por email:', userObjectId.toString());
          
          // Si el ID en la sesión no coincide con el real, actualizamos la referencia
          if (session.user.id !== userObjectId.toString()) {
            console.log('API: Actualizando ID de sesión de', session.user.id, 'a', userObjectId.toString());
            session.user.id = userObjectId.toString();
          }
        }
      }
      
      // Si no encontramos por email, intentamos por ID
      if (!usuario && ObjectId.isValid(session.user.id)) {
        userObjectId = new ObjectId(session.user.id);
        console.log('API: Buscando usuario por ID:', userObjectId.toString());
        
        usuario = await db.collection('usuarios').findOne({ _id: userObjectId });
        if (usuario) {
          console.log('API: Usuario encontrado por ID:', userObjectId.toString());
        }
      }
      
      // Si todavía no encontramos al usuario, lo creamos
      if (!usuario) {
        if (!session.user.email) {
          console.error('API: No se puede crear usuario sin email');
          return NextResponse.json(
            { error: 'No se puede identificar tu cuenta. Por favor, cierra sesión y vuelve a iniciar.' },
            { status: 400 }
          );
        }
        
        console.log('API: Creando nuevo usuario para:', session.user.email);
        const nuevoUsuario = {
          email: session.user.email,
          nombre: session.user.nombre || session.user.name?.split(' ')[0] || '',
          apellido: session.user.apellido || session.user.name?.split(' ').slice(1).join(' ') || '',
          telefono: session.user.telefono || '',
          admin: process.env.ADMIN_EMAIL === session.user.email,
          createdAt: new Date(),
          lastLogin: new Date(),
          image: session.user.image || '',
          cursosComprados: []
        };
        
        const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
        
        if (resultado.acknowledged && resultado.insertedId) {
          usuario = nuevoUsuario;
          userObjectId = resultado.insertedId;
          session.user.id = userObjectId.toString();
          console.log('API: Usuario creado con ID:', userObjectId.toString());
        } else {
          throw new Error('No se pudo crear el usuario');
        }
      }
    } catch (usuarioError) {
      console.error('API: Error al buscar o crear el usuario:', usuarioError);
      return NextResponse.json(
        { error: 'Error al verificar o crear tu usuario' },
        { status: 500 }
      );
    }

    // Verificar si el usuario ya tiene el curso
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
      
      console.log('API: ¿El usuario ya tiene el curso?', tieneCursoComprado);
    }

    if (tieneCursoComprado) {
      console.log('API: El usuario ya tiene este curso');
      return NextResponse.json(
        { mensaje: 'Ya has comprado este curso anteriormente' },
        { status: 200 }
      );
    }
    
    // Aquí se implementaría la lógica de procesamiento de pago
    // Por ejemplo, integrando con Mercado Pago u otro gateway de pago
    
    // Simulación de procesamiento de pago exitoso
    // En un escenario real, solo se agregaría el curso al usuario tras confirmar el pago
    
    // Asegurarnos de que siempre almacenamos el ID como string para consistencia
    console.log('API: Registrando compra del curso:', curso.titulo, 'para usuario:', userObjectId.toString());

    try {
      // Preparar la actualización
      const resultado = await db.collection('usuarios').findOneAndUpdate(
        { _id: userObjectId },
        { 
          $addToSet: { cursosComprados: cursoId.toString() },
          $set: { ultimaCompra: new Date() }
        },
        { returnDocument: 'after' } // Retornar el documento actualizado
      );

      if (!resultado.ok || !resultado.value) {
        console.error('API: Error al actualizar el documento del usuario');
        throw new Error('No se pudo actualizar tu información');
      }

      // Verificar si el curso se agregó correctamente
      const usuarioActualizado = resultado.value;
      const cursoAgregado = usuarioActualizado.cursosComprados && 
                          Array.isArray(usuarioActualizado.cursosComprados) &&
                          usuarioActualizado.cursosComprados.includes(cursoId.toString());
                          
      if (!cursoAgregado) {
        console.log('API: El curso no aparece en la lista después de la actualización');
        
        // Intento de corrección: actualizar explícitamente con push
        const resultadoCorreccion = await db.collection('usuarios').updateOne(
          { _id: userObjectId },
          { $push: { cursosComprados: cursoId.toString() } }
        );
        
        if (!resultadoCorreccion.acknowledged || resultadoCorreccion.modifiedCount === 0) {
          console.error('API: No se pudo corregir la lista de cursos');
          throw new Error('Error al registrar el curso en tu lista');
        }
        
        console.log('API: Corrección aplicada, curso añadido mediante $push');
      }

      console.log('API: Compra registrada con éxito');

      // Devolver respuesta de éxito
      return NextResponse.json({ 
        mensaje: 'Curso comprado exitosamente', 
        curso: { 
          id: curso._id.toString(),
          titulo: curso.titulo
        } 
      });
    } catch (compraError) {
      console.error('API: Error durante el proceso de compra:', compraError);
      return NextResponse.json(
        { error: 'Error al registrar la compra: ' + compraError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error general al procesar la compra:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra del curso' },
      { status: 500 }
    );
  }
} 