import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';

// Cache para almacenar IPs y tiempos para rate limiting
const ipCache = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_REQUESTS = 5; // Número máximo de solicitudes
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // Ventana de tiempo (1 hora)

// Función para sanitizar entrada y prevenir inyección
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Elimina etiquetas HTML y caracteres potencialmente peligrosos
  return input
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/[&<>"'`=\/]/g, "");
};

// Validación de email con expresión regular más rigurosa
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Implementación de rate limiting por IP
const checkRateLimit = (ip: string): { allowed: boolean, message?: string } => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Limpiar entradas antiguas del cache
  for (const [cachedIp, data] of ipCache.entries()) {
    if (data.lastRequest < windowStart) {
      ipCache.delete(cachedIp);
    }
  }
  
  // Verificar si la IP ha excedido el límite
  if (!ipCache.has(ip)) {
    ipCache.set(ip, { count: 1, lastRequest: now });
    return { allowed: true };
  }
  
  const ipData = ipCache.get(ip)!;
  
  // Si la IP está dentro de la ventana de tiempo
  if (ipData.count >= RATE_LIMIT_REQUESTS) {
    const resetTime = new Date(ipData.lastRequest + RATE_LIMIT_WINDOW);
    return { 
      allowed: false, 
      message: `Se ha excedido el límite de solicitudes. Por favor, intenta nuevamente después de ${resetTime.toLocaleTimeString()}.` 
    };
  }
  
  // Actualizar contador para esta IP
  ipCache.set(ip, { 
    count: ipData.count + 1, 
    lastRequest: now 
  });
  
  return { allowed: true };
};

export async function POST(request: Request) {
  try {
    // Obtener IP del cliente desde headers
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') || '';
    const clientIp = forwardedFor.split(',')[0] || 'unknown';
    
    // Verificar rate limit
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit excedido para IP: ${clientIp}`);
      return NextResponse.json(
        { error: rateLimitCheck.message },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, subject, message } = body;

    // Validación básica
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validar longitud de los campos
    if (email.length > 100) {
      return NextResponse.json(
        { error: 'El email no debe exceder los 100 caracteres' },
        { status: 400 }
      );
    }

    if (subject.length < 5 || subject.length > 100) {
      return NextResponse.json(
        { error: 'El asunto debe tener entre 5 y 100 caracteres' },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 1000) {
      return NextResponse.json(
        { error: 'El mensaje debe tener entre 10 y 1000 caracteres' },
        { status: 400 }
      );
    }

    // Sanitizar entradas para prevenir inyección
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);
    const sanitizedEmail = email.trim();

    // Configuración del transporte de correo con Gmail
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

    // Configuración del correo con encabezados de seguridad
    const mailOptions = {
      from: `"Formulario de Contacto" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Formulario de contacto: ${sanitizedSubject}`,
      html: `
        <h1>Nuevo mensaje de contacto</h1>
        <p><strong>De:</strong> ${sanitizedEmail}</p>
        <p><strong>Asunto:</strong> ${sanitizedSubject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Este mensaje fue enviado desde el formulario de contacto. IP: ${clientIp}</small></p>
      `,
      replyTo: sanitizedEmail,
      // Añadir encabezados de seguridad
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Contact Form',
        'X-Contact-Form': 'true',
        'X-Client-IP': clientIp
      }
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