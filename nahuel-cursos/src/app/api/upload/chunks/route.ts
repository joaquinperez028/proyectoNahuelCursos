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
    const chunk = formData.get('chunk') as File;
    const fileName = formData.get('fileName') as string;
    const contentType = formData.get('contentType') as string;
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const currentChunk = parseInt(formData.get('currentChunk') as string);
    let fileId = formData.get('fileId') as string;
    
    // Validar datos
    if (!chunk || !fileName || isNaN(totalChunks) || isNaN(currentChunk)) {
      return NextResponse.json(
        { error: 'Datos de fragmento incompletos o inválidos' },
        { status: 400 }
      );
    }
    
    console.log(`Recibido fragmento ${currentChunk + 1}/${totalChunks} para ${fileName}`);
    
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
    const buffer = Buffer.from(await chunk.arrayBuffer());
    
    try {
      // Subir el fragmento a GridFS
      const chunkId = new ObjectId();
      const uploadStream = bucket.openUploadStreamWithId(chunkId, chunkFilename, {
        metadata: {
          parentFileId: fileId,
          originalFilename: fileName,
          contentType: contentType,
          chunkIndex: currentChunk,
          totalChunks: totalChunks,
          uploadedBy: session.user.email,
          uploadedAt: new Date()
        }
      });
      
      // Promesa para manejar la subida del fragmento
      await new Promise<void>((resolve, reject) => {
        uploadStream.on('error', (error) => {
          console.error('Error al subir fragmento:', error);
          reject(error);
        });
        
        uploadStream.on('finish', () => {
          console.log(`Fragmento ${currentChunk + 1}/${totalChunks} guardado correctamente`);
          resolve();
        });
        
        // Escribir el buffer en el stream
        uploadStream.write(buffer, (writeError) => {
          if (writeError) {
            console.error('Error al escribir fragmento:', writeError);
            reject(writeError);
            return;
          }
          uploadStream.end();
        });
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
      
    } catch (uploadError: any) {
      console.error('Error al procesar fragmento:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Error al procesar fragmento de archivo' },
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