'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const MakeAdminButton = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!session) {
    return null;
  }

  // No mostrar el botón si ya es admin
  if (session.user.role === 'admin') {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
        <p className="text-green-700 text-sm">Ya eres administrador</p>
      </div>
    );
  }

  const handleMakeAdmin = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al convertirse en administrador');
      }

      setMessage(data.message);
      
      // Actualizar la sesión para reflejar el nuevo rol
      await update();
      
      // Recargar la página después de un breve retraso
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-gray-200 p-4 rounded-md bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de administrador</h3>
      <p className="text-sm text-gray-600 mb-4">
        Si necesitas privilegios de administrador, puedes activarlos con el siguiente botón.
      </p>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <button
        onClick={handleMakeAdmin}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
      >
        {isLoading ? 'Procesando...' : 'Convertirme en administrador'}
      </button>
    </div>
  );
};

export default MakeAdminButton; 