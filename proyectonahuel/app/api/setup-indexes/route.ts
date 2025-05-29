import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { setupDatabaseIndexes, checkQueryPerformance } from '@/lib/dbIndexes';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo permitir a administradores
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const result = await setupDatabaseIndexes();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Índices configurados correctamente'
      });
    } else {
      return NextResponse.json(
        { error: 'Error configurando índices', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en setup-indexes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo permitir a administradores
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const performance = await checkQueryPerformance();
    
    return NextResponse.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Error verificando rendimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 