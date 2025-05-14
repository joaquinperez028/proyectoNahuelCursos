import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, subject, message } = await request.json();

    // Validación básica
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Configuración del transporte de correo con Gmail
    // Nota: Para Gmail, necesitas habilitar "Acceso de aplicaciones menos seguras" o usar una "Contraseña de aplicación"
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Usando servicio predefinido de Gmail en lugar de configuración manual
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Dirección de correo del administrador
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER; // Fallback al mismo email de envío si no hay admin

    if (!adminEmail) {
      console.error('Error: No se ha configurado un email para recibir los mensajes');
      return NextResponse.json(
        { error: 'Error en la configuración del servidor. Por favor, contacta al administrador por otro medio.' },
        { status: 500 }
      );
    }

    // Configuración del correo
    const mailOptions = {
      from: `"Formulario de Contacto" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Formulario de contacto: ${subject}`,
      html: `
        <h1>Nuevo mensaje de contacto</h1>
        <p><strong>De:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email,
    };

    try {
      // Enviar correo
      const info = await transporter.sendMail(mailOptions);
      console.log('Email enviado correctamente:', info.messageId);
      
      return NextResponse.json(
        { message: 'Mensaje enviado correctamente' },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error('Error específico al enviar email:', emailError);
      
      // Mensaje de error más descriptivo para el usuario
      let errorMessage = 'No se pudo enviar el mensaje. ';
      
      if (emailError.code === 'EAUTH') {
        errorMessage += 'Error de autenticación con el servidor de correo.';
      } else if (emailError.code === 'ESOCKET' || emailError.code === 'ECONNECTION') {
        errorMessage += 'No se pudo conectar con el servidor de correo.';
      } else {
        errorMessage += 'Por favor, intenta nuevamente más tarde o contacta por otro medio.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
} 