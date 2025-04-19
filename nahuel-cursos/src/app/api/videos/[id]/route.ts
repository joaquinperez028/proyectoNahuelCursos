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

// Agregar verificación para prevenir bucles infinitos
const KNOWN_BAD_IDS = [
  '67fc1bcf6a2add8684b98814',
  '67fc1bcf6a2add0604b98814',
  'e4349070-10d5-4fbc-b7d9-d4e1e030c74',
  'e4349070-1bd5-4fbc-b7d9-d4e1e03b0c74'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API Videos: Solicitud para el video con ID: ${params.id}`);
    
    // Validar el ID
    if (!params.id) {
      console.error('API Videos: ID de video no proporcionado');
      return NextResponse.json(
        { error: 'ID de video no proporcionado' },
        { status: 400 }
      );
    }

    // Fix para los IDs problemáticos que causan bucles
    if (KNOWN_BAD_IDS.some(id => params.id.includes(id))) {
      console.log('API Videos: Detectado ID problemático, evitando bucle');
      return NextResponse.json(
        { 
          error: 'Este video necesita ser solicitado directamente, no a través de la API',
          message: `El video ${params.id} está causando bucles de redirección`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Si el ID no parece un ObjectId válido pero es una URL externa, redirigir
    if (params.id.startsWith('http')) {
      console.log('API Videos: Redirigiendo a URL externa:', params.id);
      return NextResponse.redirect(params.id);
    }
    
    // Si el ID parece un YouTube ID, redirigir a YouTube
    if (params.id.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(params.id)) {
      console.log('API Videos: Posible ID de YouTube, redirigiendo:', params.id);
      return NextResponse.redirect(`https://www.youtube.com/embed/${params.id}`);
    }
    
    // Intentar como ObjectId
    if (!ObjectId.isValid(params.id)) {
      console.error('API Videos: ID de video inválido:', params.id);
      return NextResponse.json(
        { error: 'ID de video inválido' },
        { status: 400 }
      );
    }
    
    const fileId = new ObjectId(params.id);
    
    // Conectar a MongoDB
    console.log(`API Videos: Buscando archivo con ID: ${fileId}`);
    const client = await clientPromise;
    const db = client.db();
    
    // Primero verificar si hay una referencia en la colección de cursos
    try {
      const curso = await db.collection('cursos').findOne({
        $or: [
          { video: params.id },
          { videoPreview: params.id },
          { video: fileId },
          { videoPreview: fileId }
        ]
      });
      
      if (curso) {
        console.log('API Videos: Encontrada referencia en curso:', curso._id);
        // Verificar si los campos contienen URLs externas
        if (curso.video === params.id && curso.video.startsWith('http')) {
          console.log('API Videos: Redirigiendo a URL externa del curso (video completo)');
          return NextResponse.redirect(curso.video);
        }
        if (curso.videoPreview === params.id && curso.videoPreview.startsWith('http')) {
          console.log('API Videos: Redirigiendo a URL externa del curso (vista previa)');
          return NextResponse.redirect(curso.videoPreview);
        }
      }
    } catch (error) {
      console.error('API Videos: Error al buscar referencia en cursos:', error);
      // Continuar con la búsqueda en GridFS aunque falle esta parte
    }
    
    // Buscar el archivo en ambas colecciones: videos.files y fs.files
    const videosCollection = await db.collection('videos.files').findOne({ _id: fileId });
    const fsCollection = await db.collection('fs.files').findOne({ _id: fileId });
    
    const files = videosCollection || fsCollection;
    
    if (!files) {
      console.error(`API Videos: No se encontró ningún archivo con ID: ${fileId}`);
      
      // Intentar buscar por metadata.fileId
      try {
        const fileByMetadata = await db.collection('fs.files').findOne({ 'metadata.fileId': params.id });
        
        if (fileByMetadata) {
          console.log(`API Videos: Archivo encontrado por metadata.fileId: ${params.id}`);
          return streamGridFSFile(db, fileByMetadata, request);
        }
      } catch (metadataError) {
        console.error('API Videos: Error al buscar por metadata:', metadataError);
      }
      
      // Como último recurso, comprobar si es una URL o referencia externa en la colección de cursos
      try {
        const curso = await db.collection('cursos').findOne({
          $or: [
            { video: { $regex: new RegExp(params.id, 'i') } },
            { videoPreview: { $regex: new RegExp(params.id, 'i') } }
          ]
        });
        
        if (curso) {
          // Intentar ver si alguno de los campos contiene el ID como parte de una URL
          if (curso.video && curso.video.includes(params.id)) {
            console.log('API Videos: Encontrada coincidencia parcial en video:', curso.video);
            if (curso.video.startsWith('http')) {
              return NextResponse.redirect(curso.video);
            }
          }
          if (curso.videoPreview && curso.videoPreview.includes(params.id)) {
            console.log('API Videos: Encontrada coincidencia parcial en videoPreview:', curso.videoPreview);
            if (curso.videoPreview.startsWith('http')) {
              return NextResponse.redirect(curso.videoPreview);
            }
          }
        }
      } catch (regexError) {
        console.error('API Videos: Error al buscar con regex:', regexError);
      }
      
      return NextResponse.json(
        { 
          error: 'Video no encontrado',
          message: `No se encontró ningún archivo con el ID: ${params.id}`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    return streamGridFSFile(db, files, request);
    
  } catch (error) {
    console.error('API Videos: Error al servir el video:', error);
    return NextResponse.json(
      { 
        error: 'Error al servir el video', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
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