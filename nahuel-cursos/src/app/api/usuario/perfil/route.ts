import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { connectToDatabase } from '@/lib/db/connection';
import { ObjectId } from 'mongodb';

// Endpoint para obtener datos del perfil del usuario actual
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } } // Excluir la contraseña
    );

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del perfil' },
      { status: 500 }
    );
  }
}

// Endpoint para actualizar el perfil
export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('Error de autenticación: Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Usuario autenticado:', session.user.id);
    
    const { telefono } = await req.json();
    console.log('Teléfono recibido para actualizar:', telefono);

    // Validar que el teléfono tenga un formato válido (si se proporciona)
    if (telefono !== undefined && telefono !== null && telefono !== '') {
      const telefonoRegex = /^[0-9+\s()-]{5,15}$/;
      if (!telefonoRegex.test(telefono)) {
        console.log('Formato de teléfono no válido:', telefono);
        return NextResponse.json(
          { error: 'Formato de teléfono no válido' },
          { status: 400 }
        );
      }
    }

    try {
      // Obtener conexión a la base de datos
      const db = await connectToDatabase();
      console.log('Conexión a la base de datos establecida');
      
      // Verificar si el usuario existe en la base de datos antes de actualizar
      const usuarioExistente = await db.collection('usuarios').findOne(
        { _id: new ObjectId(session.user.id) }
      );
      
      if (!usuarioExistente) {
        console.log('Usuario no encontrado en la base de datos:', session.user.id);
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      console.log('Usuario encontrado:', usuarioExistente._id.toString());
      console.log('Teléfono actual:', usuarioExistente.telefono);
      console.log('Teléfono a establecer:', telefono);
      
      // Asegurémonos de que el teléfono sea una cadena
      const telefonoNormalizado = telefono?.toString() || '';
      console.log('Teléfono normalizado para guardar en BD:', telefonoNormalizado);
      
      // Actualizar los datos del perfil - usamos una actualización directa y verificamos el resultado
      const updateResult = await db.collection('usuarios').updateOne(
        { _id: new ObjectId(session.user.id) },
        { 
          $set: { 
            telefono: telefonoNormalizado,
            updatedAt: new Date()
          } 
        },
        { upsert: false } // Asegurarse de que solo actualice si existe
      );

      console.log('Resultado de la actualización:', {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        upsertedCount: updateResult.upsertedCount,
      });

      // Verificar si el documento fue encontrado
      if (updateResult.matchedCount === 0) {
        console.log('Error: Usuario no encontrado durante la actualización');
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Obtener el usuario actualizado para verificar
      const usuarioActualizado = await db.collection('usuarios').findOne(
        { _id: new ObjectId(session.user.id) }
      );
      
      console.log('Teléfono después de la actualización:', usuarioActualizado?.telefono);
      
      // Verificar si el documento fue realmente modificado
      if (updateResult.modifiedCount === 0) {
        console.log('No se realizaron cambios (el valor es el mismo)');
        
        return NextResponse.json({
          success: true, 
          message: 'No se realizaron cambios (el valor es el mismo)',
          telefonoActual: usuarioActualizado?.telefono
        });
      }

      // Enviar respuesta con los datos actualizados
      if (!usuarioActualizado) {
        console.log('No se pudo recuperar el usuario actualizado después de la modificación');
        return NextResponse.json({ 
          success: true,
          message: 'Perfil actualizado, pero no se pudieron recuperar los detalles'
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Perfil actualizado correctamente',
        usuario: {
          id: usuarioActualizado._id.toString(),
          email: usuarioActualizado.email,
          nombre: usuarioActualizado.nombre,
          apellido: usuarioActualizado.apellido,
          telefono: usuarioActualizado.telefono
        }
      });
    } catch (dbError) {
      console.error('Error al interactuar con la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error interno de la base de datos' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error general al actualizar perfil:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
} 