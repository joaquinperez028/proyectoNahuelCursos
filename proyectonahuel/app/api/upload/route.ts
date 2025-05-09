import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import * as crypto from "crypto";

// Importamos MuxClient de la manera correcta
const Mux = require('@mux/mux-node');

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

    // Inicializar cliente de MUX según la documentación oficial
    const muxClient = new Mux.Video(
      process.env.MUX_TOKEN_ID,
      process.env.MUX_TOKEN_SECRET
    );

    // Procesar la solicitud como formData
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

    // Crear un asset directo en MUX
    const asset = await muxClient.Assets.create({
      input: [{
        type: 'file',
        contents: Buffer.from(await file.arrayBuffer()),
      }],
      playback_policy: ['public'],
    });

    // Devolver el ID del asset de MUX
    return NextResponse.json({ 
      success: true, 
      muxAssetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id
    });
  } catch (error) {
    console.error("Error al subir archivo a MUX:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo en MUX" },
      { status: 500 }
    );
  }
} 