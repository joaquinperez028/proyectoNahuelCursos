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
    
    // Buscar el archivo existente en el bucket principal
    const filesCollection = db.collection('fs.files');
    const existingFile = await filesCollection.findOne({ 
      $or: [
        { 'metadata.fileId': fileId },
        { _id: new ObjectId(fileId) }
      ]
    });

    if (!existingFile) {
      console.error(`No se encontró el archivo con fileId: ${fileId}`);
      return NextResponse.json(
        { error: 'No se encontró el archivo principal en GridFS' },
        { status: 404 }
      );
    }

    // Verificar si todos los fragmentos están presentes
    const chunksCollection = db.collection('fs.chunks');
    const chunks = await chunksCollection.find({
      files_id: existingFile._id
    }).sort({ n: 1 }).toArray();

    console.log(`Se encontraron ${chunks.length} fragmentos para el archivo ${fileName}`);

    if (chunks.length < totalChunks) {
      return NextResponse.json(
        { error: `Faltan fragmentos: ${chunks.length}/${totalChunks}` },
        { status: 400 }
      );
    }

    // Verificar que los fragmentos están ordenados consecutivamente
    const missingNumbers = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks.find(c => c.n === i);
      if (!chunk) {
        missingNumbers.push(i);
      }
    }

    if (missingNumbers.length > 0) {
      return NextResponse.json({
        error: `Faltan fragmentos específicos: ${missingNumbers.join(', ')}`,
        status: 400
      });
    }

    // El archivo ya está completo en GridFS, solo necesitamos marcarlo como finalizado
    console.log(`Todos los fragmentos verificados para ${fileName}. Marcando como completo...`);
    
    // Marcar el archivo como completo
    await filesCollection.updateOne(
      { _id: existingFile._id },
      { 
        $set: { 
          'metadata.isProcessing': false,
          'metadata.isComplete': true,
          'metadata.finalizedAt': new Date(),
          'metadata.finalizedBy': session.user.email
        }
      }
    );

    // Generar la URL para acceder al archivo final
    const videoUrl = `/api/videos/${existingFile._id.toString()}`;
    
    // Devolver la información del archivo final
    return NextResponse.json({
      success: true,
      message: 'Archivo marcado como completo correctamente',
      filePath: videoUrl,
      fileName: fileName,
      fileId: existingFile._id.toString()
    });
    
  } catch (error: any) {
    console.error('Error general en finalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el proceso de finalización' },
      { status: 500 }
    );
  }
} 