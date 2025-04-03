import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth/auth';
import { generateUniqueFilename, saveVideoFile } from '@/lib/upload/fileService';

// Configuración correcta para manejar formularios (no usar bodyParser: false aquí)
export const config = {
  api: {
    responseLimit: '10mb',
  },
};

// Procesar la solicitud formidable
async function parseFormData(req: NextRequest): Promise<{ filePath: string; fileName: string }> {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    
    if (!videoFile) {
      throw new Error('No se ha proporcionado ningún archivo de video');
    }
    
    console.log('Video recibido:', videoFile.name, 'Tamaño:', videoFile.size);
    
    // Verificar el tamaño del archivo (límite de 100MB)
    if (videoFile.size > 100 * 1024 * 1024) {
      throw new Error('El archivo excede el tamaño máximo permitido (100MB)');
    }
    
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const filename = generateUniqueFilename(videoFile.name);
    
    const filePath = await saveVideoFile(buffer, filename);
    
    return {
      filePath,
      fileName: videoFile.name
    };
  } catch (error: any) {
    console.error('Error al procesar formData:', error);
    throw new Error(`Error al procesar el archivo: ${error.message}`);
  }
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
    const result = await parseFormData(req);
    
    // Devolver la ruta del archivo guardado
    return NextResponse.json({
      filePath: result.filePath,
      fileName: result.fileName,
    });
    
  } catch (error: any) {
    console.error('Error al subir video:', error);
    return NextResponse.json(
      { error: error.message || 'Error al subir el video' },
      { status: 500 }
    );
  }
} 