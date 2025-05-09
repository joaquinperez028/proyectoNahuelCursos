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

  if (userHasCourse) {
    return (
      <button 
        className="w-full bg-green-600 text-white py-3 rounded-md font-medium cursor-default"
        disabled
      >
        Ya inscrito
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={isEnrolling}
        className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
      >
        {isEnrolling ? 'Procesando...' : `Comprar por $${price.toFixed(2)}`}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default EnrollButton; 