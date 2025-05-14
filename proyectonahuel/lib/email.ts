export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  // Esta función simula el envío de correos electrónicos
  // En producción, debes implementar un servicio de correo real como:
  // - Resend
  // - SendGrid
  // - Amazon SES
  // - Mailchimp
  
  // Ejemplo con un servicio de correo:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@tucursoonline.com',
  //     to,
  //     subject,
  //     html: htmlContent
  //   })
  // });
  // return response.json();

  // Por ahora, solo registramos en la consola para desarrollo
  console.log('Simulando envío de correo:');
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log('Contenido HTML:', htmlContent);
  
  return { success: true, message: 'Correo simulado en desarrollo' };
}; 