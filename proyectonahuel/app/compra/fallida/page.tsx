'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CompraFallida() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const courseId = searchParams.get('course_id');

  // Redireccionamiento automático después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (courseId) {
        router.push(`/cursos/${courseId}`);
      } else {
        router.push('/cursos');
      }
    }, 10000);

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router, courseId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-md w-full p-8 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--neutral-100)] mb-2">Pago No Completado</h1>
        
        <p className="text-[var(--neutral-300)] mb-6">
          Tu pago no pudo ser procesado correctamente. Por favor, intenta nuevamente.
        </p>
        
        <div className="space-y-4">
          <p className="text-[var(--neutral-400)] text-sm">
            Serás redirigido automáticamente en {countdown} segundos...
          </p>
          
          <div className="flex flex-col space-y-3">
            {courseId && (
              <Link 
                href={`/cursos/${courseId}`}
                className="px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white font-medium rounded-lg transition-colors"
              >
                Intentar Nuevamente
              </Link>
            )}
            
            <Link 
              href="/cursos"
              className="px-4 py-2 bg-[var(--neutral-800)] hover:bg-[var(--neutral-700)] text-[var(--neutral-200)] font-medium rounded-lg transition-colors"
            >
              Ver Todos los Cursos
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