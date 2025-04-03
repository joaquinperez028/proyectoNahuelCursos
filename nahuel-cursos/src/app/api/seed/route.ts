import { NextRequest, NextResponse } from 'next/server';
import { sembrarCursos } from '@/lib/db/seed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar si el usuario está autenticado y es admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden sembrar datos.' },
        { status: 403 }
      );
    }
    
    // Sembrar los datos de ejemplo
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