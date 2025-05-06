import { NextRequest, NextResponse } from 'next/server';
import { Mux } from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId } = await req.json();
    if (!uploadId) {
      return NextResponse.json({ error: 'Falta el uploadId' }, { status: 400 });
    }

    // Consultar el estado del upload
    const upload = await mux.video.uploads.get(uploadId);

    // Si ya tiene asset_id, consultar el asset
    if (upload.asset_id) {
      const asset = await mux.video.assets.get(upload.asset_id);

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
    console.error('Error consultando estado de upload:', error);
    return NextResponse.json({ error: error.message || 'Error consultando estado de upload' }, { status: 500 });
  }
}