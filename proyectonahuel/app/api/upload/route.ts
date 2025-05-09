import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import * as crypto from "crypto";

// Directorio donde se guardarán los archivos temporalmente
const uploadDir = join(process.cwd(), "public", "uploads");

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

    // Crear un nombre de archivo único para evitar colisiones
    const fileExtension = file.name.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Convertir el archivo a ArrayBuffer y luego a Buffer para guardarlo
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Devolver la URL del archivo subido
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl 
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
} 