import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Mux from '@mux/mux-node';

// Credenciales
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || 'development_token_id';
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || 'development_token_secret';

// Cliente MUX (singleton)
let muxClient: any = null;

function getMuxClient() {
  if (!muxClient) {
    muxClient = new Mux(MUX_TOKEN_ID, MUX_TOKEN_SECRET);
  }
  return muxClient;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el ID del upload, playback o asset de la query
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const playbackId = searchParams.get('playbackId');
    const assetId = searchParams.get('assetId');
    
    if (!uploadId && !playbackId && !assetId) {
      return NextResponse.json(
        { error: 'ID de upload, playback o asset no proporcionado' },
        { status: 400 }
      );
    }

    // En modo desarrollo, simular respuesta
    if (process.env.NODE_ENV === 'development' && !process.env.MUX_TOKEN_ID) {
      return NextResponse.json({
        status: 'ready',
        playback_policy: 'public',
        created_at: new Date().toISOString(),
        duration: 120,
        aspect_ratio: '16:9',
        playback_id: playbackId || 'simulado',
        asset_id: 'asset_simulado'
      });
    }

    try {
      const client = getMuxClient();
      let asset;
      if (assetId) {
        asset = await client.Video.Assets.get(assetId);
      } else if (uploadId) {
        const assets = await client.Video.Assets.list({ upload_id: uploadId });
        if (!assets.length) {
          return NextResponse.json(
            { error: 'Asset no encontrado', status: 'not_found' },
            { status: 404 }
          );
        }
        asset = assets[0];
      } else {
        const assets = await client.Video.Assets.list({ playback_id: playbackId });
        if (!assets.length) {
          return NextResponse.json(
            { error: 'Asset no encontrado', status: 'not_found' },
            { status: 404 }
          );
        }
        asset = assets[0];
      }

      // Buscar playbackId público
      const pbId = asset.playback_ids?.find((pb: { id: string; policy: string }) => pb.policy === 'public')?.id || asset.playback_ids?.[0]?.id;
      // Devolver información detallada del asset
      return NextResponse.json({
        status: asset.status,
        assetId: asset.id,
        playbackId: pbId,
        created_at: asset.created_at,
        duration: asset.duration,
        aspect_ratio: asset.aspect_ratio,
        errors: asset.errors || [],
        tracks: asset.tracks || [],
        test: asset.test === true
      });
    } catch (muxError: any) {
      console.error('Error al consultar MUX:', muxError);
      return NextResponse.json(
        { 
          error: 'Error al consultar estado del asset',
          details: muxError.message,
          status: 'error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
} 