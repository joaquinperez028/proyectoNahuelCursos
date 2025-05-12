'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  price: number;
  userHasCourse: boolean;
}

const EnrollButton = ({ courseId, price, userHasCourse }: EnrollButtonProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setIsEnrolling(true);
    setError('');

    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al inscribirse en el curso');
      }

      // Actualizar la UI y mostrar un mensaje de éxito
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ha ocurrido un error inesperado');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Formatear el precio
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);

  if (userHasCourse) {
    return (
      <button 
        className="w-full bg-[var(--success)] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center cursor-default"
        disabled
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
        </svg>
        Ya inscrito
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={isEnrolling}
        className="w-full bg-[var(--accent)] text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-70 disabled:transform-none flex items-center justify-center"
      >
        {isEnrolling ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Comprar por {formattedPrice}
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </p>
        </div>
      )}

      {!session && (
        <p className="mt-3 text-sm text-[var(--neutral-400)] text-center">
          Debes iniciar sesión para comprar este curso
        </p>
      )}
    </div>
  );
};

export default EnrollButton; 