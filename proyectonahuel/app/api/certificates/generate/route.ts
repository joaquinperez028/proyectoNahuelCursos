import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectToDatabase } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

// Funciones auxiliares
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(date).toLocaleDateString('es-ES', options);
}

function generateCertificateId(): string {
  return randomBytes(12).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.courseId) {
      return NextResponse.json(
        { error: 'Falta el ID del curso' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario tiene acceso al curso
    const hasAccess = user.courses.some(
      (id: mongoose.Types.ObjectId) => id.toString() === data.courseId
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }
    
    // Buscar progreso del usuario en este curso
    const progress = await Progress.findOne({
      userId: user._id,
      courseId: data.courseId
    });
    
    if (!progress) {
      return NextResponse.json(
        { error: 'No se encontró progreso para este curso' },
        { status: 404 }
      );
    }
    
    // Verificar si el curso está completado
    if (!progress.isCompleted) {
      return NextResponse.json(
        { error: 'Debes completar el curso para obtener el certificado' },
        { status: 400 }
      );
    }
    
    // Verificar si ya se generó un certificado
    if (progress.certificateIssued && progress.certificateUrl) {
      return NextResponse.json({
        success: true,
        message: 'Certificado ya generado',
        certificateId: progress.certificateId,
        certificateUrl: progress.certificateUrl
      });
    }
    
    // Obtener detalles del curso
    const course = await Course.findById(data.courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    
    // Generar ID único para el certificado
    const certificateId = generateCertificateId();
    
    // En lugar de generar una imagen, generaremos una página web para el certificado
    const certificateUrl = `/certificados/ver/${certificateId}`;
    
    // Actualizar el progreso con la información del certificado
    progress.certificateIssued = true;
    progress.certificateId = certificateId;
    progress.certificateUrl = certificateUrl;
    await progress.save();
    
    return NextResponse.json({
      success: true,
      message: 'Certificado generado correctamente',
      certificateId: certificateId,
      certificateUrl: certificateUrl
    });
    
  } catch (error) {
    console.error('Error al generar certificado:', error);
    return NextResponse.json(
      { error: 'Error al generar el certificado' },
      { status: 500 }
    );
  }
} 