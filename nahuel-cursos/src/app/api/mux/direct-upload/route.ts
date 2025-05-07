import { NextRequest, NextResponse } from 'next/server';
import * as Mux from '@mux/mux-node';

// Inicializar Mux con las credenciales
const { Video } = new Mux.Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    console.log('[MUX] Creando direct upload para archivo:', filename);

    // Crear la directa upload usando la API correcta en v11
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
