import nodemailer from 'nodemailer';

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