import nodemailer from 'nodemailer';

// Template base para emails con diseño moderno
const getEmailTemplate = (content: string, type: 'user' | 'admin' = 'user') => {
  const primaryColor = type === 'user' ? '#4CAF50' : '#2563eb';
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/ISOTIPO-transformed-120x120.png`;
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nahuel Cursos</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f8fafc;
          line-height: 1.6;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${type === 'user' ? '#45a049' : '#1d4ed8'} 100%);
          padding: 40px 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }
        
        .logo img {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .content {
          padding: 40px 30px;
          color: #374151;
          font-size: 16px;
        }
        
        .highlight-box {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${type === 'user' ? '#45a049' : '#1d4ed8'} 100%);
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 12px 12px;
        }
        
        .footer p {
          color: #64748b;
          font-size: 14px;
          margin: 5px 0;
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
          margin: 30px 0;
        }
        
        .success-icon {
          width: 60px;
          height: 60px;
          background-color: ${primaryColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        
        .admin-badge {
          display: inline-block;
          background-color: #fbbf24;
          color: #92400e;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .header, .content, .footer {
            padding: 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .button {
            display: block;
            width: 100%;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <img src="${logoUrl}" alt="Nahuel Cursos" />
          </div>
          <h1>Nahuel Cursos</h1>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p><strong>Nahuel Cursos</strong></p>
          <p>Tu plataforma de aprendizaje online</p>
          <div class="divider"></div>
          <p>Este email fue enviado automáticamente. Si tienes alguna pregunta, contáctanos.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/contacto" style="color: ${primaryColor};">Contactar Soporte</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: ${primaryColor};">Visitar Plataforma</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para confirmación de compra de usuario
export const getUserConfirmationTemplate = (userName: string, itemTitle: string, isPackage: boolean = false) => {
  const itemType = isPackage ? 'pack de cursos' : 'curso';
  
  const content = `
    <div class="success-icon">
      <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    
    <h2 style="color: #1f2937; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 600;">
      ¡Compra confirmada exitosamente!
    </h2>
    
    <p style="font-size: 18px; margin-bottom: 10px;">
      <strong>Hola ${userName},</strong>
    </p>
    
    <p style="margin-bottom: 25px;">
      Tu compra del ${itemType} <strong>"${itemTitle}"</strong> ha sido confirmada exitosamente.
    </p>
    
    <div class="highlight-box">
      <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 18px;">
        🎉 ¡Ya puedes comenzar a aprender!
      </h3>
      <p style="margin: 0;">
        Todo el contenido ya está disponible en tu perfil. Accede desde la plataforma y comienza tu experiencia de aprendizaje.
      </p>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/perfil" class="button">
        🚀 Acceder a mis cursos
      </a>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
      Si tienes alguna duda o necesitas ayuda, no dudes en contactarnos.
      <br><strong>¡Que disfrutes aprendiendo!</strong>
    </p>
  `;
  
  return getEmailTemplate(content, 'user');
};

// Template para notificación de administrador
export const getAdminNotificationTemplate = (userName: string, userEmail: string, itemTitle: string, amount: number, isPackage: boolean = false) => {
  const itemType = isPackage ? 'Pack' : 'Curso';
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span class="admin-badge">🔔 Nueva Notificación</span>
    </div>
    
    <h2 style="color: #1f2937; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 600;">
      Nuevo pago por transferencia recibido
    </h2>
    
    <div class="highlight-box">
      <h3 style="margin: 0 0 20px 0; color: #2563eb; font-size: 18px;">
        📋 Detalles del pago
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #374151; width: 30%;">Usuario:</td>
          <td style="padding: 12px 0; color: #6b7280;">${userName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #374151;">Email:</td>
          <td style="padding: 12px 0; color: #6b7280;">${userEmail}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #374151;">Producto:</td>
          <td style="padding: 12px 0; color: #6b7280;"><span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: 600;">${itemType}</span> ${itemTitle}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #374151;">Monto:</td>
          <td style="padding: 12px 0; color: #059669; font-weight: 700; font-size: 18px;">$${amount.toLocaleString('es-AR')}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-weight: 600; color: #374151;">Fecha:</td>
          <td style="padding: 12px 0; color: #6b7280;">${new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 25px 0;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        ⚠️ <strong>Acción requerida:</strong> Este pago requiere verificación manual del comprobante de transferencia.
      </p>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/transferencias" class="button">
        👁️ Revisar comprobante
      </a>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
      Accede al panel de administración para aprobar o rechazar este pago.
    </p>
  `;
  
  return getEmailTemplate(content, 'admin');
};

// Template para rechazo de pago
export const getRejectionTemplate = (userName: string, itemTitle: string, rejectionReason: string) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </div>
    </div>
    
    <h2 style="color: #1f2937; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 600;">
      Información sobre tu pago
    </h2>
    
    <p style="font-size: 18px; margin-bottom: 10px;">
      <strong>Hola ${userName},</strong>
    </p>
    
    <p style="margin-bottom: 25px;">
      Lamentamos informarte que tu pago por transferencia para <strong>"${itemTitle}"</strong> no ha sido aprobado.
    </p>
    
    <div style="background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">
        📋 Motivo del rechazo:
      </h3>
      <p style="margin: 0; color: #7f1d1d; font-weight: 500;">
        ${rejectionReason}
      </p>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 25px 0;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        💡 <strong>¿Qué puedes hacer?</strong><br>
        • Revisar que el comprobante sea claro y legible<br>
        • Verificar que el monto transferido sea correcto<br>
        • Intentar con otro método de pago<br>
        • Contactar nuestro soporte para más información
      </p>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/contacto" class="button">
        📞 Contactar Soporte
      </a>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
      Si crees que esto es un error, no dudes en contactarnos. Estamos aquí para ayudarte.
    </p>
  `;
  
  return getEmailTemplate(content, 'user');
};

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    // Verificar que las variables de entorno necesarias estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Las credenciales de SMTP no están configuradas');
    }

    // Crear el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Configuración del correo
    const mailOptions = {
      from: `"Nahuel Cursos" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Nahuel Cursos Platform'
      }
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
}; 