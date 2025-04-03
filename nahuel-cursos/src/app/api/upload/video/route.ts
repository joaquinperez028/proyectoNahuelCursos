import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import clientPromise from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configuración para manejar tamaños grandes de archivos
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '100mb',
  },
};

// Función para generar un nombre de archivo único
const generateUniqueFilename = (originalname: string): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = originalname.split('.').pop();
  return `${timestamp}-${randomString}.${ext}`;
};

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('Iniciando subida de video a MongoDB GridFS...');
    
    // Obtener el FormData
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    
    if (!videoFile) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo de video' },
        { status: 400 }
      );
    }
    
    console.log('Video recibido:', videoFile.name, 'Tamaño:', videoFile.size);
    
    // Verificar el tamaño del archivo (límite de 100MB)
    if (videoFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (100MB)' },
        { status: 400 }
      );
    }
    
    // Generar un nombre único para el archivo
    const filename = generateUniqueFilename(videoFile.name);
    
    // Convertir el File a Buffer
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    
    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Crear un GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'videos'
    });
    
    // Crear un ID para el archivo
    const fileId = new ObjectId();
    
    // Subir el archivo
    return new Promise<NextResponse>((resolve, reject) => {
      const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
        metadata: {
          originalFilename: videoFile.name,
          contentType: videoFile.type,
          size: videoFile.size,
          uploadedBy: session.user.email,
          uploadedAt: new Date()
        }
      });
      
      // Manejar eventos
      uploadStream.on('error', (error) => {
        console.error('Error al subir a GridFS:', error);
        resolve(NextResponse.json({ error: 'Error al subir el archivo a la base de datos' }, { status: 500 }));
      });
      
      uploadStream.on('finish', () => {
        console.log('Subida a GridFS completada, ID:', fileId.toString());
        
        // Devolver la URL para acceder al archivo
        const videoUrl = `/api/videos/${fileId.toString()}`;
        resolve(NextResponse.json({
          filePath: videoUrl,
          fileName: videoFile.name,
          fileId: fileId.toString()
        }));
      });
      
      // Escribir el buffer en el stream
      uploadStream.write(buffer);
      uploadStream.end();
    });
    
  } catch (error: any) {
    console.error('Error al subir video:', error);
    return NextResponse.json(
      { error: error.message || 'Error al subir el video' },
      { status: 500 }
    );
  }
} 