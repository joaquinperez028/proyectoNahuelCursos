import { NextResponse } from 'next/server';
import { sembrarCursos } from '@/lib/db/seed';

export async function GET() {
  try {
    const resultado = await sembrarCursos();
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    return NextResponse.json(
      { error: 'Error al sembrar los datos de ejemplo' },
      { status: 500 }
    );
  }
} 