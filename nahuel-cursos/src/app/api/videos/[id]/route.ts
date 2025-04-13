import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

// Configuración para respuestas de streaming
export const config = {
  api: {
    responseLimit: false,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar el ID
    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'ID de video inválido' },
        { status: 400 }
      );
    }
    
    const fileId = new ObjectId(params.id);
    
    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Crear un GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'videos'
    });
    
    // Buscar el archivo
    const files = await db.collection('videos.files').findOne({ _id: fileId });
    
    if (!files) {
      // Intentar encontrar en el bucket por defecto (fs.files)
      const fsFiles = await db.collection('fs.files').findOne({ _id: fileId });
      
      if (!fsFiles) {
        return NextResponse.json(
          { error: 'Video no encontrado' },
          { status: 404 }
        );
      }
      
      // Encontrado en el bucket por defecto, usar ese en lugar del bucket 'videos'
      const contentType = fsFiles.metadata?.contentType || 'video/mp4';
      
      // Establecer cabeceras para Etag y almacenamiento en caché
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      
      // Crear un GridFS bucket por defecto
      const defaultBucket = new GridFSBucket(db);
      
      // Crear un stream para leer el archivo
      const downloadStream = defaultBucket.openDownloadStream(fileId);
      
      // Convertir el stream de Node.js a un ReadableStream web
      const readableStream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          downloadStream.on('error', (error) => {
            console.error('Error al leer el archivo:', error);
            controller.error(error);
          });
          
          downloadStream.on('end', () => {
            controller.close();
          });
        },
        cancel() {
          downloadStream.destroy();
        }
      });
      
      // Devolver la respuesta con el stream
      return new Response(readableStream, {
        headers,
      });
    }
    
    // Continuar con el código existente para el bucket 'videos'
    // Obtener el tipo de contenido del archivo
    const contentType = files.metadata?.contentType || 'video/mp4';
    
    // Establecer cabeceras para Etag y almacenamiento en caché
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    
    // Crear un stream para leer el archivo
    const downloadStream = bucket.openDownloadStream(fileId);
    
    // Convertir el stream de Node.js a un ReadableStream web
    const readableStream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        
        downloadStream.on('error', (error) => {
          console.error('Error al leer el archivo:', error);
          controller.error(error);
        });
        
        downloadStream.on('end', () => {
          controller.close();
        });
      },
      cancel() {
        downloadStream.destroy();
      }
    });
    
    // Devolver la respuesta con el stream
    return new Response(readableStream, {
      headers,
    });
    
  } catch (error) {
    console.error('Error al servir el video:', error);
    return NextResponse.json(
      { error: 'Error al servir el video' },
      { status: 500 }
    );
  }
} 