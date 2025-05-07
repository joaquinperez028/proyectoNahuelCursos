import { NextRequest, NextResponse } from 'next/server';
// Importación correcta
const Mux = require('@mux/mux-node');

// Inicializar cliente
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Imprimir la estructura completa
console.log('[MUX] Estructura completa:', Object.keys(muxClient));

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    console.log('[MUX] Creando direct upload para archivo:', filename);

    // Intentar acceder por diferentes rutas
    if (muxClient.Video && muxClient.Video.Uploads) {
      const upload = await muxClient.Video.Uploads.create({
        new_asset_settings: { playback_policy: 'public' },
        cors_origin: '*',
      });
      console.log('[MUX] Direct upload creado con éxito, ID:', upload.id);
      return NextResponse.json({
        uploadUrl: upload.url,
        uploadId: upload.id,
      });
    } 
    else if (muxClient.video && muxClient.video.uploads) {
      const upload = await muxClient.video.uploads.create({
        new_asset_settings: { playback_policy: 'public' },
        cors_origin: '*',
      });
      console.log('[MUX] Direct upload creado con éxito, ID:', upload.id);
      return NextResponse.json({
        uploadUrl: upload.url,
        uploadId: upload.id,
      });
    }
    else {
      // Si no encontramos la estructura esperada
      throw new Error("No se encontró la estructura correcta para MUX");
    }
  } catch (error: any) {
    console.error('[MUX] Error creando direct upload:', error);
    return NextResponse.json({ 
      error: error.message || 'Error creando direct upload',
    }, { status: 500 });
  }
}
