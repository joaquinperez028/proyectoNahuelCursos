'use client';

import { useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Verificar si hay un curso pendiente en sessionStorage después de iniciar sesión
  useEffect(() => {
    const handleRedirectAfterLogin = () => {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      }
    };

    // Comprobamos si el usuario ya inició sesión
    if (window.location.href.includes('?session=')) {
      handleRedirectAfterLogin();
    }
  }, [router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--neutral-100)] mb-2">Iniciar Sesión</h1>
          <p className="text-[var(--neutral-400)]">
            Accede a tu cuenta para comprar cursos y seguir aprendiendo
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white text-gray-800 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-medium">Continuar con Google</span>
          </button>
        </div>

        <div className="mt-8 text-center text-[var(--neutral-400)]">
          <p>
            Al iniciar sesión, aceptas nuestros{' '}
            <Link href="/terminos" className="text-[var(--primary)] hover:underline">
              Términos y Condiciones
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--neutral-100)] mb-2 text-center">Cargando...</h1>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 