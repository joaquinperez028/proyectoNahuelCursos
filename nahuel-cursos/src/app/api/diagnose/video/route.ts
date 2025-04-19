import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

/**
 * Endpoint para diagnóstico de problemas con videos
 * Permite hacer consultas para verificar qué archivos están disponibles en la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('id');
    const action = searchParams.get('action') || 'find';

    // Validar parámetros
    if (!videoId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro id' },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Acción: buscar archivo
    if (action === 'find') {
      const idToFind = videoId;
      const results = {};

      // Buscar en diferentes colecciones
      try {
        // Buscar en fs.files
        const fsFile = await db.collection('fs.files').findOne({
          $or: [
            { _id: new ObjectId(idToFind) },
            { 'metadata.fileId': idToFind },
            { filename: { $regex: idToFind, $options: 'i' } }
          ]
        });
        results['fs.files'] = fsFile ? {
          id: fsFile._id.toString(),
          length: fsFile.length,
          filename: fsFile.filename,
          contentType: fsFile.metadata?.contentType || 'unknown',
          uploadDate: fsFile.uploadDate
        } : null;

        // Buscar en videos.files
        const videosFile = await db.collection('videos.files').findOne({
          $or: [
            { _id: new ObjectId(idToFind) },
            { 'metadata.fileId': idToFind },
            { filename: { $regex: idToFind, $options: 'i' } }
          ]
        });
        results['videos.files'] = videosFile ? {
          id: videosFile._id.toString(),
          length: videosFile.length,
          filename: videosFile.filename,
          contentType: videosFile.metadata?.contentType || 'unknown',
          uploadDate: videosFile.uploadDate
        } : null;

        // Buscar en cursos
        const curso = await db.collection('cursos').findOne({
          $or: [
            { video: idToFind },
            { videoPreview: idToFind },
            { video: { $regex: idToFind, $options: 'i' } },
            { videoPreview: { $regex: idToFind, $options: 'i' } }
          ]
        });
        results['cursos'] = curso ? {
          id: curso._id.toString(),
          titulo: curso.titulo,
          video: curso.video,
          videoPreview: curso.videoPreview
        } : null;

        // Verificar fragmentos
        const chunks = await db.collection('fs.chunks').find({
          files_id: new ObjectId(idToFind)
        }).count();
        results['chunks'] = { count: chunks };

      } catch (error) {
        console.error('Error durante la búsqueda:', error);
      }

      return NextResponse.json({
        id: idToFind,
        results,
        timestamp: new Date().toISOString()
      });
    }

    // Acción no soportada
    return NextResponse.json(
      { error: 'Acción no soportada' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en diagnóstico de video:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 