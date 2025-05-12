'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CertificateButtonProps {
  courseId: string;
}

const CertificateButton = ({ courseId }: CertificateButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  
  // Verificar si el curso está completado al cargar el componente
  useEffect(() => {
    const checkProgress = async () => {
      try {
        if (!courseId) return;
        
        const response = await fetch(`/api/progress/check?courseId=${courseId}`);
        
        if (!response.ok) {
          console.error('Error al verificar progreso:', response.statusText);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCourseCompleted(data.progress.isCompleted);
          
          // Si ya hay un certificado, mostrar el enlace
          if (data.progress.certificateIssued && data.progress.certificateUrl) {
            setCertificateUrl(data.progress.certificateUrl);
          }
        }
      } catch (error) {
        console.error('Error al verificar progreso:', error);
      }
    };
    
    checkProgress();
    
    // Escuchar evento de curso completado
    const handleCourseCompleted = (event: CustomEvent) => {
      if (event.detail?.courseId === courseId) {
        setCourseCompleted(true);
      }
    };
    
    window.addEventListener('courseCompleted', handleCourseCompleted as EventListener);
    
    return () => {
      window.removeEventListener('courseCompleted', handleCourseCompleted as EventListener);
    };
  }, [courseId]);
  
  // Generar certificado
  const generateCertificate = async () => {
    if (!courseId) {
      setError('ID de curso no válido');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCertificateUrl(data.certificateUrl);
      } else {
        setError(data.error || 'Error al generar el certificado');
      }
    } catch (error) {
      console.error('Error al generar certificado:', error);
      setError(error instanceof Error ? error.message : 'Error al generar el certificado. Inténtalo de nuevo más tarde.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Si el curso no está completado, no mostrar nada
  if (!courseCompleted) {
    return null;
  }
  
  return (
    <div className="mt-6 border border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
            ¡Felicidades! Has completado este curso
          </h3>
          <div className="mt-2">
            <p className="text-sm text-green-700 dark:text-green-400">
              Ya puedes descargar tu certificado de finalización que acredita tus conocimientos.
            </p>
          </div>
          
          {/* Error */}
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          
          <div className="mt-4">
            {!certificateUrl ? (
              <button
                onClick={generateCertificate}
                disabled={isGenerating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isGenerating ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando certificado...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Generar certificado
                  </>
                )}
              </button>
            ) : (
              <Link
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Descargar certificado
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateButton; 