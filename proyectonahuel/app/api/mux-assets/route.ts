import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Mux from '@mux/mux-node';

const muxClient = new Mux(
  process.env.MUX_TOKEN_ID || '',
  process.env.MUX_TOKEN_SECRET || ''
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const assets = await muxClient.Video.Assets.list({ limit: 20 });
    return NextResponse.json({
      assets: assets.map((asset: any) => ({
        id: asset.id,
        playbackId: asset.playback_ids?.[0]?.id || '',
        createdAt: asset.created_at
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener assets', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Debes enviar un array de ids' }, { status: 400 });
    }
    const results = [];
    for (const id of ids) {
      try {
        await muxClient.Video.Assets.del(id);
        results.push({ id, deleted: true });
      } catch (err) {
        results.push({ id, deleted: false, error: err instanceof Error ? err.message : err });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar assets', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 