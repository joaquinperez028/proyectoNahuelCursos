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

    // Vamos a imprimir los métodos disponibles para debug
    console.log('[MUX] métodos video:', Object.keys(muxClient.video || {}));
    console.log('[MUX] métodos uploads:', Object.keys(muxClient.video?.uploads || {}));

    // Si la API cambió, podríamos necesitar otro método
    let upload;
    try {
      // Intentar diferentes métodos disponibles en el SDK
      if (muxClient.video?.uploads?.get) {
        upload = await muxClient.video.uploads.get(uploadId);
      } else if (muxClient.video?.uploads?.retrieve) {
        upload = await muxClient.video.uploads.retrieve(uploadId);
      } else {
        throw new Error('No se encontró un método para obtener el upload');
      }
      
      console.log('[MUX] upload-status: upload encontrado:', upload);
    } catch (err) {
      console.error('[MUX] Error específico al consultar upload:', err);
      return NextResponse.json({ 
        error: 'Error al consultar upload: ' + (err as Error)?.message 
      }, { status: 500 });
    }

    // Procesar el resultado como antes
    if (upload.asset_id) {
      let asset;
      try {
        // Intentar diferentes métodos para assets también
        if (muxClient.video?.assets?.get) {
          asset = await muxClient.video.assets.get(upload.asset_id);
        } else if (muxClient.video?.assets?.retrieve) {
          asset = await muxClient.video.assets.retrieve(upload.asset_id);
        } else {
          throw new Error('No se encontró un método para obtener el asset');
        }
        
        console.log('[MUX] upload-status: asset encontrado:', asset);
      } catch (err) {
        console.error('[MUX] Error al consultar asset:', err);
        return NextResponse.json({ 
          error: 'Error al consultar asset: ' + (err as Error)?.message
        }, { status: 500 });
      }

      if (asset.status === 'ready' && asset.playback_ids?.length > 0) {
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