'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CompraPendienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const courseId = searchParams ? searchParams.get('course_id') : null;

  // Redireccionamiento automático después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/mis-cursos');
    }, 10000);

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-md w-full p-8 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--neutral-100)] mb-2">Pago Pendiente</h1>
        
        <p className="text-[var(--neutral-300)] mb-6">
          Tu pago está siendo procesado. Una vez confirmado, te enviaremos un correo electrónico y tendrás acceso al curso.
        </p>
        
        <div className="space-y-4">
          <p className="text-[var(--neutral-400)] text-sm">
            Serás redirigido automáticamente en {countdown} segundos...
          </p>
          
          <div className="flex flex-col space-y-3">
            <Link 
              href="/mis-cursos"
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-lg transition-colors"
            >
              Ver Mis Cursos
            </Link>
            
            <Link 
              href="/cursos"
              className="px-4 py-2 bg-[var(--neutral-800)] hover:bg-[var(--neutral-700)] text-[var(--neutral-200)] font-medium rounded-lg transition-colors"
            >
              Explorar Más Cursos
            </Link>
            
            <Link 
              href="/"
              className="px-4 py-2 border border-[var(--border)] hover:bg-[var(--neutral-900)] text-[var(--neutral-300)] font-medium rounded-lg transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompraPendiente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="max-w-md w-full p-8 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--neutral-100)] mb-2">Cargando...</h1>
        </div>
      </div>
    }>
      <CompraPendienteContent />
    </Suspense>
  );
} 