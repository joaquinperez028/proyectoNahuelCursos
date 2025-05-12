import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

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
    
    await connectDB();
    
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
    
    // Crear el certificado como imagen usando canvas
    // Ruta a la plantilla del certificado (debe existir en public/images)
    const templatePath = path.join(process.cwd(), 'public', 'images', 'certificate-template.png');
    
    // Verificar si la plantilla existe
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Plantilla de certificado no encontrada' },
        { status: 500 }
      );
    }
    
    // Crear el canvas
    const canvas = createCanvas(1754, 1240); // Tamaño de la plantilla
    const ctx = canvas.getContext('2d');
    
    // Cargar la plantilla
    const template = await loadImage(templatePath);
    ctx.drawImage(template, 0, 0, 1754, 1240);
    
    // Configurar estilos de texto
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    
    // Nombre del estudiante
    ctx.font = 'bold 60px Arial';
    ctx.fillText(user.name, 877, 500);
    
    // Nombre del curso
    ctx.font = '40px Arial';
    ctx.fillText(course.title, 877, 650);
    
    // Fecha de emisión
    ctx.font = '30px Arial';
    ctx.fillText(`Emitido el ${formatDate(progress.completedAt || new Date())}`, 877, 750);
    
    // ID del certificado
    ctx.font = '24px Arial';
    ctx.fillText(`Certificado ID: ${certificateId}`, 877, 850);
    
    // URL de verificación
    ctx.font = '20px Arial';
    ctx.fillText(`Verifica este certificado en: proyectonahuel.vercel.app/certificados/verificar`, 877, 900);
    
    // Convertir canvas a imagen y optimizar con sharp
    const buffer = canvas.toBuffer('image/png');
    const optimizedBuffer = await sharp(buffer)
      .png({ quality: 90 })
      .toBuffer();
    
    // Crear nombre de archivo
    const filename = `certificado-${user._id}-${data.courseId}.png`;
    
    // Guardar la imagen en el sistema de archivos
    const certificateDir = path.join(process.cwd(), 'public', 'certificates');
    
    // Crear directorio si no existe
    if (!fs.existsSync(certificateDir)) {
      fs.mkdirSync(certificateDir, { recursive: true });
    }
    
    const certificatePath = path.join(certificateDir, filename);
    fs.writeFileSync(certificatePath, optimizedBuffer);
    
    // URL pública del certificado
    const certificateUrl = `/certificates/${filename}`;
    
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