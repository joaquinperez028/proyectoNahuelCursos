import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mux = require('@mux/mux-node');

// Inicializar cliente Mux con las credenciales
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Debug para verificar la estructura
console.log('[MUX] Verificando propiedades del cliente:', Object.keys(muxClient));
console.log('[MUX] ¿Video existe?', muxClient.video ? 'Sí' : 'No');
if (muxClient.video) {
  console.log('[MUX] Propiedades de Video:', Object.keys(muxClient.video));
}

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    console.log('[MUX] Creando direct upload para archivo:', filename);

    // Crear direct upload usando la estructura correcta para v11
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
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
