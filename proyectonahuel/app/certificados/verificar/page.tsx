'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyCertificatePage() {
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const verifyCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      setError('Por favor, ingresa un ID de certificado');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);
    
    try {
      const response = await fetch(`/api/certificates/verify?id=${encodeURIComponent(certificateId)}`);
      const data = await response.json();
      
      if (response.ok) {
        setVerificationResult(data);
      } else {
        setError(data.error || 'Error al verificar el certificado');
      }
    } catch (error) {
      console.error('Error al verificar certificado:', error);
      setError('Error al verificar el certificado. Inténtalo de nuevo más tarde.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Fecha no válida';
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--neutral-100)] sm:text-4xl">
          Verificar certificado
        </h1>
        <p className="mt-4 text-lg text-[var(--neutral-300)]">
          Comprueba la autenticidad de un certificado emitido por nuestra plataforma.
        </p>
      </div>
      
      <div className="bg-[var(--card)] p-6 rounded-lg shadow-lg border border-[var(--border)]">
        <form onSubmit={verifyCertificate} className="space-y-6">
          <div>
            <label htmlFor="certificateId" className="block text-sm font-medium text-[var(--neutral-200)]">
              ID del certificado
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="certificateId"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Ingresa el ID del certificado a verificar"
                className="block w-full px-4 py-3 bg-[var(--neutral-800)] border border-[var(--border)] rounded-md shadow-sm focus:border-[var(--primary)] focus:ring focus:ring-[var(--primary-light)] focus:ring-opacity-50 text-[var(--neutral-100)]"
              />
            </div>
            <p className="mt-2 text-sm text-[var(--neutral-400)]">
              El ID se encuentra en el certificado, usualmente con el formato: "Certificado ID: XXXXXXXXXXXX"
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                isVerifying ? 'bg-[var(--primary-dark)]' : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]`}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                'Verificar certificado'
              )}
            </button>
          </div>
        </form>
        
        {/* Resultado de la verificación */}
        {verificationResult && (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            {verificationResult.valid ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-500">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 className="text-xl font-semibold">Certificado válido</h3>
                </div>
                
                <div className="bg-[var(--card-alt)] border border-[var(--border)] rounded-lg p-4">
                  <dl className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <dt className="text-[var(--neutral-400)] text-sm">ID del certificado:</dt>
                      <dd className="text-[var(--neutral-200)] font-medium sm:col-span-2">{verificationResult.data.certificateId}</dd>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <dt className="text-[var(--neutral-400)] text-sm">Estudiante:</dt>
                      <dd className="text-[var(--neutral-200)] font-medium sm:col-span-2">{verificationResult.data.studentName}</dd>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <dt className="text-[var(--neutral-400)] text-sm">Curso:</dt>
                      <dd className="text-[var(--neutral-200)] font-medium sm:col-span-2">{verificationResult.data.courseName}</dd>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <dt className="text-[var(--neutral-400)] text-sm">Fecha de finalización:</dt>
                      <dd className="text-[var(--neutral-200)] font-medium sm:col-span-2">{formatDate(verificationResult.data.completedAt)}</dd>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <dt className="text-[var(--neutral-400)] text-sm">Fecha de emisión:</dt>
                      <dd className="text-[var(--neutral-200)] font-medium sm:col-span-2">{formatDate(verificationResult.data.issuedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="text-xl font-semibold">Certificado no válido</h3>
                  <p className="text-[var(--neutral-400)] mt-1">{verificationResult.message || 'Este certificado no es válido o no existe en nuestra base de datos.'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-[var(--primary)] hover:text-[var(--primary-dark)] text-sm">
          Volver a la página principal
        </Link>
      </div>
    </div>
  );
} 