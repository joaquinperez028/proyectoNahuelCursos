'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSpinner, FaGoogle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

// Componente que usa useSearchParams envuelto en Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/cursos';
  const reason = searchParams.get('reason');
  const { status } = useSession();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(redirect);
    }
  }, [status, router, redirect]);
  
  // Mostrar mensaje según la razón de redirección
  useEffect(() => {
    if (reason === 'sync') {
      setInfoMessage('Tu sesión necesita sincronizarse. Por favor, inicia sesión nuevamente para actualizar tu información.');
    }
  }, [reason]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      await signIn('google', {
        callbackUrl: redirect
      });
      
    } catch (err) {
      console.error('Error en login con Google:', err);
      setError('Ocurrió un error durante el inicio de sesión con Google');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold !text-white">Inicia Sesión</h1>
        <p className="mt-2 !text-white">
          Accede a tu cuenta para ver y comprar cursos
        </p>
      </div>
      
      <div className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {infoMessage && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm flex items-start">
            <FaExclamationTriangle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Actualización de sesión necesaria</p>
              <p>{infoMessage}</p>
            </div>
          </div>
        )}
        
        {/* Mensaje informativo sobre el proceso de inicio de sesión */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm flex items-start">
          <FaInfoCircle className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Información importante</p>
            <p>Al iniciar sesión con Google, crearemos automáticamente una cuenta para ti si es tu primera vez. 
            No es necesario registrarse previamente.</p>
          </div>
        </div>
        
        {/* Botón de Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex justify-center items-center bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-lg transition-colors font-medium shadow-sm border border-gray-300"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              <span>Conectando con Google...</span>
            </>
          ) : (
            <>
              <FaGoogle className="text-red-500 mr-3" />
              <span>Iniciar sesión con Google</span>
            </>
          )}
        </button>
        
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">O</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        
        <div className="text-center">
          <p className="text-sm !text-white mb-4">
            Al iniciar sesión, aceptas nuestros{' '}
            <Link href="/terminos" className="text-green-400 hover:text-blue">
              términos y condiciones
            </Link>
            {' '}y{' '}
            <Link href="/privacidad" className="text-green-400 hover:text-blue">
              política de privacidad
            </Link>
          </p>
          
          <Link href="/" className="text-sm text-green-400 hover:text-blue block mt-4">
            Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function Login() {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
} 