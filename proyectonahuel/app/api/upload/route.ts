import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import * as crypto from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Importamos Mux de la manera correcta para v7.3.1
import Mux from '@mux/mux-node';

export async function POST(request: NextRequest) {
  // Creamos un archivo temporal para guardar el video
  let tempFilePath: string | null = null;
  
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

    console.log("Iniciando subida de archivo a MUX...");
    
    // Guardar el archivo temporalmente
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const uniqueId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop() || 'mp4';
    tempFilePath = path.join(tempDir, `${uniqueId}.${fileExt}`);
    
    await fs.writeFile(tempFilePath, buffer);
    console.log(`Archivo guardado temporalmente en: ${tempFilePath}`);
    
    // Crear un asset en MUX usando una URL directa
    const asset = await muxClient.Video.Assets.create({
      input: tempFilePath,
      playback_policy: ['public'],
    });

    console.log("Asset creado en MUX:", asset);
    
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
  } finally {
    // Limpieza: eliminar el archivo temporal si existe
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Archivo temporal eliminado: ${tempFilePath}`);
      } catch (err) {
        console.error("Error al eliminar archivo temporal:", err);
      }
    }
  }
} 