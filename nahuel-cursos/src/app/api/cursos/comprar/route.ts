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
    const usuarioQuery = { _id: new ObjectId(session.user.id) };
    console.log('Buscando usuario con ID:', session.user.id);

    let usuario = await db.collection('usuarios').findOne(usuarioQuery);

    if (!usuario) {
      console.log('Usuario no encontrado en base de datos');
      return NextResponse.json(
        { error: 'No se encontró el usuario en la base de datos' },
        { status: 404 }
      );
    }

    console.log('Usuario encontrado, revisando cursos comprados');

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
    // También actualizamos en un campo nuevo para futuras búsquedas más eficientes
    console.log('Registrando compra con ID:', cursoId.toString());

    // Preparar la actualización con operadores más seguros
    const resultado = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(session.user.id) },
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
        _id: new ObjectId(session.user.id)
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
      userId: session.user.id,
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
  } catch (error) {
    console.error('Error al procesar la compra:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra del curso' },
      { status: 500 }
    );
  }
} 