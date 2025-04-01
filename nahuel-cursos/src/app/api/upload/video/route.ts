import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import formidable from 'formidable';
import { generateUniqueFilename, saveVideoFile } from '@/lib/upload/fileService';
import { join } from 'path';
import { readFile } from 'fs/promises';

// Desactivar el body parser integrado para manejar formData
export const config = {
  api: {
    bodyParser: false,
  },
};

// Procesar la solicitud formidable
async function parseFormData(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const formData = await req.formData();
  const videoFile = formData.get('video') as File;
  
  if (!videoFile) {
    throw new Error('No se ha proporcionado ningún archivo de video');
  }
  
  const buffer = Buffer.from(await videoFile.arrayBuffer());
  const filename = generateUniqueFilename(videoFile.name);
  
  const filePath = await saveVideoFile(buffer, filename);
  
  // Devolver un objeto similar a lo que devolvería formidable
  return {
    fields: {},
    files: {
      video: {
        filepath: filePath,
        originalFilename: videoFile.name,
        mimetype: videoFile.type,
        size: videoFile.size,
      } as any,
    },
  };
}

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
    
    // Procesar la carga del archivo
    const { files } = await parseFormData(req);
    
    if (!files.video) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo de video' },
        { status: 400 }
      );
    }
    
    // Devolver la ruta del archivo guardado
    return NextResponse.json({
      filePath: files.video.filepath,
      fileName: files.video.originalFilename,
    });
    
  } catch (error: any) {
    console.error('Error al subir video:', error);
    return NextResponse.json(
      { error: error.message || 'Error al subir el video' },
      { status: 500 }
    );
  }
} 