import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';

export const dynamic = 'force-dynamic'; // Asegura que esta ruta siempre se ejecute dinámicamente

export async function GET() {
  const startTime = Date.now();
  const healthInfo: {
    status: string;
    database: {
      status: string;
      collections: number;
      connectionTime: number;
      missingCollections?: string[];
      cursos?: number;
      error?: string;
    };
    server: {
      environment: string;
      timestamp: string;
      uptime: number;
    };
  } = {
    status: 'ok',
    database: {
      status: 'unknown',
      collections: 0,
      connectionTime: 0
    },
    server: {
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  };
  
  try {
    // Verificar la conexión a la base de datos
    console.log('HEALTH: Verificando conexión a MongoDB...');
    const { db } = await connectToDatabase();
    
    // Verificar que podemos acceder a las colecciones
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Comprobar si existen las colecciones necesarias
    const requiredCollections = ['cursos', 'usuarios', 'valoraciones'];
    const missingCollections = requiredCollections.filter(
      coll => !collectionNames.includes(coll)
    );
    
    // Verificar si hay cursos en la colección
    let cursoCount = 0;
    if (collectionNames.includes('cursos')) {
      cursoCount = await db.collection('cursos').countDocuments();
    }
    
    healthInfo.database = {
      status: 'connected',
      collections: collections.length,
      missingCollections: missingCollections.length > 0 ? missingCollections : undefined,
      cursos: cursoCount,
      connectionTime: Date.now() - startTime
    };
    
    return NextResponse.json(healthInfo);
  } catch (error: any) {
    console.error('HEALTH: Error al verificar la base de datos:', error);
    
    return NextResponse.json({
      status: 'error',
      database: {
        status: 'error',
        error: error.message,
        collections: 0,
        connectionTime: Date.now() - startTime
      },
      server: healthInfo.server
    }, { status: 500 });
  }
} 