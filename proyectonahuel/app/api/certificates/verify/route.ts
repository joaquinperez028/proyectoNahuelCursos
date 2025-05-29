import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';

// Hacer el endpoint dinámico para evitar ejecución en build time
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Obtener el ID del certificado de los query parameters
    const url = new URL(request.url);
    const certificateId = url.searchParams.get('id');
    
    if (!certificateId) {
      return NextResponse.json(
        { error: 'Falta el ID del certificado' },
        { status: 400 }
      );
    }
    
    // Buscar el certificado en la base de datos
    const progress = await Progress.findOne({
      certificateId: certificateId,
      certificateIssued: true
    });
    
    if (!progress) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'El certificado no es válido o no existe' 
        },
        { status: 200 }
      );
    }
    
    // Obtener información adicional (usuario y curso)
    const [user, course] = await Promise.all([
      User.findById(progress.userId),
      Course.findById(progress.courseId)
    ]);
    
    if (!user || !course) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'No se encontró información completa del certificado' 
        },
        { status: 200 }
      );
    }
    
    // Devolver información verificada del certificado
    return NextResponse.json({
      valid: true,
      data: {
        certificateId: progress.certificateId,
        studentName: user.name,
        courseName: course.title,
        completedAt: progress.completedAt,
        issuedAt: progress.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error al verificar certificado:', error);
    return NextResponse.json(
      { error: 'Error al verificar el certificado' },
      { status: 500 }
    );
  }
} 