import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuración para manejar tamaños pequeños (cada fragmento será pequeño)
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};

// Estructura temporal para almacenar información sobre archivos en proceso de carga
interface ChunkMetadata {
  fileName: string;
  contentType: string;
  totalChunks: number;
  receivedChunks: number[];
  uploadDate: Date;
}

// Mapa global para rastrear los fragmentos recibidos por fileId
const chunksTracker = new Map<string, ChunkMetadata>();

// Función para limpiar entradas antiguas del tracker (llamada periódicamente)
const cleanupTracker = () => {
  const oneHourAgo = new Date(Date.now() - 3600000); // 1 hora
  for (const [fileId, metadata] of chunksTracker.entries()) {
    if (metadata.uploadDate < oneHourAgo) {
      console.log(`Limpiando rastreo obsoleto para fileId: ${fileId}`);
      chunksTracker.delete(fileId);
    }
  }
};

// Programar limpieza cada hora
setInterval(cleanupTracker, 3600000);

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      console.log('Intento de subida fragmentada no autorizado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('Procesando fragmento de archivo...');
    
    // Obtener formData
    const formData = await req.formData();
    
    try {
      // Extraer y validar datos con un mejor manejo de errores
      const chunk = formData.get('chunk');
      if (!chunk || !(chunk instanceof Blob)) {
        console.error('Error: El fragmento no es válido o no es un Blob', chunk);
        return NextResponse.json(
          { error: 'Fragmento inválido o no proporcionado' },
          { status: 400 }
        );
      }
      
      const fileName = formData.get('fileName');
      if (!fileName || typeof fileName !== 'string') {
        console.error('Error: Nombre de archivo inválido', fileName);
        return NextResponse.json(
          { error: 'Nombre de archivo inválido o no proporcionado' },
          { status: 400 }
        );
      }
      
      const contentType = formData.get('contentType');
      if (!contentType || typeof contentType !== 'string') {
        console.error('Error: Tipo de contenido inválido', contentType);
        return NextResponse.json(
          { error: 'Tipo de contenido inválido o no proporcionado' },
          { status: 400 }
        );
      }
      
      const totalChunksStr = formData.get('totalChunks');
      if (!totalChunksStr || typeof totalChunksStr !== 'string') {
        console.error('Error: Total de fragmentos inválido', totalChunksStr);
        return NextResponse.json(
          { error: 'Total de fragmentos inválido o no proporcionado' },
          { status: 400 }
        );
      }
      const totalChunks = parseInt(totalChunksStr);
      if (isNaN(totalChunks) || totalChunks <= 0) {
        console.error('Error: Total de fragmentos no es un número válido', totalChunks);
        return NextResponse.json(
          { error: 'Total de fragmentos debe ser un número positivo' },
          { status: 400 }
        );
      }
      
      const currentChunkStr = formData.get('currentChunk');
      if (!currentChunkStr || typeof currentChunkStr !== 'string') {
        console.error('Error: Índice de fragmento actual inválido', currentChunkStr);
        return NextResponse.json(
          { error: 'Índice de fragmento actual inválido o no proporcionado' },
          { status: 400 }
        );
      }
      const currentChunk = parseInt(currentChunkStr);
      if (isNaN(currentChunk) || currentChunk < 0 || currentChunk >= totalChunks) {
        console.error('Error: Índice de fragmento fuera de rango', currentChunk, totalChunks);
        return NextResponse.json(
          { error: `Índice de fragmento debe estar entre 0 y ${totalChunks - 1}` },
          { status: 400 }
        );
      }
      
      let fileId = formData.get('fileId') as string | null;
      
      console.log(`Fragmento validado: ${currentChunk + 1}/${totalChunks} para ${fileName}`);
      console.log(`Tamaño del fragmento: ${(chunk as Blob).size} bytes, tipo: ${(chunk as Blob).type || contentType}`);
      
      // Conectar a MongoDB
      const client = await clientPromise;
      const db = client.db();
      
      // Crear o recuperar un bucket para los fragmentos
      const bucket = new GridFSBucket(db, {
        bucketName: 'chunks'
      });
      
      // Si es el primer fragmento y no hay fileId, creamos uno nuevo
      if (currentChunk === 0 && !fileId) {
        fileId = new ObjectId().toString();
        console.log(`Iniciando nueva subida fragmentada con ID: ${fileId}`);
        
        // Iniciar el seguimiento
        chunksTracker.set(fileId, {
          fileName,
          contentType,
          totalChunks,
          receivedChunks: [],
          uploadDate: new Date()
        });
      } else if (!fileId) {
        return NextResponse.json(
          { error: 'Se requiere fileId para fragmentos que no son el primero' },
          { status: 400 }
        );
      }
      
      // Verificar que tengamos registro de este archivo
      if (!chunksTracker.has(fileId)) {
        console.log(`No se encontró registro para fileId: ${fileId}`);
        
        // Intentar recuperar información de la base de datos
        try {
          const chunksCollection = db.collection('chunks.files');
          const existingChunks = await chunksCollection.find({
            'metadata.parentFileId': fileId
          }).toArray();
          
          if (existingChunks.length > 0) {
            // Reconstruir el registro
            const sampleChunk = existingChunks[0];
            chunksTracker.set(fileId, {
              fileName: sampleChunk.metadata.originalFilename,
              contentType: sampleChunk.metadata.contentType,
              totalChunks: totalChunks,
              receivedChunks: existingChunks.map(chunk => parseInt(chunk.metadata.chunkIndex)),
              uploadDate: new Date()
            });
            console.log(`Reconstruido registro para fileId: ${fileId}`);
          } else {
            return NextResponse.json(
              { error: 'No se encontró información para el fileId proporcionado' },
              { status: 404 }
            );
          }
        } catch (dbError) {
          console.error('Error al recuperar información de fragmentos:', dbError);
          return NextResponse.json(
            { error: 'Error al recuperar información de fragmentos previos' },
            { status: 500 }
          );
        }
      }
      
      // Generar nombre único para este fragmento
      const chunkFilename = `${fileId}_${currentChunk}.chunk`;
      
      // Convertir el fragmento a buffer
      console.log(`Convirtiendo fragmento ${currentChunk + 1} a buffer...`);
      try {
        const arrayBuffer = await (chunk as Blob).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`Fragmento ${currentChunk + 1} convertido a buffer. Tamaño: ${buffer.length} bytes`);
        
        if (buffer.length === 0) {
          console.error(`Error: El buffer para el fragmento ${currentChunk + 1} está vacío`);
          return NextResponse.json(
            { error: `Fragmento ${currentChunk + 1} está vacío` },
            { status: 400 }
          );
        }
        
        // Subir el fragmento a GridFS
        const chunkId = new ObjectId();
        console.log(`Creando stream para subir fragmento ${currentChunk + 1} con ID: ${chunkId.toString()}`);
        
        const uploadStream = bucket.openUploadStreamWithId(chunkId, chunkFilename, {
          metadata: {
            parentFileId: fileId,
            originalFilename: fileName,
            contentType: contentType,
            chunkIndex: currentChunk,
            totalChunks: totalChunks,
            uploadedBy: session.user.email,
            uploadedAt: new Date(),
            size: buffer.length
          }
        });
        
        // Promesa para manejar la subida del fragmento
        await new Promise<void>((resolve, reject) => {
          uploadStream.on('error', (error) => {
            console.error(`Error en el stream al subir fragmento ${currentChunk + 1}:`, error);
            
            // Intentar obtener más detalles del error
            let errorDetail = 'Error desconocido';
            if (error.message) {
              errorDetail = error.message;
            } else if ((error as any).code) {
              errorDetail = `Código de error: ${(error as any).code}`;
            } else {
              try {
                errorDetail = JSON.stringify(error);
              } catch (e) {
                errorDetail = 'Error no serializable';
              }
            }
            
            reject(new Error(`Error en el stream: ${errorDetail}`));
          });
          
          uploadStream.on('finish', () => {
            console.log(`Fragmento ${currentChunk + 1}/${totalChunks} guardado correctamente en GridFS`);
            resolve();
          });
          
          // Escribir el buffer en el stream con mejor manejo de errores
          try {
            uploadStream.write(buffer, (writeError) => {
              if (writeError) {
                console.error(`Error al escribir fragmento ${currentChunk + 1} en el stream:`, writeError);
                reject(new Error(`Error al escribir en el stream: ${writeError.message || 'Error desconocido'}`));
                return;
              }
              
              console.log(`Fragmento ${currentChunk + 1} escrito en el stream. Finalizando...`);
              try {
                uploadStream.end((endError) => {
                  if (endError) {
                    console.error(`Error al finalizar el stream para fragmento ${currentChunk + 1}:`, endError);
                    reject(new Error(`Error al finalizar el stream: ${endError.message || 'Error desconocido'}`));
                    return;
                  }
                });
              } catch (endError) {
                console.error(`Excepción al finalizar el stream para fragmento ${currentChunk + 1}:`, endError);
                reject(new Error(`Excepción al finalizar el stream: ${(endError as Error).message || 'Error desconocido'}`));
              }
            });
          } catch (writeError) {
            console.error(`Excepción al escribir fragmento ${currentChunk + 1} en el stream:`, writeError);
            reject(new Error(`Excepción al escribir en el stream: ${(writeError as Error).message || 'Error desconocido'}`));
          }
        });
        
        // Actualizar el registro de fragmentos
        const metadata = chunksTracker.get(fileId)!;
        metadata.receivedChunks.push(currentChunk);
        metadata.uploadDate = new Date(); // Actualizar fecha
        chunksTracker.set(fileId, metadata);
        
        console.log(`Fragmento ${currentChunk + 1}/${totalChunks} procesado. Total recibidos: ${metadata.receivedChunks.length}/${totalChunks}`);
        
        // Devolver información sobre el fragmento procesado
        return NextResponse.json({
          success: true,
          fileId: fileId,
          processedChunk: currentChunk,
          totalProcessed: metadata.receivedChunks.length,
          remaining: totalChunks - metadata.receivedChunks.length
        });
      } catch (bufferError) {
        console.error(`Error al procesar el buffer para fragmento ${currentChunk + 1}:`, bufferError);
        return NextResponse.json(
          { error: `Error al procesar el buffer: ${(bufferError as Error).message || 'Error desconocido'}` },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error general en procesamiento de fragmento:', error);
      return NextResponse.json(
        { error: error.message || 'Error en el procesamiento del fragmento' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error general en procesamiento de fragmento:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el procesamiento del fragmento' },
      { status: 500 }
    );
  }
} 