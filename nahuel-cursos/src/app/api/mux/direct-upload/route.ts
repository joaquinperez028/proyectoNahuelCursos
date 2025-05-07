import { NextRequest, NextResponse } from 'next/server';
import { Mux } from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// Los Videos API clients en Mux SDK v11+ se estructuran diferente
const { Video } = mux;

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    // En v11, Uploads es directamente una propiedad del objeto Video
    const upload = await Video.Uploads.create({
      new_asset_settings: { playback_policy: 'public' },
      cors_origin: '*',
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error: any) {
    console.error('Error creando direct upload:', error);
    return NextResponse.json({ 
      error: error.message || 'Error creando direct upload',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
