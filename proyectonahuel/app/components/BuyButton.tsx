'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthModal from './AuthModal';

interface BuyButtonProps {
  courseId: string;
  userHasCourse: boolean;
  className?: string;
}

export default function BuyButton({
  courseId,
  userHasCourse,
  className = ''
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handlePurchase = async () => {
    // Verificar si el usuario está autenticado
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      setLoading(true);
      
      // Crear preferencia de pago en MercadoPago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear preferencia de pago');
      }

      // Obtener la URL de pago de MercadoPago
      const data = await response.json();
      
      // Redirigir al usuario a la página de pago
      window.location.href = data.init_point;
      
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      alert('No se pudo procesar tu compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario ya tiene el curso, mostrar un botón de "Ver curso"
  if (userHasCourse) {
    return (
      <button
        onClick={() => router.push(`/mis-cursos/${courseId}`)}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center ${className}`}
        disabled={loading}
      >
        Ver curso
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handlePurchase}
        className={`bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center ${loading ? 'opacity-75' : ''} ${className}`}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>Comprar Curso</span>
          </div>
        )}
      </button>
      
      {/* Modal de autenticación */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          courseId={courseId}
        />
      )}
    </>
  );
} 