import { NextRequest, NextResponse } from 'next/server';
import { Mux } from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: 'public' },
      playback_policy: 'public',
      cors_origin: '*',
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error: any) {
    console.error('Error creando direct upload:', error);
    return NextResponse.json({ error: error.message || 'Error creando direct upload' }, { status: 500 });
  }
}
