import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';

export const maxDuration = 60; // 60 segundos
export const revalidate = 0; // Sin caché

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
  maxDuration: 60,
};

export async function GET(request: NextRequest) {
  // Verificación de autenticación
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn('Intento de acceso no autorizado a información de chunks');
    return NextResponse.json(
      { error: 'No autorizado. Inicie sesión para acceder a esta funcionalidad.' },
      { status: 401 }
    );
  }

  try {
    // Obtener el fileId de la consulta
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'Se requiere un fileId para obtener información de fragmentos' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(fileId);
    } catch (error) {
      return NextResponse.json(
        { error: 'El fileId proporcionado no es válido' },
        { status: 400 }
      );
    }

    // Verificar si el archivo existe en fs.files
    const fileExists = await db.collection('fs.files').findOne({ _id: objectId });
    if (!fileExists) {
      return NextResponse.json(
        { 
          fileId, 
          exists: false,
          uploadedChunks: [],
          message: 'No se encontró un archivo con el ID proporcionado' 
        },
        { status: 200 }
      );
    }

    // Obtener información sobre los fragmentos existentes
    const chunksCursor = await db.collection('fs.chunks')
      .find({ files_id: objectId })
      .project({ n: 1, _id: 0 }) // Solo necesitamos los números de fragmento
      .sort({ n: 1 });
    
    const chunks = await chunksCursor.toArray();
    const uploadedChunkNumbers = chunks.map(chunk => chunk.n);

    // Comprobar si el archivo está marcado como completo
    const isComplete = fileExists.length === fileExists.uploadDate;

    return NextResponse.json({
      fileId,
      fileName: fileExists.filename,
      contentType: fileExists.contentType,
      length: fileExists.length,
      chunkSize: fileExists.chunkSize,
      uploadDate: fileExists.uploadDate,
      exists: true,
      isComplete,
      uploadedChunks: uploadedChunkNumbers,
      totalChunks: chunks.length
    });
  } catch (error: any) {
    console.error('Error al obtener información de fragmentos:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener información de fragmentos: ' + (error.message || 'Error desconocido'),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 