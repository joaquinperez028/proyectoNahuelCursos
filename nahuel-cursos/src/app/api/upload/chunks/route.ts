import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuración para manejar archivos más grandes
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
  maxDuration: 60,
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
  console.log(`Ejecutando limpieza de rastreador de fragmentos. Entradas actuales: ${chunksTracker.size}`);
  
  for (const [fileId, metadata] of chunksTracker.entries()) {
    // No eliminar archivos que aún están en progreso y tienen actividad reciente
    if (metadata.uploadDate < oneHourAgo) {
      // Verificar si realmente podemos eliminar esta entrada
      const completePercentage = (metadata.receivedChunks.length / metadata.totalChunks) * 100;
      
      // Si ya recibimos más del 90% de los fragmentos, esperamos un poco más
      if (completePercentage > 90) {
        console.log(`Conservando rastreo para fileId: ${fileId} (${completePercentage.toFixed(1)}% completo, espera extendida)`);
        continue;
      }
      
      // Si el archivo está casi completo pero tiene más de 2 horas, eliminarlo
      if (metadata.uploadDate < new Date(Date.now() - 7200000) && completePercentage > 50) {
        console.log(`Limpiando rastreo obsoleto para fileId: ${fileId} (${completePercentage.toFixed(1)}% completo pero inactivo por >2 horas)`);
        chunksTracker.delete(fileId);
        continue;
      }
      
      // Para archivos con poco progreso, limpiar después de 1 hora
      console.log(`Limpiando rastreo obsoleto para fileId: ${fileId} (${completePercentage.toFixed(1)}% completo, inactivo por >1 hora)`);
      chunksTracker.delete(fileId);
    }
  }
  
  console.log(`Limpieza completada. Entradas restantes: ${chunksTracker.size}`);
};

// Programar limpieza cada 30 minutos
setInterval(cleanupTracker, 1800000);

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
      const chunkSize = (chunk as Blob).size;
      
      if (chunkSize > MAX_CHUNK_SIZE) {
        console.error(`Error: El fragmento excede el tamaño máximo permitido. Tamaño: ${chunkSize} bytes, Máximo: ${MAX_CHUNK_SIZE} bytes`);
        return NextResponse.json(
          { 
            error: `El fragmento es demasiado grande (${(chunkSize / 1024 / 1024).toFixed(2)}MB). El tamaño máximo permitido es ${MAX_CHUNK_SIZE / 1024 / 1024}MB por fragmento`,
            code: '413',
            message: 'Request Entity Too Large'
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
            isProcessing: true,
            uploadedBy: session.user.email,
            uploadDate: new Date()
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
        
        // Actualizar explícitamente el metadato para asegurar que fileId está configurado correctamente
        await db.collection('fs.files').updateOne(
          { _id: new ObjectId(fsFileId) },
          { $set: { 'metadata.fileId': fileId } }
        );

        // Verificar que se guardó correctamente
        const savedFile = await db.collection('fs.files').findOne({ _id: new ObjectId(fsFileId) });
        console.log(`Archivo creado con metadata:`, JSON.stringify(savedFile?.metadata || {}, null, 2));
        
        return NextResponse.json({
          message: `Fragmento ${chunkIndexNum + 1} de ${totalChunksNum} recibido`,
          fsFileId,
          fileId,
          success: true
        });
      }
      
      // Para fragmentos subsiguientes, obtener el archivo existente y actualizarlo
      const metadata = chunksTracker.get(fileId);
      if (!metadata) {
        // Si no encontramos en el tracker, intentemos recuperarla directamente de la base de datos
        console.log(`No se encontró metadata en el rastreador para fileId: ${fileId}. Intentando recuperar de la base de datos...`);
        
        // Intentar encontrar el archivo existente con varias opciones de búsqueda
        let existingFiles = await db.collection('fs.files')
          .find({ 'metadata.fileId': fileId })
          .toArray();
        
        // Si no encontramos por metadata.fileId, intentamos buscar por _id si parece ser un ObjectId válido
        if (existingFiles.length === 0 && ObjectId.isValid(fileId)) {
          console.log(`No se encontró archivo por metadata.fileId, intentando buscar por _id: ${fileId}`);
          try {
            const fileById = await db.collection('fs.files')
              .find({ _id: new ObjectId(fileId) })
              .toArray();
            
            if (fileById.length > 0) {
              existingFiles = fileById;
              console.log(`Archivo encontrado por _id: ${fileId}`);
            }
          } catch (err) {
            console.error(`Error al buscar por _id: ${err.message}`);
          }
        }
        
        // Registrar todos los archivos en proceso para diagnóstico
        const allProcessingFiles = await db.collection('fs.files')
          .find({ 'metadata.isProcessing': true })
          .toArray();
        
        console.log(`Archivos en proceso encontrados: ${allProcessingFiles.length}`);
        
        if (allProcessingFiles.length > 0) {
          console.log(`IDs de archivos en proceso:`, allProcessingFiles.map(f => ({
            id: f._id.toString(),
            fileId: f.metadata?.fileId,
            fileName: f.filename
          })));
        }
        
        if (existingFiles.length === 0) {
          console.error(`Error: No se encontró archivo en GridFS para fileId: ${fileId}`);
          return NextResponse.json(
            { 
              error: 'No se encontró el archivo para actualizar. Inicie la carga nuevamente.',
              debug: {
                fileIdProvided: fileId,
                processingFilesCount: allProcessingFiles.length,
                processingFiles: allProcessingFiles.map(f => f._id.toString())
              }
            },
            { status: 404 }
          );
        }
        
        // Reconstruir metadata desde el archivo existente
        const existingFile = existingFiles[0];
        const reconstructedMetadata: ChunkMetadata = {
          fileName: existingFile.filename || fileName,
          contentType: existingFile.metadata?.contentType || contentType,
          totalChunks: existingFile.metadata?.totalChunks || totalChunksNum,
          receivedChunks: [], // Esto lo reconstruiremos a continuación
          uploadDate: new Date()
        };
        
        // Buscar fragmentos ya recibidos
        const existingChunks = await db.collection('fs.chunks')
          .find({ files_id: existingFile._id })
          .toArray();
        
        reconstructedMetadata.receivedChunks = existingChunks.map(chunk => chunk.n);
        console.log(`Se reconstruyó la metadata para fileId: ${fileId}. Fragmentos ya recibidos: ${reconstructedMetadata.receivedChunks.length}`);
        
        // Actualizar el rastreador
        chunksTracker.set(fileId, reconstructedMetadata);
        
        // Continuar con la metadata reconstruida
        if (!reconstructedMetadata.receivedChunks.includes(chunkIndexNum)) {
          reconstructedMetadata.receivedChunks.push(chunkIndexNum);
        }
        
        // Buscar el archivo existente (ya lo tenemos)
        const fsFileId = existingFile._id;
        
        // Guardar el fragmento como un nuevo chunk
        try {
          // Comprobar primero si el fragmento ya existe para este archivo
          const existingChunk = await db.collection('fs.chunks').findOne({
            files_id: new ObjectId(fsFileId),
            n: chunkIndexNum
          });
          
          if (existingChunk) {
            console.log(`El fragmento ${chunkIndexNum + 1} ya existe para este archivo. Actualizando en lugar de insertar.`);
            
            // Actualizar el fragmento existente en lugar de insertar uno nuevo
            await db.collection('fs.chunks').updateOne(
              { files_id: new ObjectId(fsFileId), n: chunkIndexNum },
              { $set: { data: buffer } }
            );
          } else {
            // Insertar un nuevo fragmento si no existe
            await db.collection('fs.chunks').insertOne({
              files_id: new ObjectId(fsFileId),
              n: chunkIndexNum,
              data: buffer
            });
          }
          
          console.log(`Fragmento ${chunkIndexNum + 1} de ${totalChunksNum} guardado para ${fileName}`);
          
          // Verificar si todos los fragmentos han sido recibidos
          if (reconstructedMetadata.receivedChunks.length === totalChunksNum) {
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
            fragmentosRecibidos: reconstructedMetadata.receivedChunks.length,
            success: true
          });
        } catch (error: any) {
          console.error(`Error al guardar fragmento ${chunkIndexNum + 1}: ${error.message}`);
          
          // Comprobar si el error está relacionado con una limitación de tamaño
          if (error.message && (
            error.message.includes('entity too large') || 
            error.message.includes('exceeds limit') ||
            error.message.includes('size limit') ||
            error.message.includes('request entity too large') ||
            error.message.includes('413')
          )) {
            return NextResponse.json(
              { 
                error: `El fragmento es demasiado grande para ser procesado (límite: ${MAX_CHUNK_SIZE / 1024 / 1024}MB)`, 
                code: '413',
                message: 'Request Entity Too Large',
                detail: 'Intenta dividir el archivo en fragmentos más pequeños'
              },
              { status: 413 }
            );
          }
          
          return NextResponse.json(
            { error: `Error al guardar el fragmento: ${error.message}` },
            { status: 500 }
          );
        }
      } else {
        // Si encontramos metadata en el rastreador, proceder normalmente
        console.log(`Usando metadata del rastreador para fileId: ${fileId}`);
        
        // Añadir este fragmento a la lista de fragmentos recibidos si no está ya
        if (!metadata.receivedChunks.includes(chunkIndexNum)) {
          metadata.receivedChunks.push(chunkIndexNum);
          // Actualizar la fecha de carga
          metadata.uploadDate = new Date();
        }
        
        // Buscar el archivo por fileId en los metadatos
        const existingFiles = await db.collection('fs.files')
          .find({ 'metadata.fileId': fileId })
          .toArray();
        
        if (existingFiles.length === 0) {
          console.error(`Error: No se encontró archivo en GridFS para fileId: ${fileId}`);
          // Limpiar el rastreador ya que el archivo parece no existir
          chunksTracker.delete(fileId);
          return NextResponse.json(
            { error: 'No se encontró el archivo para actualizar en el sistema. Inicie la carga nuevamente.' },
            { status: 404 }
          );
        }
        
        const existingFile = existingFiles[0];
        const fsFileId = existingFile._id;
        
        // Guardar el fragmento como un nuevo chunk asociado al mismo archivo
        try {
          // Comprobar primero si el fragmento ya existe para este archivo
          const existingChunk = await db.collection('fs.chunks').findOne({
            files_id: new ObjectId(fsFileId),
            n: chunkIndexNum
          });
          
          if (existingChunk) {
            console.log(`El fragmento ${chunkIndexNum + 1} ya existe para este archivo. Actualizando en lugar de insertar.`);
            
            // Actualizar el fragmento existente en lugar de insertar uno nuevo
            await db.collection('fs.chunks').updateOne(
              { files_id: new ObjectId(fsFileId), n: chunkIndexNum },
              { $set: { data: buffer } }
            );
          } else {
            // Insertar un nuevo fragmento si no existe
            await db.collection('fs.chunks').insertOne({
              files_id: new ObjectId(fsFileId),
              n: chunkIndexNum,
              data: buffer
            });
          }
          
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
            error.message.includes('size limit') ||
            error.message.includes('request entity too large') ||
            error.message.includes('413')
          )) {
            return NextResponse.json(
              { 
                error: `El fragmento es demasiado grande para ser procesado (límite: ${MAX_CHUNK_SIZE / 1024 / 1024}MB)`, 
                code: '413',
                message: 'Request Entity Too Large',
                detail: 'Intenta dividir el archivo en fragmentos más pequeños'
              },
              { status: 413 }
            );
          }
          
          return NextResponse.json(
            { error: `Error al guardar el fragmento: ${error.message}` },
            { status: 500 }
          );
        }
      }
    } catch (error: any) {
      console.error('Error en el procesamiento de fragmentos:', error);
      
      // Verificar si el error está relacionado con el tamaño de la solicitud
      if (error.message && (
        error.message.includes('entity too large') || 
        error.message.includes('exceeds limit') ||
        error.message.includes('size limit') ||
        error.message.includes('request entity too large') ||
        error.message.includes('413')
      )) {
        return NextResponse.json(
          { 
            error: 'La solicitud excede el límite de tamaño permitido', 
            code: '413',
            message: 'Request Entity Too Large',
            detail: 'Verifica el tamaño del fragmento enviado y asegúrate de que cumple con los límites del servidor'
          },
          { status: 413 }
        );
      }
      
      return NextResponse.json(
        { error: `Error en la carga de fragmentos: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error crítico en el procesamiento de la solicitud:', error);
    
    // Verificar si el error crítico está relacionado con el tamaño de la solicitud
    if (error.message && (
      error.message.includes('entity too large') || 
      error.message.includes('exceeds limit') ||
      error.message.includes('size limit') ||
      error.message.includes('request entity too large') ||
      error.message.includes('413')
    )) {
      return NextResponse.json(
        { 
          error: 'La solicitud excede el límite de tamaño máximo del servidor', 
          code: '413',
          message: 'Request Entity Too Large',
          detail: 'Este error ocurrió en el nivel más alto del procesamiento. Intenta reducir el tamaño del fragmento enviado'
        },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    );
  }
} 