import { NextRequest, NextResponse } from 'next/server';
import { Mux } from '@mux/mux-node';

// Inicializar Mux correctamente
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Acceder a Video y verificar que existe
const Video = muxClient.Video;

if (!Video) {
  console.error('[MUX] Error: Video no está disponible en muxClient');
}

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    console.log('[MUX] Creando direct upload para archivo:', filename);

    // Verificar que Video existe
    if (!Video || !Video.Uploads) {
      throw new Error('No se pudo acceder a la API de MUX Video');
    }

    // Crear direct upload
    const upload = await Video.Uploads.create({
      new_asset_settings: { playback_policy: 'public' },
      cors_origin: '*',
    });
    
    console.log('[MUX] Direct upload creado con éxito, ID:', upload.id);
    
    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error: any) {
    console.error('[MUX] Error creando direct upload:', error);
    return NextResponse.json({ 
      error: error.message || 'Error creando direct upload',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
