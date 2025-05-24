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

    // Obtener el ID del playback de la query
    const { searchParams } = new URL(request.url);
    const playbackId = searchParams.get('playbackId');
    
    if (!playbackId) {
      return NextResponse.json(
        { error: 'ID de playback no proporcionado' },
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
        playback_id: playbackId
      });
    }

    try {
      const client = getMuxClient();
      
      // Buscar el asset por playback ID
      const assets = await client.Video.Assets.list({
        playback_id: playbackId
      });

      if (!assets.length) {
        return NextResponse.json(
          { error: 'Asset no encontrado', status: 'not_found' },
          { status: 404 }
        );
      }

      const asset = assets[0];
      
      // Devolver información detallada del asset
      return NextResponse.json({
        status: asset.status,
        playback_policy: asset.playback_ids?.[0]?.policy,
        created_at: asset.created_at,
        duration: asset.duration,
        aspect_ratio: asset.aspect_ratio,
        playback_id: playbackId,
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