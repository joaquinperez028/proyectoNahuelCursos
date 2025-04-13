import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Esta API acepta solicitudes JSON para finalizar la subida
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      console.log('Intento de finalización no autorizado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener datos de la solicitud
    const data = await req.json();
    const { fileId, fileName, contentType, totalChunks } = data;
    
    // Validar datos
    if (!fileId || !fileName || !contentType || !totalChunks) {
      return NextResponse.json(
        { error: 'Información de finalización incompleta' },
        { status: 400 }
      );
    }
    
    console.log(`Procesando finalización para archivo ${fileName}, ID: ${fileId}`);
    
    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Crear buckets para fragmentos y para el archivo final
    const chunksBucket = new GridFSBucket(db, { bucketName: 'chunks' });
    const videosBucket = new GridFSBucket(db, { bucketName: 'videos' });
    
    // Verificar que tenemos todos los fragmentos
    const chunksCollection = db.collection('chunks.files');
    const existingChunks = await chunksCollection.find({
      'metadata.parentFileId': fileId
    }).toArray();
    
    if (existingChunks.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron fragmentos para este archivo' },
        { status: 404 }
      );
    }
    
    if (existingChunks.length < totalChunks) {
      console.warn(`Faltan fragmentos: ${existingChunks.length}/${totalChunks}`);
      return NextResponse.json(
        { error: `Faltan fragmentos: ${existingChunks.length}/${totalChunks}` },
        { status: 400 }
      );
    }
    
    console.log(`Se encontraron todos los fragmentos: ${existingChunks.length}/${totalChunks}`);
    
    // Generar un nombre único para el archivo final
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();
    const finalFileName = `${timestamp}-${randomString}.${extension}`;
    
    // Crear un ID para el archivo final
    const finalFileId = new ObjectId();
    
    // Crear un stream para subir el archivo combinado
    const uploadStream = videosBucket.openUploadStreamWithId(finalFileId, finalFileName, {
      metadata: {
        originalFilename: fileName,
        contentType: contentType,
        size: existingChunks.reduce((total, chunk) => total + chunk.length, 0),
        uploadedBy: session.user.email,
        uploadedAt: new Date(),
        source: 'chunked_upload',
        originalFileId: fileId
      }
    });
    
    // Organizar los fragmentos por índice
    const sortedChunkIds = existingChunks
      .sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex)
      .map(chunk => chunk._id);
    
    // Función para procesar los fragmentos secuencialmente
    const processChunks = async () => {
      try {
        for (let i = 0; i < sortedChunkIds.length; i++) {
          const chunkId = sortedChunkIds[i];
          console.log(`Procesando fragmento ${i + 1}/${sortedChunkIds.length}`);
          
          // Descargar el fragmento
          const downloadStream = chunksBucket.openDownloadStream(chunkId);
          
          // Esperar a que se complete la descarga y escritura
          await new Promise<void>((resolve, reject) => {
            downloadStream.on('error', (error) => {
              console.error(`Error al descargar fragmento ${i + 1}:`, error);
              reject(error);
            });
            
            downloadStream.on('end', () => {
              console.log(`Fragmento ${i + 1} añadido al archivo final`);
              resolve();
            });
            
            // Conectar el stream de descarga al stream de subida
            downloadStream.pipe(uploadStream, { end: i === sortedChunkIds.length - 1 });
          });
        }
        
        // Esperar a que se complete la subida del archivo combinado
        return new Promise<void>((resolve, reject) => {
          uploadStream.on('error', (error) => {
            console.error('Error al finalizar la combinación de fragmentos:', error);
            reject(error);
          });
          
          uploadStream.on('finish', () => {
            console.log('Archivo combinado correctamente');
            resolve();
          });
        });
        
      } catch (error) {
        console.error('Error durante el procesamiento de fragmentos:', error);
        uploadStream.abort();
        throw error;
      }
    };
    
    try {
      // Procesar y combinar los fragmentos
      await processChunks();
      
      // Generar la URL para acceder al archivo final
      const videoUrl = `/api/videos/${finalFileId.toString()}`;
      
      // Opcional: Eliminar los fragmentos originales para liberar espacio
      /* 
      for (const chunkId of sortedChunkIds) {
        await chunksBucket.delete(chunkId);
      }
      console.log('Fragmentos originales eliminados');
      */
      
      // Devolver la información del archivo final
      return NextResponse.json({
        success: true,
        message: 'Archivo combinado correctamente',
        filePath: videoUrl,
        fileName: fileName,
        fileId: finalFileId.toString()
      });
      
    } catch (processingError: any) {
      console.error('Error al procesar fragmentos:', processingError);
      return NextResponse.json(
        { error: processingError.message || 'Error al combinar fragmentos' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error general en finalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el proceso de finalización' },
      { status: 500 }
    );
  }
} 