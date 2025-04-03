import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET() {
  console.log('API: Iniciando solicitud de cursos recientes');
  
  try {
    // Intentar conectar a la base de datos
    console.log('API: Conectando a la base de datos...');
    const { db } = await connectToDatabase();
    console.log('API: Conexión exitosa a la base de datos');
    
    // Verificar si la colección de cursos existe
    const colecciones = await db.listCollections({ name: 'cursos' }).toArray();
    if (colecciones.length === 0) {
      console.log('API: La colección de cursos no existe');
      return NextResponse.json(
        { 
          error: 'La colección de cursos no existe', 
          solucion: 'Utilice el endpoint /api/seed-public para crear datos de ejemplo' 
        },
        { status: 404 }
      );
    }
    
    // Calcular la fecha de hace 14 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 14);
    
    // Verificar si hay algún curso en la base de datos
    const totalCursos = await db.collection('cursos').countDocuments();
    if (totalCursos === 0) {
      console.log('API: No hay cursos en la base de datos');
      return NextResponse.json(
        { 
          error: 'No hay cursos en la base de datos',
          solucion: 'Utilice el endpoint /api/seed-public para crear datos de ejemplo'
        },
        { status: 404 }
      );
    }
    
    console.log(`API: La base de datos contiene ${totalCursos} cursos`);
    
    // Buscar cursos creados en los últimos 14 días
    console.log('API: Buscando cursos recientes...');
    let cursos = await db.collection('cursos')
      .find({
        fechaCreacion: { $gte: fechaLimite }
      })
      .sort({ fechaCreacion: -1 })
      .limit(4) // Limitamos a 4 cursos recientes
      .toArray();
    
    // Si no hay cursos en los últimos 14 días, obtenemos el más reciente
    if (cursos.length === 0) {
      console.log('API: No hay cursos recientes, obteniendo los más antiguos');
      cursos = await db.collection('cursos')
        .find()
        .sort({ fechaCreacion: -1 })
        .limit(4)
        .toArray();
    }
    
    console.log(`API: Se encontraron ${cursos.length} cursos`);
    
    // Obtener las valoraciones de cada curso
    for (const curso of cursos) {
      // Verificar si el curso ya tiene la información de valoración
      if (curso.calificacionPromedio === undefined) {
        const valoraciones = await db
          .collection('valoraciones')
          .find({ cursoId: curso._id })
          .toArray();
          
        if (valoraciones.length > 0) {
          const suma = valoraciones.reduce((acc: number, val: any) => acc + val.calificacion, 0);
          curso.calificacionPromedio = suma / valoraciones.length;
          curso.totalValoraciones = valoraciones.length;
        } else {
          curso.calificacionPromedio = 0;
          curso.totalValoraciones = 0;
        }
      }
      
      // No enviar el video completo
      if (curso.video) {
        delete curso.video;
      }
    }
    
    console.log('API: Respuesta de cursos recientes generada correctamente');
    return NextResponse.json({ 
      cursos, 
      esReciente: cursos.length > 0 && new Date(cursos[0].fechaCreacion) >= fechaLimite 
    });
  } catch (error: any) {
    console.error('Error al obtener cursos recientes:', error);
    
    // Determinar la naturaleza del error
    let mensajeError = 'Error al obtener los cursos recientes';
    let codigoEstado = 500;
    
    if (error.name === 'MongoNetworkError' || error.message?.includes('connect')) {
      mensajeError = 'Error de conexión a la base de datos';
      codigoEstado = 503; // Service Unavailable
    } else if (error.name === 'MongoServerSelectionError') {
      mensajeError = 'No se puede conectar al servidor de MongoDB';
      codigoEstado = 503;
    } else if (error.name === 'MongoError' && error.code === 13) {
      mensajeError = 'Error de autenticación en la base de datos';
      codigoEstado = 401;
    }
    
    return NextResponse.json(
      { 
        error: mensajeError,
        detalle: error.message,
        solucion: 'Verifique la conexión a la base de datos y los datos de acceso' 
      },
      { status: codigoEstado }
    );
  }
} 