import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic'; // Asegurar que siempre obtiene datos frescos

// GET /api/usuario/cursos - Obtener los cursos comprados por el usuario autenticado
export async function GET(request: Request) {
  console.log('API: Iniciando solicitud de cursos comprados');
  
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('API: No hay sesión activa o usuario en la sesión');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar si tenemos ID de usuario
    if (!session.user.id) {
      console.log('API: No hay ID de usuario en la sesión');
      return NextResponse.json(
        { error: 'Sesión incompleta. Por favor, cierra sesión y vuelve a iniciar.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    console.log('API: Obteniendo cursos comprados para el usuario:', userId);
    
    // Si el ID comienza con 'temp_', es un ID temporal
    if (userId.startsWith('temp_')) {
      console.log('API: ID temporal detectado, intentando sincronización inmediata');
      
      try {
        const { db } = await connectToDatabase();
        
        // Buscar si ya existe el usuario por email
        if (session.user.email) {
          const usuarioExistente = await db.collection('usuarios').findOne({ 
            email: session.user.email 
          });
          
          if (usuarioExistente) {
            console.log('API: Usuario encontrado por email:', usuarioExistente._id.toString());
            
            // Actualizar el ID en la sesión
            session.user.id = usuarioExistente._id.toString();
            
            // Continuar con la solicitud usando el nuevo ID
            return await manejarSolicitudCursos(session.user.id, session.user.email, db);
          } else {
            // Si no existe, crearlo inmediatamente
            console.log('API: Creando usuario durante solicitud de cursos para:', session.user.email);
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
              console.log('API: Usuario creado con ID:', session.user.id);
              
              // Nuevo usuario creado, no tiene cursos
              return NextResponse.json({ cursos: [] });
            }
          }
        }
        
        // Si llegamos aquí, no pudimos sincronizar el usuario
        console.log('API: No se pudo sincronizar el ID temporal');
        return NextResponse.json(
          { 
            error: 'Tu sesión está siendo procesada', 
            message: 'Por favor, espera unos segundos y vuelve a intentarlo.' 
          },
          { status: 202 } // Accepted - la solicitud se ha recibido pero aún no se ha actuado
        );
      } catch (syncError) {
        console.error('API: Error al sincronizar usuario temporal:', syncError);
        return NextResponse.json(
          { 
            error: 'Error al procesar tu cuenta', 
            message: 'Por favor, cierra sesión y vuelve a iniciar sesión.' 
          },
          { status: 500 }
        );
      }
    }
    
    // ID no temporal, conectar a la base de datos y procesar
    try {
      const { db } = await connectToDatabase();
      return await manejarSolicitudCursos(userId, session.user.email, db);
    } catch (dbError) {
      console.error('API: Error al conectar a la base de datos:', dbError);
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos', 
          message: 'Por favor, inténtalo de nuevo más tarde.' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error al obtener cursos del usuario:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener los cursos comprados',
        message: 'Por favor, inténtalo de nuevo más tarde.'
      },
      { status: 500 }
    );
  }
}

// Función para manejar la solicitud de cursos una vez que tenemos un ID válido
async function manejarSolicitudCursos(userId: string, email: string | null | undefined, db: any) {
  console.log('API: Procesando solicitud de cursos para usuario:', userId);
  
  // Buscar el usuario
  let usuario;
  let userQuery = {};
  
  try {
    // Decidir cómo buscar al usuario (ID o email)
    if (ObjectId.isValid(userId)) {
      userQuery = { _id: new ObjectId(userId) };
      console.log('API: Buscando usuario por ID:', userId);
    } else if (email) {
      userQuery = { email: email };
      console.log('API: Buscando usuario por email:', email);
    } else {
      throw new Error('No se dispone de información suficiente para identificar al usuario');
    }
    
    usuario = await db.collection('usuarios').findOne(userQuery);
  } catch (error) {
    console.error('API: Error al buscar usuario:', error);
    return NextResponse.json(
      { 
        error: 'Error al identificar usuario', 
        message: 'Por favor, cierra sesión y vuelve a iniciar.' 
      },
      { status: 400 }
    );
  }
  
  if (!usuario) {
    console.log('API: Usuario no encontrado con la consulta:', JSON.stringify(userQuery));
    return NextResponse.json(
      { 
        error: 'Usuario no encontrado', 
        message: 'Por favor, cierra sesión y vuelve a iniciarla.' 
      },
      { status: 404 }
    );
  }
  
  // Si el usuario no tiene cursos comprados, devolver un array vacío
  if (!usuario.cursosComprados || !Array.isArray(usuario.cursosComprados) || usuario.cursosComprados.length === 0) {
    console.log('API: El usuario no tiene cursos comprados');
    return NextResponse.json({ cursos: [] });
  }
  
  console.log('API: Usuario tiene cursos comprados:', usuario.cursosComprados);
  
  try {
    // Preparar una lista de IDs de cursos válidos
    const cursoIds = [];
    const cursosIdsString = new Set();
    
    for (const id of usuario.cursosComprados) {
      if (!id) continue; // Ignorar valores nulos o undefined
      
      try {
        // Guardar el ID como string para comparación
        if (typeof id === 'string') {
          cursosIdsString.add(id);
          // Intentar convertir a ObjectId si es válido
          if (ObjectId.isValid(id)) {
            cursoIds.push(new ObjectId(id));
          }
        } else if (id instanceof ObjectId) {
          cursoIds.push(id);
          cursosIdsString.add(id.toString());
        } else if (id && typeof id === 'object' && id._id) {
          const idStr = id._id.toString();
          cursosIdsString.add(idStr);
          if (ObjectId.isValid(idStr)) {
            cursoIds.push(new ObjectId(idStr));
          }
        }
      } catch (error) {
        console.error(`API: Error al procesar ID de curso (${id}):`, error);
      }
    }
    
    // Si no hay IDs válidos después de todo el procesamiento
    if (cursoIds.length === 0 && cursosIdsString.size === 0) {
      console.log('API: No se encontraron IDs válidos después del procesamiento');
      return NextResponse.json({ cursos: [] });
    }
    
    console.log(`API: Buscando cursos con ${cursoIds.length} ObjectIds y ${cursosIdsString.size} strings`);
    
    // Construir la consulta usando $or para mayor flexibilidad
    const query: any = { $or: [] };
    
    // Añadir búsqueda por ObjectId si hay ObjectIds válidos
    if (cursoIds.length > 0) {
      query.$or.push({ _id: { $in: cursoIds } });
    }
    
    // Añadir búsqueda por strings si hay strings
    if (cursosIdsString.size > 0) {
      const stringArray = Array.from(cursosIdsString);
      // Buscar tanto en _id como en el campo id si existe
      query.$or.push({ _id: { $in: stringArray } });
      query.$or.push({ id: { $in: stringArray } });
    }
    
    console.log('API: Consulta de cursos:', JSON.stringify(query));
    
    // Obtener los detalles de los cursos
    const cursos = await db.collection('cursos').find(query).toArray();
    
    console.log('API: Se encontraron', cursos.length, 'cursos');
    
    // Si no encontramos todos los cursos, loguear advertencia
    const totalIdsUnicos = new Set([...cursoIds.map(id => id.toString()), ...cursosIdsString]);
    if (cursos.length < totalIdsUnicos.size) {
      console.warn('API: No se encontraron todos los cursos. Encontrados:', cursos.length, 'de', totalIdsUnicos.size);
    }
    
    return NextResponse.json({ cursos });
  } catch (error) {
    console.error('API: Error al procesar IDs de cursos:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar los cursos', 
        detalles: error.message 
      },
      { status: 500 }
    );
  }
} 