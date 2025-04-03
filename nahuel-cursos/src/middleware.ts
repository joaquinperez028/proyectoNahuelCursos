import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware básico para manejar redirecciones y configuraciones basadas en solicitudes
export function middleware(request: NextRequest) {
  // Puedes personalizar esto según las necesidades de tu aplicación
  return NextResponse.next();
}

// Ver: https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  // Especificamos las rutas donde queremos que se ejecute el middleware
  matcher: [
    // Omite rutas estáticas y de API que no necesitan middleware
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 