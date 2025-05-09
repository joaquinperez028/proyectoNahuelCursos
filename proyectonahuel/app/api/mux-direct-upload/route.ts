import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Mux from '@mux/mux-node';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado y es admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Inicializar cliente MUX
    const muxClient = new Mux(
      process.env.MUX_TOKEN_ID || '',
      process.env.MUX_TOKEN_SECRET || ''
    );
    
    // Siempre usar política pública en desarrollo o si no tenemos credenciales de firma
    const usePublicPolicy = 
      process.env.NODE_ENV === 'development' || 
      !process.env.MUX_SIGNING_KEY || 
      !process.env.MUX_SIGNING_KEY_ID;
    
    console.log('Creando direct upload con política:', usePublicPolicy ? 'public' : 'signed');

    // Crear un nuevo direct upload URL
    const upload = await muxClient.Video.Uploads.create({
      cors_origin: '*', // O configura solo tu dominio
      new_asset_settings: {
        playback_policy: [usePublicPolicy ? 'public' : 'signed'],
      }
    });

    // Devolver la información para que el frontend pueda usar
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      uploadUrl: upload.url,
      policy: usePublicPolicy ? 'public' : 'signed'
    });
  } catch (error) {
    console.error("Error al crear URL de carga directa:", error);
    return NextResponse.json(
      { error: "Error al crear URL para la carga directa", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
} 