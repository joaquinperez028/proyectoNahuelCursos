import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Mux from '@mux/mux-node';

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

    // Obtener el ID del asset de la query
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    
    if (!uploadId) {
      return NextResponse.json(
        { error: 'ID de carga no proporcionado' },
        { status: 400 }
      );
    }

    // Inicializar cliente MUX
    const muxClient = new Mux(
      process.env.MUX_TOKEN_ID || '',
      process.env.MUX_TOKEN_SECRET || ''
    );

    // Obtener el estado de la carga
    const upload = await muxClient.Video.Uploads.get(uploadId);
    
    // Si el asset está listo, obtenemos sus detalles
    let asset = null;
    let playbackId = null;
    
    if (upload.asset_id) {
      asset = await muxClient.Video.Assets.get(upload.asset_id);
      if (asset && asset.playback_ids && asset.playback_ids.length > 0) {
        playbackId = asset.playback_ids[0].id;
      }
    }

    // Devolver el estado actual
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      status: upload.status,
      assetId: upload.asset_id,
      playbackId: playbackId,
      error: upload.error,
    });
  } catch (error) {
    console.error("Error al verificar estado de carga:", error);
    return NextResponse.json(
      { error: "Error al verificar el estado de la carga", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
} 