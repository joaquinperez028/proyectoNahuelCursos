'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'AccessDenied':
        return {
          title: 'Acceso Denegado',
          message: 'La autenticación con Google fue rechazada. Esto puede ocurrir si no permitiste el acceso o hay un problema con la configuración.',
          solution: 'Intenta iniciar sesión nuevamente y asegúrate de permitir todos los permisos solicitados.'
        };
      case 'Configuration':
        return {
          title: 'Error de Configuración',
          message: 'Hay un problema con la configuración de autenticación en el servidor.',
          solution: 'Contacta al administrador del sitio para reportar este problema.'
        };
      case 'Callback':
        return {
          title: 'Error en el Callback',
          message: 'Hubo un problema durante el proceso de autenticación.',
          solution: 'Intenta nuevamente más tarde o utiliza otro método de inicio de sesión.'
        };
      default:
        return {
          title: 'Error de Autenticación',
          message: 'Ocurrió un error inesperado durante el proceso de autenticación.',
          solution: 'Intenta nuevamente más tarde o contacta al administrador del sitio.'
        };
    }
  };

  const errorDetails = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {errorDetails.title}
          </h1>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">
            {errorDetails.message}
          </p>
          <p className="text-gray-600 mb-6">
            <strong>Solución sugerida:</strong> {errorDetails.solution}
          </p>
          <div className="flex flex-col space-y-3">
            <Link href="/auth/login" className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Volver a intentar iniciar sesión
            </Link>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 