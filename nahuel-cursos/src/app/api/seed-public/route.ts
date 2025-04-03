import { NextResponse } from 'next/server';
import { sembrarCursos } from '@/lib/db/seed';

export const dynamic = 'force-dynamic'; // Asegura que esta ruta siempre se ejecute dinámicamente

export async function GET() {
  console.log('API SEED: Iniciando generación de datos de ejemplo...');
  
  try {
    console.log('API SEED: Llamando a la función sembrarCursos...');
    const resultado = await sembrarCursos(true); // Forzar la creación aunque existan datos
    console.log('API SEED: Datos generados correctamente:', resultado);
    return NextResponse.json({
      ...resultado,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  } catch (error: any) {
    console.error('API SEED: Error al sembrar datos:', error);
    
    // Información más detallada sobre el error
    const errorDetails = {
      error: 'Error al sembrar los datos de ejemplo',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      mongodbUri: process.env.MONGODB_URI ? 
        `${process.env.MONGODB_URI.split(':')[0]}:***@${process.env.MONGODB_URI.split('@')[1]}` : 
        'No configurado'
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 