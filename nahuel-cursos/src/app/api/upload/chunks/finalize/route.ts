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
        console.log(`Iniciando procesamiento secuencial de ${sortedChunkIds.length} fragmentos`);
        
        // Crear un array para almacenar todos los buffers
        const allBuffers: Buffer[] = [];
        
        // Primero, descargar todos los fragmentos individualmente
        for (let i = 0; i < sortedChunkIds.length; i++) {
          const chunkId = sortedChunkIds[i];
          console.log(`Descargando fragmento ${i + 1}/${sortedChunkIds.length} (ID: ${chunkId.toString()})`);
          
          // Crear un buffer para almacenar este fragmento
          const bufferChunks: Buffer[] = [];
          
          // Descargar el fragmento y almacenarlo en memoria
          await new Promise<void>((resolve, reject) => {
            const downloadStream = chunksBucket.openDownloadStream(chunkId);
            
            downloadStream.on('error', (error) => {
              console.error(`Error al descargar fragmento ${i + 1}:`, error);
              reject(new Error(`Error al descargar fragmento ${i + 1}: ${error.message || 'Error desconocido'}`));
            });
            
            downloadStream.on('data', (chunk) => {
              bufferChunks.push(chunk);
            });
            
            downloadStream.on('end', () => {
              console.log(`Fragmento ${i + 1} descargado correctamente. Tamaño: ${bufferChunks.reduce((total, buf) => total + buf.length, 0)} bytes`);
              resolve();
            });
          });
          
          // Combinar los fragmentos buffer en uno solo para este fragmento
          if (bufferChunks.length > 0) {
            const completeChunkBuffer = Buffer.concat(bufferChunks);
            console.log(`Fragmento ${i + 1} concatenado. Tamaño: ${completeChunkBuffer.length} bytes`);
            allBuffers.push(completeChunkBuffer);
          } else {
            console.warn(`Fragmento ${i + 1} no tiene contenido`);
          }
        }
        
        // Ahora combinar todos los buffers en un solo archivo
        if (allBuffers.length === 0) {
          throw new Error('No se pudieron obtener datos de ningún fragmento');
        }
        
        console.log(`Combinando ${allBuffers.length} buffers en un solo archivo...`);
        const finalBuffer = Buffer.concat(allBuffers);
        console.log(`Buffer final creado. Tamaño total: ${finalBuffer.length} bytes`);
        
        // Subir el buffer combinado como un solo archivo
        await new Promise<void>((resolve, reject) => {
          uploadStream.on('error', (error) => {
            console.error('Error al subir el archivo combinado:', error);
            reject(new Error(`Error al subir el archivo final: ${error.message || 'Error desconocido'}`));
          });
          
          uploadStream.on('finish', () => {
            console.log('Archivo combinado y subido correctamente');
            resolve();
          });
          
          // Escribir el buffer completo al stream
          try {
            console.log('Escribiendo buffer combinado al stream...');
            uploadStream.write(finalBuffer, (writeError) => {
              if (writeError) {
                console.error('Error al escribir buffer combinado:', writeError);
                reject(new Error(`Error al escribir el archivo final: ${writeError.message || 'Error desconocido'}`));
                return;
              }
              
              console.log('Buffer escrito correctamente. Finalizando stream...');
              uploadStream.end((endError) => {
                if (endError) {
                  console.error('Error al finalizar el stream:', endError);
                  reject(new Error(`Error al finalizar el stream: ${endError.message || 'Error desconocido'}`));
                }
              });
            });
          } catch (streamError: any) {
            console.error('Error en operación de stream:', streamError);
            reject(new Error(`Error en el stream: ${streamError.message || 'Error desconocido'}`));
          }
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