'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  onClose: () => void;
  courseId: string;
}

export default function AuthModal({ onClose, courseId }: AuthModalProps) {
  const router = useRouter();

  // Función para manejar el cierre al hacer clic fuera del modal
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Manejar inicio de sesión
  const handleSignIn = () => {
    // Almacenar el ID del curso en sessionStorage para recuperarlo después del login
    sessionStorage.setItem('redirectAfterLogin', `/cursos/${courseId}`);
    signIn(undefined, { callbackUrl: `/cursos/${courseId}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="relative bg-[var(--card)] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 border border-[var(--border)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Botón para cerrar el modal */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--neutral-400)] hover:text-[var(--neutral-100)] transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        {/* Contenido del modal */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--neutral-100)] mb-3">Debes iniciar sesión</h2>
          
          <p className="text-[var(--neutral-300)] mb-6">
            Para comprar este curso, necesitas iniciar sesión en tu cuenta. Si no tienes una cuenta, puedes registrarte ahora.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full py-2.5 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white font-medium rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[var(--neutral-800)] hover:bg-[var(--neutral-700)] text-[var(--neutral-200)] font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 