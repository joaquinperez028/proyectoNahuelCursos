import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { Mux } from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Leer el archivo del formData
    const formData = await req.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Convertir el archivo a un stream legible
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    // Subir el video a MUX
    const upload = await mux.video.uploads.create({
      input: stream,
      playback_policy: 'public',
      new_asset_settings: { playback_policy: 'public' },
    });

    return NextResponse.json({ uploadId: upload.id, url: upload.url });
  } catch (error: any) {
    console.error('Error al subir a MUX:', error);
    return NextResponse.json({ error: error.message || 'Error al subir a MUX' }, { status: 500 });
  }
} 