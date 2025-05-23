import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

// Importamos Mux de la manera correcta para v7.3.1
import Mux from '@mux/mux-node';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo permitir acceso a administradores
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID);
    console.log('MUX_TOKEN_SECRET está definido:', !!process.env.MUX_TOKEN_SECRET);

    // Inicializar cliente MUX para v7.3.1
    const muxClient = new Mux(
      process.env.MUX_TOKEN_ID || '',
      process.env.MUX_TOKEN_SECRET || ''
    );
    
    // Probar la conexión listando los primeros 5 assets
    const assets = await muxClient.Video.Assets.list({ limit: 5 });
    
    return NextResponse.json({ 
      success: true,
      message: 'Conexión a MUX exitosa',
      totalAssets: assets.length,
      assets: assets.map((asset: any) => ({
        id: asset.id,
        status: asset.status,
        duration: asset.duration,
        createdAt: asset.created_at
      }))
    });
  } catch (error) {
    console.error("Error al conectar con MUX:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error al conectar con MUX",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 