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
      console.error('ID de video inválido:', params.id);
      return NextResponse.json(
        { error: 'ID de video inválido' },
        { status: 400 }
      );
    }
    
    const fileId = new ObjectId(params.id);
    
    // Conectar a MongoDB
    console.log(`Buscando archivo con ID: ${fileId}`);
    const client = await clientPromise;
    const db = client.db();
    
    // Buscar el archivo en ambas colecciones: videos.files y fs.files
    const videosCollection = await db.collection('videos.files').findOne({ _id: fileId });
    const fsCollection = await db.collection('fs.files').findOne({ _id: fileId });
    
    const files = videosCollection || fsCollection;
    
    if (!files) {
      console.error(`No se encontró ningún archivo con ID: ${fileId}`);
      
      // Intentar buscar por metadata.fileId
      const fileByMetadata = await db.collection('fs.files').findOne({ 'metadata.fileId': params.id });
      
      if (fileByMetadata) {
        console.log(`Archivo encontrado por metadata.fileId: ${params.id}`);
        return streamGridFSFile(db, fileByMetadata, request);
      }
      
      return NextResponse.json(
        { error: 'Video no encontrado' },
        { status: 404 }
      );
    }
    
    return streamGridFSFile(db, files, request);
    
  } catch (error) {
    console.error('Error al servir el video:', error);
    return NextResponse.json(
      { error: 'Error al servir el video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Función auxiliar para stream de archivos GridFS
async function streamGridFSFile(db: any, file: any, request: NextRequest) {
  try {
    // Determinar qué bucket usar basado en la colección donde se encontró el archivo
    const isVideoBucket = file._id.toString().includes('videos.files') || file.filename?.includes('videos.');
    const bucketName = isVideoBucket ? 'videos' : undefined; // undefined para usar el bucket por defecto (fs)
    
    console.log(`Usando bucket "${bucketName || 'fs'}" para servir el archivo`);
    
    // Obtener el tipo de contenido del archivo
    const contentType = file.metadata?.contentType || 'video/mp4';
    
    // Crear el bucket apropiado
    const bucket = new GridFSBucket(db, bucketName ? { bucketName } : undefined);
    
    // Procesar encabezados de rango (Range) para streaming
    const rangeHeader = request.headers.get('range');
    const fileSize = file.length;
    
    // Si hay un encabezado de rango, procesar la solicitud de rango
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Limitar el tamaño del chunk para evitar problemas de memoria
      const maxChunkSize = 1024 * 1024 * 10; // 10MB
      const chunkSize = Math.min(end - start + 1, maxChunkSize);
      const adjustedEnd = start + chunkSize - 1;
      
      console.log(`Procesando solicitud de rango: ${start}-${adjustedEnd}/${fileSize} (${contentType})`);
      
      // Establecer cabeceras para streaming parcial
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Range', `bytes ${start}-${adjustedEnd}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', String(chunkSize));
      headers.set('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      
      // Crear un stream para leer el archivo con opciones de rango
      const downloadStream = bucket.openDownloadStream(file._id, {
        start,
        end: adjustedEnd
      });
      
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
      
      // Devolver la respuesta con código 206 Partial Content
      return new Response(readableStream, {
        status: 206,
        headers,
      });
    } else {
      // Si no hay encabezado de rango, devolver el archivo completo
      console.log(`Sirviendo archivo completo: ${fileSize} bytes (${contentType})`);
      
      // Establecer cabeceras para el archivo completo
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', String(fileSize));
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      
      // Crear un stream para leer el archivo completo
      const downloadStream = bucket.openDownloadStream(file._id);
      
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
      
      // Devolver la respuesta completa
      return new Response(readableStream, {
        headers,
      });
    }
  } catch (error) {
    console.error('Error en streamGridFSFile:', error);
    throw error;
  }
} 