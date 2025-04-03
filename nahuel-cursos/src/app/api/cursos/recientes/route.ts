import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Calcular la fecha de hace 14 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 14);
    
    // Buscar cursos creados en los últimos 14 días
    let cursos = await db.collection('cursos')
      .find({
        fechaCreacion: { $gte: fechaLimite }
      })
      .sort({ fechaCreacion: -1 })
      .limit(4) // Limitamos a 4 cursos recientes
      .toArray();
    
    // Si no hay cursos en los últimos 14 días, obtenemos el más reciente
    if (cursos.length === 0) {
      cursos = await db.collection('cursos')
        .find()
        .sort({ fechaCreacion: -1 })
        .limit(1)
        .toArray();
    }
    
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
    
    return NextResponse.json({ 
      cursos, 
      esReciente: cursos.length > 0 && new Date(cursos[0].fechaCreacion) >= fechaLimite 
    });
  } catch (error) {
    console.error('Error al obtener cursos recientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos recientes' },
      { status: 500 }
    );
  }
} 