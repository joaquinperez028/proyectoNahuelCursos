import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mux = require('@mux/mux-node');

// Inicializar cliente Mux con las credenciales
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId } = await req.json();
    console.log('[MUX] upload-status: recibido uploadId:', uploadId);

    if (!uploadId) {
      console.log('[MUX] upload-status: falta uploadId');
      return NextResponse.json({ error: 'Falta el uploadId' }, { status: 400 });
    }

    // Usar la estructura correcta según los logs: video.uploads (minúsculas)
    let upload;
    try {
      upload = await muxClient.video.uploads.get(uploadId);
      console.log('[MUX] upload-status: upload encontrado:', upload);
    } catch (err) {
      console.error('[MUX] Error al consultar upload:', err);
      return NextResponse.json({ error: 'Error al consultar upload: ' + ((err as Error)?.message || String(err)) }, { status: 500 });
    }

    // Si ya tiene asset_id, consultar el asset
    if (upload.asset_id) {
      let asset;
      try {
        // Usar la estructura correcta: video.assets (minúsculas)
        asset = await muxClient.video.assets.get(upload.asset_id);
        console.log('[MUX] upload-status: asset encontrado:', asset);
      } catch (err) {
        console.error('[MUX] Error al consultar asset:', err);
        return NextResponse.json({ error: 'Error al consultar asset: ' + ((err as Error)?.message || String(err)) }, { status: 500 });
      }

      // Si el asset está listo, devolver el playback_id
      if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
        return NextResponse.json({
          status: 'ready',
          playbackId: asset.playback_ids[0].id,
          assetId: asset.id,
        });
      } else {
        return NextResponse.json({
          status: asset.status,
          assetId: asset.id,
        });
      }
    } else {
      // Aún no tiene asset_id, sigue procesando
      return NextResponse.json({
        status: upload.status,
        uploadId: upload.id,
      });
    }
  } catch (error: any) {
    console.error('[MUX] Error general en upload-status:', error, error?.stack);
    return NextResponse.json({ 
      error: error.message || 'Error consultando estado de upload', 
      stack: error?.stack 
    }, { status: 500 });
  }
}