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

/**
 * Endpoint especializado para gestionar videos fragmentados
 * Este endpoint se encarga específicamente de buscar archivos que fueron subidos
 * en fragmentos y combinarlos para servir el video completo.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API Videos Fragmentados: Solicitud para ID: ${params.id}`);
    
    // Validar el ID
    if (!params.id) {
      console.error('API Videos Fragmentados: ID no proporcionado');
      return NextResponse.json(
        { error: 'ID de video no proporcionado' },
        { status: 400 }
      );
    }
    
    // Conectar a MongoDB
    console.log(`API Videos Fragmentados: Buscando fragmentos para ID: ${params.id}`);
    const client = await clientPromise;
    const db = client.db();
    
    // Para fragmentos, primero buscar por metadata.fileId o filename que contenga el ID
    const fsCollection = await db.collection('fs.files').findOne({
      $or: [
        { 'metadata.fileId': params.id },
        { 'filename': { $regex: new RegExp(params.id, 'i') } },
        { '_id': new ObjectId(params.id) }
      ]
    });
    
    if (!fsCollection) {
      console.error(`API Videos Fragmentados: No se encontró archivo para ID: ${params.id}`);
      
      return NextResponse.json(
        { 
          error: 'Video fragmentado no encontrado',
          message: `No se encontró ningún archivo fragmentado con ID: ${params.id}`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Determinar el tipo de contenido del archivo
    const contentType = fsCollection.metadata?.contentType || 'video/mp4';
    
    // Crear el bucket para GridFS
    const bucket = new GridFSBucket(db);
    
    // Procesar encabezados de rango (Range) para streaming
    const rangeHeader = request.headers.get('range');
    const fileSize = fsCollection.length;
    
    // Si hay un encabezado de rango, procesar la solicitud de rango
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Limitar el tamaño del chunk para evitar problemas de memoria
      const maxChunkSize = 1024 * 1024 * 10; // 10MB
      const chunkSize = Math.min(end - start + 1, maxChunkSize);
      const adjustedEnd = start + chunkSize - 1;
      
      console.log(`API Videos Fragmentados: Procesando rango: ${start}-${adjustedEnd}/${fileSize}`);
      
      // Establecer cabeceras para streaming parcial
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Range', `bytes ${start}-${adjustedEnd}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', String(chunkSize));
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      // Crear un stream para leer el archivo con opciones de rango
      const downloadStream = bucket.openDownloadStream(fsCollection._id, {
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
            console.error('API Videos Fragmentados: Error al leer archivo:', error);
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
      console.log(`API Videos Fragmentados: Sirviendo archivo completo: ${fileSize} bytes`);
      
      // Establecer cabeceras para el archivo completo
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', String(fileSize));
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      // Crear un stream para leer el archivo completo
      const downloadStream = bucket.openDownloadStream(fsCollection._id);
      
      // Convertir el stream de Node.js a un ReadableStream web
      const readableStream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          downloadStream.on('error', (error) => {
            console.error('API Videos Fragmentados: Error al leer archivo:', error);
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
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error('API Videos Fragmentados: Error al servir video:', error);
    return NextResponse.json(
      { 
        error: 'Error al servir el video fragmentado', 
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 