import { NextRequest, NextResponse } from 'next/server';
// Importación correcta
const Mux = require('@mux/mux-node');

// Inicialización simple
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Acceder a Video y verificar que existe
if (!muxClient.Video) {
  console.error('[MUX] Error: Video no está disponible en muxClient');
}

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    console.log('[MUX] Creando direct upload para archivo:', filename);

    // Verificar que Video existe
    if (!muxClient.Video || !muxClient.Video.Uploads) {
      throw new Error('No se pudo acceder a la API de MUX Video');
    }

    // Crear direct upload usando el objeto correcto
    const upload = await muxClient.video.uploads.create({
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
    }, { status: 500 });
  }
}
