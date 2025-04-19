import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    // Verificar autenticación (opcional - puedes descomentar si quieres proteger este endpoint)
    /*
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    */
    
    console.log('Iniciando reparación de URLs de videos...');
    
    // Conectar a la base de datos
    const { db } = await connectToDatabase();
    
    // Obtener todos los cursos
    const cursos = await db.collection('cursos').find({}).toArray();
    console.log(`Se encontraron ${cursos.length} cursos para revisar.`);
    
    const estadisticas = {
      total: cursos.length,
      reparados: 0,
      errores: 0,
      sinCambios: 0,
      detalles: [] as any[]
    };
    
    // Procesar cada curso
    for (const curso of cursos) {
      console.log(`Procesando curso: ${curso._id} - ${curso.titulo}`);
      let fueModificado = false;
      const cambios: any = {
        cursoId: curso._id,
        titulo: curso.titulo,
        cambiosRealizados: {}
      };
      
      // Verificar y reparar el campo video
      if (curso.video) {
        const videoReparado = repararUrlVideo(curso.video);
        if (videoReparado !== curso.video) {
          cambios.cambiosRealizados.video = {
            antes: curso.video,
            despues: videoReparado
          };
          
          // Actualizar en la base de datos
          await db.collection('cursos').updateOne(
            { _id: curso._id },
            { $set: { video: videoReparado }}
          );
          fueModificado = true;
        }
      }
      
      // Verificar y reparar el campo videoPreview
      if (curso.videoPreview) {
        const previewReparado = repararUrlVideo(curso.videoPreview);
        if (previewReparado !== curso.videoPreview) {
          cambios.cambiosRealizados.videoPreview = {
            antes: curso.videoPreview,
            despues: previewReparado
          };
          
          // Actualizar en la base de datos
          await db.collection('cursos').updateOne(
            { _id: curso._id },
            { $set: { videoPreview: previewReparado }}
          );
          fueModificado = true;
        }
      }
      
      // Actualizar estadísticas
      if (fueModificado) {
        estadisticas.reparados++;
        estadisticas.detalles.push(cambios);
      } else {
        estadisticas.sinCambios++;
      }
    }
    
    console.log('Reparación completada:', estadisticas);
    return NextResponse.json({
      success: true,
      estadisticas
    });
  } catch (error) {
    console.error('Error al reparar videos:', error);
    return NextResponse.json(
      { error: 'Error al reparar videos', detalles: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Función para reparar URLs de video
function repararUrlVideo(url: string): string {
  if (!url) return url;
  
  // Caso 1: URL de YouTube directa (no embebida)
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Caso 2: URL corta de YouTube
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Caso 3: URL de Vimeo directa (no embebida)
  if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }
  
  // Caso 4: URL local sin barra inicial
  if (url.includes('uploads/') && !url.startsWith('/')) {
    return `/${url}`;
  }
  
  // Caso 5: ObjectId almacenado como objeto en lugar de string
  if (typeof url === 'object' && url !== null && '_id' in url) {
    return url._id.toString();
  }
  
  // Si no coincide con ningún caso, devolver la URL original
  return url;
} 