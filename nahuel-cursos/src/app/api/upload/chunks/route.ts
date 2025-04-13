import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuración para manejar archivos más grandes
export const config = {
  api: {
    bodyParser: false,
    // Aumentar el límite de tamaño para respuestas y solicitudes
    responseLimit: '50mb',
    // Esto no afecta directamente al bodyParser de Next.js, pero documentamos la limitación
    // El límite real está controlado por el servidor subyacente (generalmente 4MB por defecto)
  },
  // Añadir un tiempo de espera más largo para permitir subidas grandes
  maxDuration: 60, // 60 segundos para la función completa
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
    
    try {
      // Obtener formData con manejo de errores mejorado
      let formData;
      try {
        formData = await req.formData();
      } catch (formDataError: any) {
        console.error('Error al procesar formData:', formDataError);
        
        // Verificar si el error está relacionado con el tamaño del cuerpo de la solicitud
        const errorMessage = formDataError.message || '';
        if (
          errorMessage.includes('entity too large') || 
          errorMessage.includes('exceeds limit') ||
          errorMessage.includes('body size limit')
        ) {
          console.error('Error 413: Solicitud demasiado grande');
          return NextResponse.json(
            { 
              error: 'El fragmento excede el tamaño máximo permitido por el servidor', 
              code: '413',
              message: 'Request Entity Too Large' 
            },
            { status: 413 }
          );
        }
        
        return NextResponse.json(
          { error: `Error al procesar los datos del formulario: ${errorMessage}` },
          { status: 400 }
        );
      }
      
      // Extraer y validar datos con un mejor manejo de errores
      const chunk = formData.get('chunk');
      if (!chunk || !(chunk instanceof Blob)) {
        console.error('Error: El fragmento no es válido o no es un Blob', chunk);
        return NextResponse.json(
          { error: 'Fragmento inválido o no proporcionado' },
          { status: 400 }
        );
      }
      
      // Verificar el tamaño del fragmento y rechazar si es demasiado grande
      // El límite es de aproximadamente 4MB (un poco menos para dejar margen)
      const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB
      if ((chunk as Blob).size > MAX_CHUNK_SIZE) {
        console.error(`Error: El fragmento excede el tamaño máximo permitido. Tamaño: ${(chunk as Blob).size} bytes, Máximo: ${MAX_CHUNK_SIZE} bytes`);
        return NextResponse.json(
          { 
            error: `El fragmento excede el tamaño máximo permitido (${Math.round(MAX_CHUNK_SIZE/1024/1024)}MB)`,
            code: '413',
            message: 'Request Entity Too Large',
            chunkSize: (chunk as Blob).size
          },
          { status: 413 }
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
      
      // Para el primer fragmento, permitir fileId nulo y generar uno nuevo
      let fileId = formData.get('fileId') as string | null;
      
      const chunkIndex = formData.get('chunkIndex');
      if (!chunkIndex || typeof chunkIndex !== 'string') {
        console.error('Error: Índice de fragmento inválido', chunkIndex);
        return NextResponse.json(
          { error: 'Índice de fragmento inválido o no proporcionado' },
          { status: 400 }
        );
      }
      
      const chunkIndexNum = parseInt(chunkIndex, 10);
      
      // Si es el primer fragmento y no hay ID, generamos uno nuevo
      if (chunkIndexNum === 0 && !fileId) {
        fileId = new ObjectId().toString();
        console.log(`Generando nuevo fileId para primer fragmento: ${fileId}`);
      } else if (!fileId) {
        // Para fragmentos subsiguientes, sí requerimos un fileId
        console.error('Error: ID de archivo inválido o nulo para fragmento no inicial', fileId);
        return NextResponse.json(
          { error: 'ID de archivo inválido o no proporcionado para fragmento no inicial' },
          { status: 400 }
        );
      }
      
      const totalChunks = formData.get('totalChunks');
      if (!totalChunks || typeof totalChunks !== 'string') {
        console.error('Error: Total de fragmentos inválido', totalChunks);
        return NextResponse.json(
          { error: 'Total de fragmentos inválido o no proporcionado' },
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
      
      // Convertir tipos
      const totalChunksNum = parseInt(totalChunks, 10);
      
      // Actualizar el rastreador de fragmentos
      if (!chunksTracker.has(fileId)) {
        chunksTracker.set(fileId, {
          fileName,
          contentType,
          totalChunks: totalChunksNum,
          receivedChunks: [chunkIndexNum],
          uploadDate: new Date()
        });
      } else {
        const metadata = chunksTracker.get(fileId)!;
        if (!metadata.receivedChunks.includes(chunkIndexNum)) {
          metadata.receivedChunks.push(chunkIndexNum);
        }
      }
      
      // Convertir chunk a ArrayBuffer para almacenamiento
      const buffer = Buffer.from(await (chunk as Blob).arrayBuffer());
      
      // Conectar a MongoDB
      const client = await clientPromise;
      const db = client.db();
      const bucket = new GridFSBucket(db);
      
      console.log(`Procesando fragmento ${chunkIndexNum + 1} de ${totalChunksNum} para ${fileName}`);
      
      // Lógica para el primer fragmento (crea el archivo)
      if (chunkIndexNum === 0) {
        console.log(`Iniciando carga para ${fileName}, fileId: ${fileId}`);
        const uploadStream = bucket.openUploadStream(fileName, {
          metadata: {
            contentType,
            totalChunks: totalChunksNum,
            fileId,
            isProcessing: true, // Indicador de que aún se está subiendo
          },
        });
        
        // Convertir el ObjectId a string para usar como referencia
        const fsFileId = uploadStream.id.toString();
        
        // Escribir el primer fragmento
        uploadStream.write(buffer);
        uploadStream.end();
        
        // Esperar a que termine la carga
        await new Promise<void>((resolve, reject) => {
          uploadStream.on('finish', () => {
            console.log(`Primer fragmento para ${fileName} guardado con fsFileId: ${fsFileId}`);
            resolve();
          });
          uploadStream.on('error', (error) => {
            console.error(`Error al guardar el primer fragmento: ${error.message}`);
            reject(error);
          });
        });
        
        return NextResponse.json({
          message: `Fragmento ${chunkIndexNum + 1} de ${totalChunksNum} recibido`,
          fsFileId,
          success: true
        });
      }
      
      // Para fragmentos subsiguientes, obtener el archivo existente y actualizarlo
      const metadata = chunksTracker.get(fileId);
      if (!metadata) {
        console.error(`Error: No se encontró metadata para fileId: ${fileId}`);
        return NextResponse.json(
          { error: 'No se encontró el archivo para actualizar. Inicie la carga nuevamente.' },
          { status: 404 }
        );
      }
      
      // Buscar el archivo por fileId en los metadatos
      const existingFiles = await db.collection('fs.files')
        .find({ 'metadata.fileId': fileId })
        .toArray();
      
      if (existingFiles.length === 0) {
        console.error(`Error: No se encontró archivo en GridFS para fileId: ${fileId}`);
        return NextResponse.json(
          { error: 'No se encontró el archivo para actualizar en el sistema. Inicie la carga nuevamente.' },
          { status: 404 }
        );
      }
      
      const existingFile = existingFiles[0];
      const fsFileId = existingFile._id;
      
      // Guardar el fragmento como un nuevo chunk asociado al mismo archivo
      try {
        await db.collection('fs.chunks').insertOne({
          files_id: new ObjectId(fsFileId),
          n: chunkIndexNum,
          data: buffer
        });
        
        console.log(`Fragmento ${chunkIndexNum + 1} de ${totalChunksNum} guardado para ${fileName}`);
        
        // Verificar si todos los fragmentos han sido recibidos
        if (metadata.receivedChunks.length === totalChunksNum) {
          console.log(`Todos los fragmentos recibidos para ${fileName}. Completando proceso...`);
          
          // Marcar el archivo como completado
          await db.collection('fs.files').updateOne(
            { _id: new ObjectId(fsFileId) },
            { $set: { 'metadata.isProcessing': false, 'metadata.isComplete': true } }
          );
          
          // Limpiar el tracker
          chunksTracker.delete(fileId);
          
          return NextResponse.json({
            message: `Carga completa de ${fileName}`,
            fsFileId: fsFileId.toString(),
            isComplete: true,
            success: true
          });
        }
        
        return NextResponse.json({
          message: `Fragmento ${chunkIndexNum + 1} de ${totalChunksNum} recibido`,
          fragmentosRecibidos: metadata.receivedChunks.length,
          success: true
        });
      } catch (error: any) {
        console.error(`Error al guardar fragmento ${chunkIndexNum + 1}: ${error.message}`);
        
        // Comprobar si el error está relacionado con una limitación de tamaño
        if (error.message && (
          error.message.includes('entity too large') || 
          error.message.includes('exceeds limit') ||
          error.message.includes('size limit')
        )) {
          return NextResponse.json(
            { 
              error: 'El fragmento es demasiado grande para ser procesado', 
              code: '413',
              message: 'Request Entity Too Large'
            },
            { status: 413 }
          );
        }
        
        return NextResponse.json(
          { error: `Error al guardar el fragmento: ${error.message}` },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error en el procesamiento de fragmentos:', error);
      return NextResponse.json(
        { error: `Error en la carga de fragmentos: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error crítico en el procesamiento de la solicitud:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    );
  }
} 