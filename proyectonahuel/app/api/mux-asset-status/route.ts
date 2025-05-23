import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Mux from '@mux/mux-node';

// Definir los tipos de estado de MUX
type MuxUploadStatus = 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out' | 'processing' | 'ready';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email || session.user.role !== 'admin') {
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

    try {
      // Obtener el estado de la carga
      const upload = await muxClient.Video.Uploads.get(uploadId);
      
      // Si hay un error en la carga, devolverlo
      if (upload.error) {
        return NextResponse.json({
          success: false,
          error: `Error en la carga: ${upload.error.message || 'Error desconocido'}`,
          status: upload.status
        });
      }
      
      // Si el asset está listo, obtenemos sus detalles
      let asset = null;
      let playbackId = null;
      
      if (upload.asset_id) {
        try {
          asset = await muxClient.Video.Assets.get(upload.asset_id);
          if (asset && asset.playback_ids && asset.playback_ids.length > 0) {
            playbackId = asset.playback_ids[0].id;
          }
        } catch (assetError) {
          console.error('Error al obtener detalles del asset:', assetError);
          // No fallamos aquí, solo registramos el error y continuamos
        }
      }

      // Calcular el progreso estimado basado en el estado
      let progress = 0;
      switch (upload.status as MuxUploadStatus) {
        case 'waiting':
          progress = 40;
          break;
        case 'processing':
          progress = 70;
          break;
        case 'ready':
        case 'asset_created':
          progress = playbackId ? 100 : 90;
          break;
        case 'errored':
        case 'cancelled':
        case 'timed_out':
          return NextResponse.json({
            success: false,
            error: 'Error en el procesamiento del video',
            status: upload.status
          });
      }

      // Devolver el estado actual
      return NextResponse.json({
        success: true,
        uploadId: upload.id,
        status: upload.status,
        progress,
        assetId: upload.asset_id,
        playbackId,
        error: null,
      });
    } catch (muxError) {
      console.error("Error al comunicarse con MUX:", muxError);
      return NextResponse.json(
        { 
          error: "Error al comunicarse con el servicio de video",
          details: muxError instanceof Error ? muxError.message : "Error desconocido"
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error al verificar estado de carga:", error);
    return NextResponse.json(
      { 
        error: "Error al verificar el estado de la carga",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
} 