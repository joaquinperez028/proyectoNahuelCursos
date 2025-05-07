import { NextRequest, NextResponse } from 'next/server';
// Importación correcta
const Mux = require('@mux/mux-node');

// Inicialización simple
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId } = await req.json();
    console.log('[MUX] upload-status: recibido uploadId:', uploadId);

    if (!uploadId) {
      return NextResponse.json({ error: 'Falta el uploadId' }, { status: 400 });
    }

    const upload = await muxClient.video.uploads.get(uploadId);
    console.log('[MUX] upload-status: upload encontrado:', upload);

    if (upload.asset_id) {
      const asset = await muxClient.video.assets.get(upload.asset_id);
      console.log('[MUX] upload-status: asset encontrado:', asset);

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
      return NextResponse.json({
        status: upload.status,
        uploadId: upload.id,
      });
    }
  } catch (error: any) {
    console.error('[MUX] Error general en upload-status:', error);
    return NextResponse.json({ 
      error: error.message || 'Error consultando estado de upload'
    }, { status: 500 });
  }
}