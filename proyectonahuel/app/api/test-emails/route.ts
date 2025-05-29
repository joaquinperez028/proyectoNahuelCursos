import { NextResponse } from 'next/server';
import { getUserConfirmationTemplate, getAdminNotificationTemplate, getRejectionTemplate } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'user';

  let htmlContent = '';

  switch (type) {
    case 'user':
      htmlContent = getUserConfirmationTemplate(
        'Juan Pérez',
        'Desarrollo Web Fullstack con React y Node.js',
        false
      );
      break;
    
    case 'user-pack':
      htmlContent = getUserConfirmationTemplate(
        'María González',
        'Pack Completo de Programación',
        true
      );
      break;
    
    case 'admin':
      htmlContent = getAdminNotificationTemplate(
        'Carlos Rodríguez',
        'carlos.rodriguez@email.com',
        'Curso de JavaScript Avanzado',
        25000,
        false
      );
      break;
    
    case 'admin-pack':
      htmlContent = getAdminNotificationTemplate(
        'Ana Martínez',
        'ana.martinez@email.com',
        'Pack de Desarrollo Frontend',
        45000,
        true
      );
      break;
    
    case 'rejection':
      htmlContent = getRejectionTemplate(
        'Pedro Sánchez',
        'Curso de Python para Principiantes',
        'El comprobante de transferencia no es legible. Por favor, asegúrate de que la imagen sea clara y muestre todos los datos de la transacción.'
      );
      break;
    
    default:
      htmlContent = '<h1>Tipo de email no válido</h1><p>Usa: ?type=user, ?type=user-pack, ?type=admin, ?type=admin-pack, o ?type=rejection</p>';
  }

  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 