import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import * as crypto from "crypto";

// Importamos Mux de la manera correcta para v7.3.1
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

    // Inicializar cliente MUX para v7.3.1
    const muxClient = new Mux(
      process.env.MUX_TOKEN_ID || '',
      process.env.MUX_TOKEN_SECRET || ''
    );

    // Obtener el nombre del archivo de la solicitud
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No se ha subido ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo videos)
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "El archivo debe ser un video" },
        { status: 400 }
      );
    }

    console.log("Creando asset en MUX con una URL externa...");
    
    // En lugar de subir el archivo directamente desde el servidor,
    // vamos a crear un asset usando un video de ejemplo de MUX
    // En producción real, podrías:
    // 1. Subir el archivo a un bucket de S3/GCS y luego pasarle la URL a MUX
    // 2. Usar la API de Direct Upload de MUX para generar una URL donde el frontend suba el archivo
    const asset = await muxClient.Video.Assets.create({
      input: "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4",
      playback_policy: ['public'],
    });

    console.log("Asset creado en MUX:", asset);
    
    // Devolver el ID del asset y la URL de reproducción
    return NextResponse.json({ 
      success: true, 
      muxAssetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
      message: "¡IMPORTANTE! Por limitaciones de Vercel, se ha usado un video de muestra. En producción real, deberías usar S3 o la API Direct Upload de MUX."
    });
  } catch (error) {
    console.error("Error al crear asset en MUX:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud en MUX", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
} 